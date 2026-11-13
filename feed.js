/* Photo discovery, adapted from Victory Park's unified gesture contract. */
(() => {
  "use strict";
  const D = window.ENCYCLOPEDIA_FEED_DATA;
  if(!D){document.querySelector('#app').innerHTML='<h1>Не удалось открыть ленту</h1><p>Проверьте соединение и повторите загрузку.</p><button class="btn pri" id="feed-retry-load">Повторить</button>';document.querySelector('#feed-retry-load').onclick=()=>location.reload();return;}
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const keys = {models:"attrenc.ll", objects:"attrenc.ideas.v1", compare:"attrenc.cmp"};
  const records = Object.fromEntries(["models","objects"].map(k=>[k,new Map(D[k].map(x=>[x.id,x]))]));
  let memory = {}, storageBlocked = false, failed = new Set(), undo = null, gesture = null, pointers = new Set(), lastTap = null, toastTimer;
  const read = (key, fallback) => { if(storageBlocked&&Object.hasOwn(memory,key))return memory[key];try { const v=localStorage.getItem(key); return v===null ? fallback : JSON.parse(v); } catch { storageBlocked=true; return memory[key] ?? fallback; } };
  const write = (key, value) => {memory[key]=value;try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{storageBlocked=true;return false;}};
  const readList = kind => {const v=read(keys[kind],[]);return Array.isArray(v)?[...new Set(v.filter(x=>typeof x==="string"))]:[];};
  const isSaved = (kind,id) => readList(kind).includes(id);
  const initial=read("attrenc.feed.v1",{});
  let state={mode:initial?.mode==="objects"?"objects":"models",models:{id:null,q:"",group:"",...(initial?.models||{})},objects:{id:null,q:"",group:"",...(initial?.objects||{})}};
  for(const kind of ["models","objects"]){for(const key of ["id","q","group"])if(typeof state[kind][key]!=="string")state[kind][key]="";}
  let revision=0, catalogPromise=null, appReady=false;
  const scriptLoads = new Map();
  function script(url) {
    if(scriptLoads.has(url))return scriptLoads.get(url);
    const p=new Promise((resolve,reject)=>{const el=document.createElement("script");el.src=url;el.onload=resolve;el.onerror=()=>{scriptLoads.delete(url);el.remove();reject(Error("load"));};document.head.appendChild(el);});
    scriptLoads.set(url,p);return p;
  }
  function toast(message) {
    let el=$("#feed-toast");
    if(!el){el=document.createElement("div");el.id="feed-toast";el.className="feed-toast";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.append(el);}
    el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},5000);
  }
  function counts() {
    const ll=$("#llc"), ideas=$("#ideasc"), compare=$("#cmpc");
    if(ll)ll.textContent=readList("models").length;
    if(ideas)ideas.textContent=readList("objects").length;
    if(compare){compare.textContent=readList("compare").length+"/6";compare.setAttribute("aria-label","В сравнении: "+readList("compare").length+" из 6");}
  }
  function setSaved(kind,id,value,{decision=false}={}) {
    const list=readList(kind), next=value?[...new Set([...list,id])]:list.filter(x=>x!==id);
    return commitList(kind,next,{decision});
  }
  function commitList(kind,next,{decision=false}={}) {
    if(!decision)undo=null;
    const ok=write(keys[kind],next);
    revision++;write("attrenc.feed.change",String(Date.now())+"-"+Math.random());
    counts();
    if(window.EncyclopediaCatalog)window.EncyclopediaCatalog.sync();
    if(!ok)toast("Браузер не сохраняет данные. Выбор останется только до закрытия этой страницы.");
    return next;
  }
  function persist(){write("attrenc.feed.v1",state);}
  function currentList() {
    const s=state[state.mode], query=s.q.toLocaleLowerCase("ru").trim();
    return D[state.mode].filter(x=>!failed.has(x.photo)&&(!s.group||x.group===s.group)&&(!query||(x.name+" "+x.byline+" "+x.type).toLocaleLowerCase("ru").includes(query)));
  }
  function current() {const list=currentList(), id=state[state.mode].id;return list.find(x=>x.id===id)||(!id?list[0]:null);}
  function normalize() {const list=currentList(),s=state[state.mode];if(!s.id&&list.length)s.id=list[0].id;else if(s.id!=="__end__"&&!list.some(x=>x.id===s.id))s.id=list[0]?.id||"";persist();}
  function move(delta) {
    const list=currentList(),s=state[state.mode];let i=list.findIndex(x=>x.id===s.id);
    if(s.id==="__end__")i=list.length;
    const n=Math.max(0,Math.min(list.length,i+delta));
    s.id=list[n]?.id||(list.length?"__end__":"");lastTap=null;persist();renderCard();
  }
  function decide(save) {
    const c=current();if(!c)return;
    const was=isSaved(state.mode,c.id), before=readList(state.mode);
    if(save)setSaved(state.mode,c.id,true,{decision:true});
    undo={mode:state.mode,id:c.id,was,changed:save&&!was,after:JSON.stringify(readList(state.mode)),revision};
    if(!save)undo.after=JSON.stringify(before);
    move(1);toast(save?"Сохранено. Следующая карточка.":"Пропущено. Сохраненный выбор не изменился.");
  }
  function undoDecision() {
    if(!undo)return;
    const u=undo;undo=null;state.mode=u.mode;
    if(u.changed&&revision===u.revision&&JSON.stringify(readList(u.mode))===u.after)setSaved(u.mode,u.id,u.was,{decision:true});
    state[u.mode].id=u.id;persist();mount("");toast("Вернулись к предыдущей карточке.");
  }
  function toggleCurrent() {const c=current();if(!c)return;const value=!isSaved(state.mode,c.id);setSaved(state.mode,c.id,value);renderCard();toast(value?(state.mode==="models"?"Модель добавлена в лонг-лист.":"Объект добавлен в идеи."):"Убрано из подборки.");}
  const icon = name => {
    const paths={left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',undo:'<path d="M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',cross:'<path d="m6 6 12 12M18 6 6 18"/>'};
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
  };
  function html() {
    return '<section class="feed" aria-label="Лента аттракционов"><div class="feed-intro"><h1>Аттракционы в фотографиях</h1><p>Энциклопедия для подбора оборудования и идей для парков.</p></div>'+
      '<div class="feed-toolbar"><div class="feed-modes" role="group" aria-label="Что смотреть"><button type="button" id="feed-mode-models" data-feed-action="mode" data-mode="models" aria-pressed="'+(state.mode==="models")+'">Модели<span>для подбора</span></button><button type="button" id="feed-mode-objects" data-feed-action="mode" data-mode="objects" aria-pressed="'+(state.mode==="objects")+'">Реальные объекты<span>для идей</span></button></div><a class="feed-saved-link" id="feed-saved-link" href="'+(state.mode==="models"?"#/longlist":"#/ideas")+'">'+(state.mode==="models"?"Лонг-лист":"Сохраненные идеи")+'</a></div>'+
      '<div class="feed-context"><span id="feed-position"></span><button class="feed-text" type="button" data-feed-action="filters" aria-expanded="false" aria-controls="feed-filters">Фильтры</button><button class="feed-text" type="button" data-feed-action="help" aria-expanded="false" aria-controls="feed-help">Как листать</button></div>'+
      '<div class="feed-filters" id="feed-filters" hidden><label>Найти в ленте<input id="feed-query" type="search" autocomplete="off" value="'+esc(state[state.mode].q)+'" placeholder="Название или производитель"></label><label>Тип<select id="feed-group"><option value="">Все типы</option>'+[...new Set(D[state.mode].map(x=>x.group))].sort((a,b)=>a.localeCompare(b,"ru")).map(g=>'<option value="'+esc(g)+'" '+(state[state.mode].group===g?'selected':'')+'>'+esc(g)+'</option>').join("")+'</select></label><button class="btn" type="button" data-feed-action="reset">Сбросить</button></div>'+
      '<div class="feed-help" id="feed-help" hidden><p>На фотографии: вверх и вниз смотреть, вправо сохранить, влево пропустить. Пропуск не удаляет сохраненное. Двойной тап только сохраняет. Те же действия доступны кнопками.</p><p>Сфокусируйте фотографию клавишей Tab: стрелки вверх и вниз листают, вправо сохраняет, влево пропускает. Колесо мыши прокручивает страницу. Последний свайп можно отменить.</p></div>'+
      '<div id="feed-card-host"></div><div class="feed-under"><p>Только записи с фотографиями. В полном каталоге также есть модели без фото.</p><a href="#/catalog">Открыть полный каталог</a></div></section>';
  }
  function focusedId(){return document.activeElement?.id||"";}
  function restoreFocus(id){if(id){const el=document.getElementById(id);if(el)el.focus({preventScroll:true});}}
  function renderCard() {
    const host=$("#feed-card-host");if(!host)return;
    const focus=focusedId(), c=current(), list=currentList(), s=state[state.mode];
    const position=$("#feed-position");
    position.textContent=c?((list.findIndex(x=>x.id===c.id)+1)+" из "+list.length+" · "+(state.mode==="models"?"моделей":"объектов")):(list.length?"Вы посмотрели подборку":"По этим условиям ничего не найдено");
    if(!c) {
      host.innerHTML='<div class="feed-empty"><h2>'+(list.length?"Подборка просмотрена":"Не нашли подходящих фотографий")+'</h2><p>'+(list.length?"Сохраненное осталось в вашей подборке. Можно вернуться к началу или открыть полный каталог.":"Попробуйте другой запрос, сбросьте фильтры или откройте полный каталог.")+'</p><div class="actions"><button class="btn pri" data-feed-action="'+(list.length?"restart":"reset")+'">'+(list.length?"С начала":"Сбросить фильтры")+'</button><a class="btn" href="'+(state.mode==="models"?"#/longlist":"#/ideas")+'">Открыть подборку</a><a class="btn" href="#/catalog">Каталог</a></div><button class="btn" id="feed-undo" data-feed-action="undo" '+(!undo?'disabled':'')+'>Отменить последний свайп</button></div>';
      restoreFocus(focus);return;
    }
    const saved=isSaved(state.mode,c.id), index=list.findIndex(x=>x.id===c.id);
    host.innerHTML='<article class="feed-card" data-feed-id="'+esc(c.id)+'"><div class="feed-photo" id="feed-stage" tabindex="0" role="group" aria-label="Фотография: '+esc(c.name)+'. Стрелки вверх и вниз листают, вправо сохраняет, влево пропускает.">'+
      '<img id="feed-image" src="'+esc(c.photo)+'" alt="'+esc(c.alt||c.name)+'" fetchpriority="high" decoding="async" draggable="false"><div class="feed-gesture-label" aria-hidden="true"></div>'+
      '<button class="feed-heart" type="button" id="feed-heart" data-feed-action="save" aria-label="'+(saved?"Убрать из подборки":"Сохранить в подборку")+'" aria-pressed="'+saved+'">'+icon("heart")+'</button></div>'+
      '<div class="feed-info"><h2>'+esc(c.name)+'</h2><p class="feed-byline">'+esc((state.mode==="models"?"Модель · ":"Объект · ")+c.byline)+'</p><p class="feed-type">'+esc(c.type)+'</p>'+
      (c.summary?'<p class="feed-summary">'+esc(c.summary)+'</p>':'')+
      '<dl class="feed-facts">'+c.facts.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join("")+'</dl>'+
      '<p class="feed-photo-note">'+esc(c.note||"Фотография из источника карточки.")+'</p>'+
      '<p class="feed-source"><a href="'+esc(c.source||c.sourcePage)+'" target="_blank" rel="noopener">Источник фото</a>'+(c.author?' · '+esc(c.author):'')+(c.license?' · <a href="'+esc(c.licenseUrl||c.source)+'" target="_blank" rel="noopener">'+esc(c.license)+'</a>':'')+'</p>'+
      '<div class="feed-primary"><button id="feed-save" class="btn '+(saved?'on':'pri')+'" data-feed-action="save" aria-pressed="'+saved+'">'+icon("heart")+(saved?'Сохранено':'Сохранить')+'</button><button id="feed-skip" class="btn" data-feed-action="skip">'+icon("cross")+'Пропустить</button><button id="feed-details" class="btn" data-model="'+esc(state.mode==="models"?c.id:"")+'" data-feed-action="details">Подробнее</button></div>'+
      '<div class="feed-paging"><button id="feed-prev" class="feed-icon" data-feed-action="prev" aria-label="Предыдущая карточка" '+(index===0?'disabled':'')+'>'+icon("left")+'</button><button id="feed-undo" class="feed-text" data-feed-action="undo" '+(!undo?'disabled':'')+'>Отменить свайп</button><button id="feed-next" class="feed-icon" data-feed-action="next" aria-label="Следующая карточка">'+icon("right")+'</button></div></div></article>';
    const img=$("#feed-image");
    img.addEventListener("error",()=>{
      if(!img.isConnected)return;
      const next=list[index+1];s.id=next?.id||"__end__";failed.add(c.photo);undo=null;normalize();renderCard();toast(next?"Фото не загрузилось. Показываем следующую доступную карточку.":"Фото не загрузилось. Доступные карточки в этой подборке закончились.");
    },{once:true});
    bindGestures($("#feed-stage"));
    const next=list[index+1];
    if(next){const preload=new Image();preload.src=next.photo;}
    restoreFocus(focus);
  }
  function cancelGesture(){gesture=null;lastTap=null;const stage=$("#feed-stage");if(stage){stage.style.removeProperty("--drag-x");stage.style.removeProperty("--drag-y");stage.classList.remove("is-dragging");const label=stage.querySelector(".feed-gesture-label");if(label)label.textContent="";}}
  function bindGestures(stage) {
    stage.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse"&&e.button!==0)return;
      pointers.add(e.pointerId);
      if(pointers.size>1||e.target.closest("button,a")){cancelGesture();return;}
      gesture={id:e.pointerId,x:e.clientX,y:e.clientY,at:e.timeStamp,axis:null,max:0};stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove",e=>{
      const g=gesture;if(!g||g.id!==e.pointerId)return;
      const dx=e.clientX-g.x,dy=e.clientY-g.y;g.max=Math.max(g.max,Math.hypot(dx,dy));
      if(!g.axis&&g.max>12){if(Math.abs(dx)>Math.abs(dy)*1.25)g.axis="x";else if(Math.abs(dy)>Math.abs(dx)*1.25)g.axis="y";}
      if(g.axis==="x"){stage.classList.add("is-dragging");stage.style.setProperty("--drag-x",Math.max(-45,Math.min(45,dx/4))+"px");stage.querySelector(".feed-gesture-label").textContent=dx>0?"Сохранить":"Пропустить";}
      if(g.axis==="y"){stage.style.setProperty("--drag-y",Math.max(-30,Math.min(30,dy/5))+"px");}
    });
    stage.addEventListener("pointerup",e=>{
      pointers.delete(e.pointerId);const g=gesture;if(!g||g.id!==e.pointerId)return;
      const dx=e.clientX-g.x,dy=e.clientY-g.y,c=current();
      const previousTap=lastTap;cancelGesture();
      if(g.axis==="x"&&Math.abs(dx)>=65&&Math.abs(dx)>Math.abs(dy)*1.25){decide(dx>0);return;}
      if(g.axis==="y"&&Math.abs(dy)>=65&&Math.abs(dy)>Math.abs(dx)*1.25){move(dy<0?1:-1);return;}
      if(c&&g.max<8&&e.timeStamp-g.at<280){
        if(previousTap&&previousTap.id===c.id&&e.timeStamp-previousTap.at<330&&Math.hypot(e.clientX-previousTap.x,e.clientY-previousTap.y)<32){setSaved(state.mode,c.id,true);renderCard();toast("Сохранено.");}
        else lastTap={id:c.id,x:e.clientX,y:e.clientY,at:e.timeStamp};
      }
    });
    for(const name of ["pointercancel","lostpointercapture"])stage.addEventListener(name,e=>{pointers.delete(e.pointerId);if(gesture?.id===e.pointerId)cancelGesture();});
    stage.addEventListener("keydown",e=>{
      if(e.target!==stage||e.altKey||e.ctrlKey||e.metaKey)return;
      if(["ArrowDown","ArrowUp","ArrowRight","ArrowLeft"].includes(e.key)){e.preventDefault();if(e.key==="ArrowRight")decide(true);else if(e.key==="ArrowLeft")decide(false);else move(e.key==="ArrowDown"?1:-1);}
    });
  }
  function setMode(mode){state.mode=mode;undo=null;normalize();mount("");$("#feed-mode-"+mode)?.focus({preventScroll:true});}
  function mount(page="") {
    cancelGesture();pointers.clear();counts();
    if(page==="ideas"){renderIdeas();return;}
    const focus=focusedId();normalize();$("#app").innerHTML=html();$("#app").dataset.page="feed";
    renderCard();restoreFocus(focus);markNav("");window.EncyclopediaAnalytics?.pageView();
    $("#feed-query").addEventListener("input",e=>{state[state.mode].q=e.target.value;state[state.mode].id="";undo=null;normalize();renderCard();});
    $("#feed-group").addEventListener("change",e=>{state[state.mode].group=e.target.value;state[state.mode].id="";undo=null;normalize();renderCard();});
  }
  function ideasHTML() {
    const ids=readList("objects"), items=ids.map(id=>records.objects.get(id)).filter(Boolean);
    return '<section class="feed-ideas"><h1>Сохраненные идеи</h1><p class="lead">Реальные объекты, к которым вы хотите вернуться.</p><div class="actions"><a class="btn" href="#/" data-feed-action="browse-objects">Смотреть объекты</a><a class="btn" href="#/longlist">Лонг-лист моделей</a></div>'+
      (!items.length?'<p>Пока ничего не сохранено. Выберите «Реальные объекты» в ленте и нажмите «Сохранить».</p>':'<div class="feed-idea-list">'+items.map(c=>'<article><img src="'+esc(c.photo)+'" alt="'+esc(c.name)+'" width="160" height="110" loading="lazy"><div><h2><a href="'+esc(c.route)+'">'+esc(c.name)+'</a></h2><p>'+esc(c.byline)+'</p><p class="small muted">'+esc(c.note)+'</p></div><button class="btn" data-feed-action="remove-idea" data-id="'+esc(c.id)+'">Убрать</button></article>').join("")+'</div>')+'</section>';
  }
  function renderIdeas(){const f=focusedId();$("#app").innerHTML=ideasHTML();$("#app").dataset.page="ideas";markNav("ideas");restoreFocus(f);window.EncyclopediaAnalytics?.pageView();}
  function markNav(page){for(const el of document.querySelectorAll("#nav a")){const on=el.getAttribute("href")==="#/"+page;el.classList.toggle("on",on);if(on)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");}}
  async function ensureCatalog(keep=false) {
    if(appReady)return window.EncyclopediaCatalog;
    if(catalogPromise)return catalogPromise;
    if(!keep){$("#app").innerHTML='<div class="feed-loading" role="status"><h1>Открываем энциклопедию</h1><p>Загружаем подробные сведения и источники.</p><a href="#/">Вернуться к ленте</a></div>';}
    catalogPromise=(async()=>{
      try{
        await script("catalog-data.js?v=20261113-r09");
        await script("catalog-app.js?v=20261113-r09");
        if(!window.EncyclopediaCatalog)throw Error("app");
        appReady=true;counts();return window.EncyclopediaCatalog;
      }catch(e){catalogPromise=null;if(!keep)$("#app").innerHTML='<h1>Не удалось открыть энциклопедию</h1><p>Проверьте соединение и повторите загрузку. Сохраненный выбор остается в браузере.</p><button class="btn pri" data-feed-action="retry">Повторить</button><a class="btn" href="#/">В ленту</a>';else toast("Не удалось загрузить подробности. Повторите попытку.");throw e;}
    })();return catalogPromise;
  }
  async function details(){const c=current();if(!c)return;persist();if(state.mode==="objects"){location.hash=c.route;return;}toast("Открываем подробности модели…");try{const catalog=await ensureCatalog(true);catalog.openModel(c.id);}catch{}}
  function bootRoute() {
    if(appReady)return;
    const p=location.hash.replace(/^#\/?/,"").split("/")[0];
    if(!p){mount("");return;}
    if(p==="ideas"){renderIdeas();return;}
    ensureCatalog().catch(()=>{});
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-feed-action]");if(!b)return;
    const a=b.dataset.feedAction;
    if(a==="save")toggleCurrent();else if(a==="skip")decide(false);else if(a==="next")move(1);else if(a==="prev")move(-1);else if(a==="undo")undoDecision();else if(a==="details")details();else if(a==="mode")setMode(b.dataset.mode);
    else if(a==="reset"||a==="restart"){state[state.mode]={id:"",q:"",group:""};undo=null;persist();mount("");}
    else if(a==="filters"||a==="help"){const box=$("#feed-"+a),open=box.hidden;box.hidden=!open;b.setAttribute("aria-expanded",String(open));if(open&&a==="filters")$("#feed-query").focus();}
    else if(a==="remove-idea"){setSaved("objects",b.dataset.id,false);renderIdeas();}
    else if(a==="browse-objects"){state.mode="objects";persist();if(location.hash==="#/")mount("");}
    else if(a==="retry")ensureCatalog().catch(()=>{});
  });
  window.addEventListener("storage",e=>{
    if(Object.values(keys).includes(e.key)||e.key===null||e.key==="attrenc.feed.change"){undo=null;revision++;counts();if($("#feed-card-host"))renderCard();else if($("#app")?.dataset.page==="ideas")renderIdeas();}
  });
  window.addEventListener("resize",cancelGesture);
  document.addEventListener("visibilitychange",()=>{if(document.hidden){cancelGesture();pointers.clear();}});
  window.addEventListener("hashchange",bootRoute);
  $("#search-toggle").addEventListener("click",()=>{const top=$(".topin"),show=!top.classList.contains("search-open");top.classList.toggle("search-open",show);$("#search-toggle").setAttribute("aria-expanded",String(show));if(show)$("#q").focus();});
  $("#q").addEventListener("focus",()=>{if(!appReady)ensureCatalog(true).then(c=>{if($("#q").value.trim().length>=2)c.search();}).catch(()=>{});});
  $("#q").addEventListener("input",()=>{if(!appReady&&$("#q").value.trim().length>=2)ensureCatalog(true).then(c=>c.search()).catch(()=>{});});
  window.EncyclopediaFeed={html,mount,ideasHTML,readList,isSaved,setSaved,clearSaved:kind=>commitList(kind,[]),ensureCatalog};
  counts();bootRoute();
  if(storageBlocked)toast("Браузер не сохраняет данные. Подборка доступна до закрытия страницы.");
})();

