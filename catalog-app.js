"use strict";
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const RELEASE=DB.release||window.EncyclopediaFeed?.RELEASE||"20261116-r10";
const PUBLIC_BASE=window.EncyclopediaFeed?.PUBLIC_BASE||"https://konstantinpopov89.github.io/attractions-encyclopedia";

const M=Object.fromEntries(DB.manufacturers.map(m=>[m.id,m]));
const MD=Object.fromEntries(DB.models.map(m=>[m.id,m]));
const TY=Object.fromEntries(DB.taxonomy.types.map(t=>[t.id,t]));
const MECH=DB.mech_categories;const CATS=DB.all_categories;const SECIDS=DB.sections.map(s=>s.id);
function secOf(c){const s=DB.sections.find(s=>s.id!="kids"&&s.cats.includes(c));return s?s.id:"kids"}
function catHref(c){return `#/${secOf(c)}/${encodeURIComponent(c)}`}
const SEG=DB.segments;
const RFS={"поставляет":"s1","через третьи страны":"s2","ушёл":"s3","неизвестно":"s0"};
const fmt=v=>v==null||v===""?"—":(typeof v==="number"?v.toLocaleString("ru-RU"):esc(v));

/* ---------- dynamic <script> chunk loader (works on https://, http://, and file://) ---------- */
const loadedChunks=new Set();
const pendingChunks=new Map();
let DK=DB.dark, DKCASE=Object.fromEntries((DK.cases||[]).map(c=>[c.id,c])), DKSRC=Object.fromEntries((DK.sources||[]).map(s=>[s.id,s]));

window.__mergeDBChunk=function(kind,payload){
 if(kind==="models"){for(const [id,diff] of Object.entries(payload)){if(MD[id]){Object.assign(MD[id],diff);MD[id]._full=true}}}
 else if(kind==="mfrs"){for(const [id,diff] of Object.entries(payload)){if(M[id]){Object.assign(M[id],diff);M[id]._full=true}}}
 else if(kind==="r11"){DB.r11=payload}
 else if(kind==="dark"){DB.dark=payload;DK=DB.dark;DKCASE=Object.fromEntries(DK.cases.map(c=>[c.id,c]));DKSRC=Object.fromEntries(DK.sources.map(s=>[s.id,s]));}
 else if(kind==="editorial"){Object.assign(DB,payload)}
 else if(kind==="sources"){DB.sources=payload}
};

function loadChunk(name){
 if(!name||loadedChunks.has(name))return Promise.resolve();
 if(pendingChunks.has(name))return pendingChunks.get(name);
 const p=window.EncyclopediaFeed.script(`chunks/${name}.js?v=${RELEASE}`).then(()=>{loadedChunks.add(name);pendingChunks.delete(name)}).catch(e=>{pendingChunks.delete(name);throw e});
 pendingChunks.set(name,p);return p;
}
function ensureChunks(names){
 const uniq=[...new Set((names||[]).filter(Boolean))].filter(n=>!loadedChunks.has(n));
 return uniq.length?Promise.all(uniq.map(loadChunk)):Promise.resolve();
}
function modelChunksForIds(ids){
 return [...new Set((ids||[]).map(id=>MD[id]?._chunk).filter(Boolean))];
}

const KIND={manufacturer_site:"сайт производителя",search_snippet:"поисковый сниппет, страница не открывалась",dealer:"дилер",rcdb:"RCDB, база энтузиастов",news:"новость",wiki:"вики",catalog_kp:"КП из рабочего каталога",archive:"копия страницы производителя в веб-архиве (сайт не открылся)",pdf:"брошюра производителя",coasterpedia:"Coasterpedia, вики энтузиастов",wikipedia:"Википедия",exhibitor_list:"список экспонентов выставки",law:"текст закона",gov:"публикация ведомства, не текст акта",other:"прочее"};
const kindRu=k=>KIND[k]||k;
function heightUnaccompanied(x){return x.min_height_unaccompanied_cm??(x.min_height_accompanied_cm!=null?x.min_height_cm:null)}
function hFull(x){const a=x.min_height_cm,b=x.min_height_accompanied_cm,u=heightUnaccompanied(x);const r=[];if(u!=null)r.push(`без сопровождения от ${u} см`);if(b!=null)r.push(`со взрослым от ${b} см`);else if(a!=null&&a!==u)r.push(`порог из источника: ${a} см`);return r.length?r.join('; '):null}
function installationExport(i){const u=i.url||(typeof i.source==='string'?i.source:i.source?.url);return [i.place+(i.year?' ('+i.year+')':''),i.version_note,i.status_note,u].filter(Boolean).join(' | ')}
const store={get(k,d){try{let v=localStorage.getItem("attrenc."+k);if(v==null){for(let i=0;i<localStorage.length;i++){const kk=localStorage.key(i)||"";if(/^[a-z]+enc\./.test(kk)&&!kk.startsWith("attrenc.")&&kk.slice(kk.indexOf(".")+1)===k){v=localStorage.getItem(kk);break}}}return JSON.parse(v)??d}catch(e){return d}},set(k,v){try{localStorage.setItem("attrenc."+k,JSON.stringify(v))}catch(e){}}};
let LL=window.EncyclopediaFeed.readList("models").filter(id=>MD[id]);
let CMP=window.EncyclopediaFeed.readList("compare").filter(id=>MD[id]);
function saveLL(){store.set("ll",LL);if($("#llc"))$("#llc").textContent=LL.length}
function saveCMP(){store.set("cmp",CMP);const count=$("#cmpc");if(count){count.textContent=CMP.length+"/6";count.setAttribute("aria-label","В сравнении: "+CMP.length+" из 6")}}
function hideCompareNotice(){const notice=$("#compare-notice");if(notice)notice.hidden=true}
function showCompareNotice(){const notice=$("#compare-notice");if(!notice)return;const host=$("#modal").style.display==="flex"?$(".modal .box"):document.body;host.appendChild(notice);notice.hidden=false}

/* ---------- Non-destructive shared selection contexts (П1) ---------- */
function parseHashAndShare(){
 const raw=location.hash.replace(/^#\/?/,"");
 const qIdx=raw.indexOf("?");
 const pathPart=qIdx>=0?raw.slice(0,qIdx):raw;
 const hp=new URLSearchParams(qIdx>=0?raw.slice(qIdx+1):"");
 const sp=new URLSearchParams(location.search);
 const tok=hp.get("s")||hp.get("share")||sp.get("share")||"";
 const sharedIds=tok?window.EncyclopediaFeed.decodeShareIds(tok):null;
 const segs=pathPart.split("/");
 return {raw,pathPart,page:segs[0]||"",arg:segs.slice(1).join("/"),sharedIds,tok};
}
function activeLLCtx(){
 const {page,sharedIds}=parseHashAndShare();
 if(page==="longlist"&&sharedIds&&sharedIds.length){
  const valid=sharedIds.filter(id=>MD[id]);
  return {isShared:true,ids:valid,ownIds:LL};
 }
 return {isShared:false,ids:LL,ownIds:LL};
}
function activeCMPCtx(){
 const {page,sharedIds}=parseHashAndShare();
 if(page==="compare"&&sharedIds&&sharedIds.length){
  const valid=sharedIds.filter(id=>MD[id]);
  return {isShared:true,ids:valid,ownIds:CMP};
 }
 return {isShared:false,ids:CMP,ownIds:CMP};
}
function activeDKCompareCtx(){
 const {page,sharedIds}=parseHashAndShare();
 if(page==="darkcompare"&&sharedIds&&sharedIds.length){
  const valid=sharedIds.filter(id=>DKCASE[id]);
  return {isShared:true,ids:valid,ownIds:dkCompare};
 }
 return {isShared:false,ids:dkCompare,ownIds:dkCompare};
}
function shareItemUrl(id){return `${PUBLIC_BASE}/s/${encodeURIComponent(id)}/`}
async function shareSingleItem(id,titleText){
 const url=shareItemUrl(id);
 if(navigator.share&&matchMedia("(max-width:760px)").matches){
  try{await navigator.share({title:titleText,url});return}catch(e){if(e&&e.name==="AbortError")return}
 }
 window.EncyclopediaFeed.copyText(url,"Ссылка с превью для Telegram скопирована.");
}
function shareListUrl(pageName,ids){
 const tok=window.EncyclopediaFeed.encodeShareIds(ids);
 return `${PUBLIC_BASE}/#/${pageName}?s=${tok}`;
}
function copyListUrl(pageName,ids){
 window.EncyclopediaFeed.copyText(shareListUrl(pageName,ids),"Ссылка на подборку скопирована.");
}
function copyModelsForChat(label,pageName,ids){
 const xs=ids.map(id=>MD[id]).filter(Boolean);
 if(!xs.length)return;
 const lines=[`${label} (${xs.length}):`,...xs.map((x,i)=>{
  const m=M[x.manufacturer_id]||{};
  const specs=[x.seats!=null?`${x.seats} мест`:"",pphV(x)!=null?`${pphF(x)} чел/ч`:"",x.height_m!=null?`выс. ${x.height_m} м`:""].filter(Boolean).join(", ");
  return `${i+1}. ${x.model} — ${m.short||m.name||x.manufacturer_id}${m.country?` (${m.country})`:""}${specs?` · ${specs}`:""}\n   ${shareItemUrl(x.id)}`;
 }),`Открыть всю подборку: ${shareListUrl(pageName,ids)}`];
 window.EncyclopediaFeed.copyText(lines.join("\n"),"Текстовая сводка для чата скопирована.");
}
function copyDarkForChat(ids){
 const cs=ids.map(id=>DKCASE[id]).filter(Boolean);
 if(!cs.length)return;
 const lines=[`Сравнение дарк-объектов (${cs.length}):`,...cs.map((c,i)=>`${i+1}. ${c.name} (${c.location||c.country}) — ${shareItemUrl(c.id)}`),`Открыть сравнение: ${shareListUrl("darkcompare",ids)}`];
 window.EncyclopediaFeed.copyText(lines.join("\n"),"Сводка объектов для чата скопирована.");
}
function mergeSharedIntoLL(ids){
 const merged=[...new Set([...LL,...ids.filter(id=>MD[id])])];
 window.EncyclopediaFeed.clearSaved("models");
 merged.forEach(id=>window.EncyclopediaFeed.setSaved("models",id,true));
 LL=window.EncyclopediaFeed.readList("models").filter(id=>MD[id]);
 saveLL();
 window.EncyclopediaFeed.toast(`Добавлено в ваш лонг-лист (всего: ${LL.length}).`);
 location.hash="#/longlist";
}
function addAllToLL(ids){
 const merged=[...new Set([...LL,...ids.filter(id=>MD[id])])];
 merged.forEach(id=>window.EncyclopediaFeed.setSaved("models",id,true));
 LL=window.EncyclopediaFeed.readList("models").filter(id=>MD[id]);
 saveLL();
 window.EncyclopediaFeed.toast(`Все позиции сохранены в лонг-лист (${LL.length}).`);
 route(true);
}
function mergeSharedIntoCMP(ids){
 const valid=ids.filter(id=>MD[id]);
 const combined=[...new Set([...CMP,...valid])];
 CMP=combined.slice(0,6);
 saveCMP();
 if(combined.length>6){
  window.EncyclopediaFeed.toast(`В сравнение помещаются первые 6 из ${combined.length}. Остальные можно сохранить в лонг-лист.`);
 }else{
  window.EncyclopediaFeed.toast(`Добавлено в ваше сравнение (${CMP.length}/6).`);
 }
 location.hash="#/compare";
}
function mergeSharedIntoDK(ids){
 const valid=ids.filter(id=>DKCASE[id]);
 const combined=[...new Set([...dkCompare,...valid])];
 dkCompare=combined.slice(0,6);
 localStorage.setItem("dark-case-compare-v1",JSON.stringify(dkCompare));
 window.EncyclopediaFeed.toast(combined.length>6?`Добавлены первые 6 из ${combined.length} объектов (лимит сравнения 6).`:`Добавлено в ваше сравнение объектов (${dkCompare.length}/6).`);
 location.hash="#/darkcompare";
}

function rfBadge(s){s=s||"неизвестно";return `<span class="rf ${RFS[s]||"s0"}"><i></i>${esc(s)}</span>`}
function flags(m,atModel=false){let h="";if(m.is_key)h+=`<span class="tag flag-key">ключевой</span>`;if(m.ostrov&&!atModel)h+=`<span class="tag flag-om">«Остров Мечты»</span>`;if(m.weak)h+=`<span class="tag" title="Основание заметности по правилу реестра источником не подтверждено">слабая запись</span>`;if(m.inactive)h+=`<span class="tag" title="${esc(m.company_status||"")}">${esc(m.inactive_label||"работа не подтверждена")}</span>`;return h}
function mname(id){const m=M[id];return m?`<a href="#/m/${id}" onclick="closeModal(true)">${esc(m.short||m.name)}</a>`:esc(id)}

function photo(md){
 const badges=[];
 if((md.photos_count||0)>=2)badges.push(`<span class="mbadge">${md.photos_count} фото</span>`);
 if((md.videos_count||0)>=1)badges.push(`<span class="mbadge">▶ видео</span>`);
 const badgeHtml=badges.length?`<span class="media-badges">${badges.join("")}</span>`:"";
 if(md.photo_file){
  return `<img loading="lazy" src="${esc(md.photo_file)}" alt="${esc(md.model)}">`+(md.photo_caption_short?`<span class="schl" title="${esc(md.photo_caption||"")}">${esc(md.photo_caption_short)}</span>`:"")+badgeHtml;
 }
 return (DB.schemes[md.type_id]?schemeIcon(md.type_id)+'<span class="schl">схема типа</span>':`<div class="no-model-photo"><span>Фото модели не найдено</span><small>${esc(TY[md.type_id]?.name_ru||"")}</small></div>`)+badgeHtml;
}
function schemeIcon(cat){const s=DB.schemes[cat];return s?s.replace('<svg','<svg aria-hidden="true"'):'<span class="muted small">нет фото</span>'}
function inLL(id){return LL.includes(id)}
function toggleLL(id,ev){if(ev)ev.stopPropagation();window.EncyclopediaFeed.setSaved("models",id,!window.EncyclopediaFeed.isSaved("models",id));LL=window.EncyclopediaFeed.readList("models").filter(x=>MD[x]);saveLL();if($("#modal").style.display==="flex"&&modalModel===id)openModel(id);else route(true)}
function toggleCMP(id,ev){if(ev)ev.stopPropagation();if(!MD[id])return false;if(!CMP.includes(id)&&CMP.length>=6){showCompareNotice();return false}hideCompareNotice();CMP=CMP.includes(id)?CMP.filter(x=>x!==id):[...CMP,id];saveCMP();if($("#modal").style.display==="flex"&&modalModel===id)openModel(id);else route(true);return true}

function goModel(id,ev){
 if(ev&&(ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.button===1))return true;
 if(ev)ev.preventDefault();
 openModel(id,true);
 return false;
}

function mcard(md){const m=M[md.manufacturer_id]||{};return `<div class="mcard" onclick="if(!event.target.closest('button,a'))openModel('${md.id}',true)" style="cursor:pointer">
 <div class="ph">${photo(md)}</div><div class="bd"><a class="ttl" href="#/model/${esc(md.id)}" data-model="${esc(md.id)}" onclick="return goModel('${md.id}',event)">${esc(md.model)}</a>
 <div class="mf">${esc(m.short||md.manufacturer_id)} · ${esc(m.country||"")} ${md.om?`<span class="tag flag-om">в «Острове Мечты»</span>`:''}</div>${md.om?`<div class="small muted">${esc(md.om)}</div>`:''}
 <div>${rfBadge(m.rf_status)}</div>
 <div class="kv"><div>места<b>${fmt(md.seats)}</b></div><div title="${esc(md.pph_src||"")}">чел/час${md.capacity_pph==null&&md.pph_est!=null?" (оценка)":""}<b>${pphF(md)}</b></div><div>рост от<b>${md.min_height_cm&&md.min_height_accompanied_cm?`${md.min_height_cm} / ${md.min_height_accompanied_cm} со взр.`:md.min_height_cm?md.min_height_cm+" см":(md.min_height_accompanied_cm?md.min_height_accompanied_cm+" см со взр.":"—")}</b></div></div>${md.mfr_warning?`<div class="small" style="color:var(--warn)">⚠ ${esc(md.mfr_warning)}</div>`:""}</div>
 <div class="act"><button class="btn ${inLL(md.id)?'on':''}" onclick="toggleLL('${md.id}',event)">${inLL(md.id)?'✓ в лонг-листе':'+ лонг-лист'}</button>
 <button class="btn ${CMP.includes(md.id)?'on':''}" onclick="toggleCMP('${md.id}',event)">${CMP.includes(md.id)?'✓ сравнение':'сравнить'}</button></div></div>`}

const SR=m=>(DB.sanctions&&m&&m.sanc_code)?DB.sanctions.regimes[m.sanc_code]:null;
function sancBlock(m){const r=SR(m);if(!r)return"";return `<h3>Санкционный режим страны</h3><p><b>${esc(r.name_ru)}</b> <span class="st ${r.status=="подтверждено"?"ok":"p2"}">${esc(r.status)}</span></p><p class="small">${esc(r.summary_ru||"")}</p><table class="pt small"><tr><td>Аттракционы (код 9508)</td><td>${esc(r.rides_9508||"—")}</td></tr><tr><td>Запчасти</td><td>${esc(r.parts||"—")}</td></tr><tr><td>Игровые автоматы (код 9504)</td><td>${esc(r.games_9504||"—")}</td></tr></table><p class="small muted">Сверка текста по стране производителя, а не юридическое заключение; страна поставки или сборки может отличаться. ${(r.sources||[]).map(s=>srcLink({url:s.url,title:s.title,kind:s.kind||"law"})+(s.locator?` (${esc(s.locator)})`:"")).join("; ")}</p>`}
const UI_KIND={"manufacturer_archive":"архив производителя","official_product_page":"официальная страница модели","official_distributor":"официальный дистрибьютор","operator_site":"сайт оператора","manufacturer_pdf":"документ производителя","official_distributor_page":"страница официального дистрибьютора","supplier_product_page":"страница поставщика","manufacturer_brochure":"брошюра производителя","official_manual":"официальное руководство","official_product_pdf":"официальный документ модели","official_product_brochure":"официальная брошюра модели","manufacturer_marketplace":"витрина производителя на торговой площадке","manufacturer":"производитель","museum_primary":"публикация музея","engineering_partner_primary":"публикация инженерного партнера","association":"отраслевая ассоциация","curated_primary":"подборка первичных источников"};
function srcLink(s){if(!s)return"—";if(typeof s==="string")return `<a class="src" href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a>`;return s.url?`<a class="src" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title||s.url)}</a>${s.kind?` <span class="muted small">(${esc(UI_KIND[s.kind]||kindRu(s.kind))})</span>`:""}`:esc(s.title||"")}

const QN={S:["сила","qS"],W:["слабость","qW"],O:["возможность","qO"],T:["угроза","qT"],"=":["сведение","qeq"]};const QORD={S:0,W:1,O:2,T:3,"=":4};
const SIDES=[["инвестор","Инвестор"],["эксплуатация","Эксплуатация"],["гость","Гость"]];
function advantagesItems(x){const a=x.competitive_advantages||{};return [...(a.comparisons||[]),...(a.features||[])]}
function advantageSource(i){return srcLink(i.source)}
function advantagesText(x){const a=x.competitive_advantages||{};const items=advantagesItems(x);return items.length?items.map(i=>(i.status==='within_type'?'Сравнение внутри типа: ':'Особенность: ')+i.title+'. '+i.fact+' Когда учитывать: '+i.use_when+' Ограничение: '+i.limit+' Источник: '+(i.source?.url||'параметры карточки')).join('\n'):a.missing||'Недостаточно сведений'}
function advantagesEvidence(x){return advantagesItems(x).map(i=>(i.status==='within_type'?'R1, параметр карточки и медиана типа. ':'Особенность по источнику. ')+(i.source?.url||'источник параметров карточки')+(i.source?.checked_on?' Проверено: '+i.source.checked_on:'')).join('\n')}
function advantagesCompact(x){const a=x.competitive_advantages||{};const items=advantagesItems(x);const scope=a.limit?'<p class="small muted">'+esc(a.limit)+'</p>':'';if(!items.length)return scope+'<span class="muted small">'+esc(a.missing||'Недостаточно сведений')+'</span>';return scope+'<ul>'+items.map(i=>'<li><b>'+esc(i.title)+'</b>: '+esc(i.fact)+(i.use_when?'<p class="small"><b>Когда учитывать:</b> '+esc(i.use_when)+'</p>':'')+(i.limit?'<p class="small muted">'+esc(i.limit)+'</p>':'')+'<p class="small">'+advantageSource(i)+'</p></li>').join('')+'</ul>'}
function advantagesBlock(x,isModel){
 const a=x.competitive_advantages;if(!a)return '';
 const title=isModel?'h3':'h2';
 const one=i=>'<li><b>'+esc(i.title)+'</b><p>'+esc(i.fact)+'</p><p><b>Когда учитывать:</b> '+esc(i.use_when)+'</p><p class="small muted">'+esc(i.limit)+'</p><p class="small">'+advantageSource(i)+'</p></li>';
 let h='<section class="competitive-advantages" id="sec-adv"><'+title+'>Конкурентные преимущества и отличия</'+title+'><p class="small muted">'+esc(a.limit)+'</p>';
 if(x.inactive)h+='<p class="note">Исторический производитель или работа не подтверждена. Сведения ниже не означают возможность нового заказа.</p>';
 if(isModel&&x.model_status)h+='<p class="small"><b>Статус модели:</b> '+esc(x.model_status)+'</p>';
 if(a.comparisons.length)h+='<h4>Числовые преимущества в пределах типа</h4><ul>'+a.comparisons.map(one).join('')+'</ul>';
 if(a.features.length)h+='<h4>Особенности предложения</h4><p class="small muted">Факты взяты из указанных источников. Ситуация применения ниже является редакционным объяснением возможной пользы, а не измеренным эффектом.</p><ul>'+a.features.map(one).join('')+'</ul>';
 if(!a.comparisons.length&&!a.features.length)h+='<p>'+esc(a.missing)+'</p>';
 if(a.research)h+='<details class="small"><summary>Проверка оснований: '+esc(a.research.checked_on)+'</summary><p>'+esc(a.research.reason)+'</p><ul>'+a.research.checked_sources.map(s=>'<li>'+srcLink(s)+'</li>').join('')+'</ul></details>';
 if(isModel)h+='<p class="small"><a href="#/t/'+encodeURIComponent(x.type_id)+'" onclick="closeModal(true)">Открыть другие модели этого типа</a> и сравнить подходящие комплектации.</p>';
 return h+'</section>';
}

function swotSrc(s){if(!s)return"";if(s.book)return ` <span class="muted small">(данные книги: ${esc(s.label||s.book)})</span>`;return " "+srcLink({url:s.url,title:s.title||"источник"})+(s.quote?` <span class="muted small">«${esc(s.quote)}»</span>`:"")+(s.date?` <span class="muted small">${esc(s.date)}</span>`:"")}
function swotMissing(items){const names={S:"сильных сторон",W:"слабых сторон",O:"возможностей",T:"угроз"};const missing=Object.keys(names).filter(q=>!items.some(i=>i.q===q));return missing.length?`<p class="muted small">Для ${missing.map(q=>names[q]).join(", ")} подтвержденных выводов в проверенных источниках недостаточно.</p>`:""}
function swotBlock(items,model){if(!items||!items.length)return `<p class="muted small">SWOT: данных нет.</p>`;
 return `<div class="swot">${SIDES.map(([sd,lbl])=>{const it=items.filter(i=>i.side===sd).sort((a,b)=>QORD[a.q]-QORD[b.q]);return `<div class="sd"><h4>${lbl}</h4>${it.length?`<ul>${it.map(i=>`<li><span class="q ${QN[i.q][1]}">${i.q==="="&&model&&["R1","R2"].includes(i.rule)?"на уровне сравнения":QN[i.q][0]}</span>${esc(i.text)}${model?` <span class="muted small" title="${esc(((DB.r11||{}).rules||{})[i.rule]||"")}">[${esc(i.rule)}]</span>`:swotSrc(i.src)}</li>`).join("")}</ul>`:`<p class="muted small">${model?"данных для сравнения нет":"пунктов с источником нет"}</p>`}${model?"":swotMissing(it)}</div>`}).join("")}</div>`+(model?`<p class="small muted">SWOT модели собран по правилам из данных книги (наведите на номер правила; полностью — в «Методике»). Сравнение — с медианой типа по моделям с цифрой источника; оценки книги «≈» не сравниваются.</p>`:"")}
function srchList(arr){if(!arr||!arr.length)return"";const L={ru:"рус.",en:"англ.",zh:"кит.",tr:"тур.",it:"ит.",de:"нем.",nl:"нид.",fr:"фр.",es:"исп.",ja:"яп.",ko:"кор.",pl:"пол.",sl:"слов.",bg:"болг."};
 return `<details class="small"><summary>Где искали (${arr.length})</summary><ul class="srch">${arr.map(s=>`<li>${esc(s.where)}${s.lang?` · ${esc(L[s.lang]||s.lang)}`:""}${s.query?` · «${esc(s.query)}»`:""} — ${esc(s.result||"")}${s.url?` ${srcLink(s.url)}`:""}${s.checked_on?` (${esc(s.checked_on)})`:""}${s.access==="search_only"?"; выполнен поисковый запрос, содержание найденных страниц здесь не подтверждено":s.access==="legacy_record"?"; запись прежнего исследования, отдельное свидетельство открытия не восстановлено":""}</li>`).join("")}</ul></details>`}
function leadLabel(L){return ({manufacturing:"Срок производства",delivery:"Срок поставки",project:"Срок полного проекта",dispatch:"Срок до отгрузки"})[L.duration_kind]||"Срок (состав не уточнен)"}
function leadRow(md){const L=md.lead||{};if(L.kind==="source")return `${L.duration_kind!=="manufacturing"?`<span class="muted">Изготовление неизвестно. ${esc(leadLabel(L))}: </span>`:""}${esc(L.text)}${L.scope?` <span class="muted small">(${esc(L.scope)})</span>`:""}`;return `<span class="muted">неизвестно — спросить в КП</span>`}
function leadSrc(md){const L=md.lead||{};let h="";if(L.kind==="source"&&L.src)h+=`<div class="small">${esc(leadLabel(L))}: ${srcLink(L.src)}${L.src.date?` <span class="muted">(${esc(L.src.date)})</span>`:""}${L.src.quote?` <span class="muted">«${esc(L.src.quote)}»</span>`:""}</div>`;
 if(L.approx)h+=`<div class="note small"><b>${esc(leadLabel(L.approx))}: ориентир ≈ ${esc(L.approx.text)}</b> — ${esc(L.approx.basis)}; это не срок модели, его нет в выгрузке; спросите срок в КП. Источники: ${L.approx.sources.map(s=>srcLink(s)+(s.date?` <span class="muted">(${esc(s.date)})</span>`:"")).join("; ")}</div>`;
 const N=md.lead_nuances||[];if(N.length)h+=`<div class="small"><b>Нюансы поставки:</b><ul>${N.map(n=>`<li>${esc(n.kind==="assembly"?"монтаж":n.kind)}: ${esc(n.text_ru)} ${srcLink(n.url)}${n.source_date?` <span class="muted">(${esc(n.source_date)})</span>`:""}</li>`).join("")}</ul></div>`;return h}
function rvList(rv){const ORD={"оператор":0,"пресса":1,"гость":2,"от производителя":3};return `<div>${[...rv].sort((a,b)=>(ORD[a.side]??9)-(ORD[b.side]??9)).map(r=>`<div class="rv"><span class="tg">${esc(r.side)}</span>${r.tone?`<span class="tg">${esc(r.tone)}</span>`:""}${esc(r.summary_ru)}${r.quote?` <i>«${esc(r.quote)}»</i>`:""} <span class="muted small">— ${esc(r.platform||"")}${r.installation?`, ${esc(r.installation)}`:""}${r.rating?`, оценка ${esc(r.rating)}`:""}${r.n_reviews?`, ${(r.n_kind==="ratings"||r.evidence_kind==="aggregate_rating")?"оценок на площадке":r.n_kind==="text_reviews"?"текстовых отзывов на площадке":"записей в указанной выборке"}: ${fmt(r.n_reviews)}`:""}${r.n_reviewed?`, прочитано текстов: ${fmt(r.n_reviewed)}`:""}${r.checked_on?`, проверено ${esc(r.checked_on)}`:""}${r.version_note?`, ${esc(r.version_note)}`:""}, ${esc(r.lang||"")}, ${esc(r.date||"без даты")}</span> ${String(r.url||"").startsWith("chat:")?`<span class="muted small">(отраслевой чат, архив ${esc(r.url.slice(5))})</span>`:srcLink(r.url)}</div>`).join("")}</div>`}
function rvBlock(o,scopeNote){if(!o)return `<p class="muted small">${scopeNote||"Отзывы не собирались."}</p>`;const rv=o.reviews||[];
 return (rv.length?rvList(rv):`<p class="small"><b>Подтвержденных публичных отзывов в карточке нет</b>. Это не означает, что отзывов не существует или что оборудование надежно.</p>`)+srchList(o.rv_searched||o.searched)}
function whereMfr(m){const r=m.r11||{};const ex=r.exhibitions||[],dl=r.dealers||[];let h="";
 h+=ex.length?`<div class="small"><b>Выставки и объявления об участии:</b> ${ex.map(e=>`${esc(e.name)} ${esc(e.year||"")}${Number(e.year)<2024?" (раннее упоминание, до периода 2024-2026)":""}${e.city?" ("+esc(e.city)+")":""}${e.booth?", стенд "+esc(e.booth):""}${e.kind?` <span class="muted">[${esc(e.kind)}]</span>`:""}${e.status?` <span class="muted">(${esc(e.status)})</span>`:""}${e.checked_on?` <span class="muted">проверено ${esc(e.checked_on)}</span>`:""} ${srcLink(e.url)}`).join("; ")}</div>`:`<div class="small"><b>Выставки и объявления об участии:</b> <span class="muted">не найдено</span></div>`;
 h+=dl.length?`<div class="small"><b>Дилеры и представители в РФ и СНГ:</b><ul>${dl.map(d=>`<li><span class="tg">${esc(d.status)}</span>${esc(d.region)}: ${esc(d.name||"")} — ${esc(d.basis||"")}${d.date?`, ${esc(d.date)}`:""}${d.checked_on?` <span class="muted">проверено ${esc(d.checked_on)}</span>`:""} ${String(d.url||"").startsWith("chat:")?`<span class="muted">(отраслевой чат, архив ${esc(d.url.slice(5))})</span>`:srcLink(d.url)}</li>`).join("")}</ul><span class="muted">«Наводка» — самозаявление или сайт дилера без подтверждения производителя.</span></div>`:`<div class="small"><b>Дилеры и представители в РФ и СНГ:</b> <span class="muted">не найдено</span></div>`;
 return h+srchList(r.where_searched)}
const FIELD_NAMES={seats:"Число мест",capacity_pph:"Пропускная способность",power_kw:"Мощность",area_m2:"Площадь",height_m:"Высота",min_height_cm:"Минимальный рост",ceiling_height_m:"Высота потолка",type_id:"Тип механизма",type_en:"Тип механизма",e3_category:"Категория",model:"Название",audience:"Назначение",description_ru:"Описание",param_notes:"Уточнение параметров",model_status:"Статус модели",capacity_estimate_exclusion:"Область оценки пропускной способности",spec_source:"Источник параметров",photo_url:"Фото",photo_page:"Источник фото",photo_file:"Фото",extra_sources:"Прочие источники",max_speed_kmh:"Скорость",dimensions_m:"Габариты",train_config:"Состав поезда",pph_est:"Расчет пропускной способности"};
function fieldEvidence(md){const all=md.field_corrections||[];const seen=new Set();const rows=all.filter(x=>{const k=x.field+"|"+x.url;if(seen.has(k))return false;seen.add(k);return true});return rows.length?`<details class="small"><summary>Источники уточненных параметров (${rows.length})</summary><ul>${rows.map(x=>`<li><b>${esc(FIELD_NAMES[x.field]||"Параметры")}</b>: ${esc(x.evidence||"")}${x.applicability?` <span class="muted">${esc(x.applicability)}</span>`:""} ${srcLink(x.url)}</li>`).join("")}</ul></details>`:""}
function specEvidenceText(x){const s=x.spec_source||{};let text=(s.url||s.title||"")+(s.kind?" ("+kindRu(s.kind)+")":"");const refs=[...new Set((x.field_corrections||[]).filter(c=>c.url).map(c=>(FIELD_NAMES[c.field]||"Параметры")+": "+c.url))];return text+(refs.length?"; уточнения: "+refs.join("; "):"")}
let whereModel=function(md){const inst=md.installations||[];const m=M[md.manufacturer_id]||{};
 return (inst.length?`<ul class="small">${inst.map(i=>`<li>${esc(i.place)}${i.country&&!String(i.place).includes(i.country)?", "+esc(i.country):""}${i.year?", "+esc(i.year):""}${i.version_note?` <span class="muted">(${esc(i.version_note)})</span>`:""}${i.status_note?` <span>${esc(i.status_note)}</span>`:""}${i.checked_on?` <span class="muted">проверено ${esc(i.checked_on)}</span>`:""} ${i.status_source?` <span class="muted">статус:</span> ${srcLink(i.status_source)}`:""} ${i.source?srcLink(i.source):md.spec_source?`<span class="muted">источник базовой карточки:</span> ${srcLink(md.spec_source)}`:""}</li>`).join("")}</ul>`:`<p class="small muted">Подтвержденная установка этой версии в проверенных источниках не найдена.</p>`)+srchList(md.where_searched)
 +(md.research_scope_note?`<p class="small muted">${esc(md.research_scope_note)}</p>`:"")+`<div class="small" style="margin-top:6px">Производитель — <a href="#/m/${esc(md.manufacturer_id)}" onclick="closeModal(true)">${esc(m.short||"")}</a>:</div>`+whereMfr(m)};

/* ---------- Multi-photo gallery & Click-to-play Facade Video Player (П2, П3) ---------- */
let activeGalItems=[], activeGalIdx=0;

function renderModelGallery(md){
 const gal=(md.gallery&&md.gallery.length)?md.gallery:(md.photo_file?[{file:md.photo_file,source_url:md.photo_page||md.photo_url||(md.spec_source||{}).url||"",caption:md.photo_caption||md.model,origin_label:md.photo_kind||"заводской кадр",photo_kind:md.photo_kind}]:[]);
 if(!gal.length){
  return `<div class="scheme" id="sec-media">${schemeIcon(md.type_id)}<figcaption>${DB.schemes[md.type_id]?"Редакционная схема механизма типа, не чертеж конкретной модели.":"Иллюстрация конкретной модели в открытых источниках не подтверждена."}</figcaption></div>`;
 }
 activeGalItems=gal;activeGalIdx=0;
 return `<div class="mgal" id="sec-media"><div class="mgal-stage" id="mgal-stage">
  <img id="mgal-img" src="${esc(gal[0].file)}" alt="${esc(gal[0].caption||md.model)}">
  ${gal.length>1?`<span class="mgal-count" id="mgal-count">1 / ${gal.length}</span><button type="button" class="mgal-nav mgal-prev" onclick="stepGal(-1)" aria-label="Предыдущий кадр">‹</button><button type="button" class="mgal-nav mgal-next" onclick="stepGal(1)" aria-label="Следующий кадр">›</button>`:""}
  <span class="mgal-origin" id="mgal-origin">${esc(gal[0].origin_label||"заводской кадр")}</span>
 </div>
 ${gal.length>1?`<div class="mgal-thumbs" role="tablist" aria-label="Ракурсы модели">${gal.map((g,i)=>`<button type="button" class="mgal-th ${i===0?'on':''}" data-gi="${i}" onclick="setGal(${i})" aria-label="Кадр ${i+1}: ${esc(g.origin_label||'')}"><img src="${esc(g.file)}" alt="" loading="lazy"></button>`).join("")}</div>`:""}
 <div class="mgal-meta" id="mgal-meta"></div>
 ${md.photo_note?`<div class="small muted" style="margin-top:4px">Примечание: ${esc(md.photo_note)}</div>`:""}</div>`;
}

function updateGalMeta(){
 const g=activeGalItems[activeGalIdx];if(!g)return;
 const img=$("#mgal-img"),cnt=$("#mgal-count"),orig=$("#mgal-origin"),meta=$("#mgal-meta");
 if(img){img.src=g.file;img.alt=g.caption||"";}
 if(cnt)cnt.textContent=`${activeGalIdx+1} / ${activeGalItems.length}`;
 if(orig)orig.textContent=g.origin_label||"заводской кадр";
 document.querySelectorAll(".mgal-th").forEach((b,i)=>b.classList.toggle("on",i===activeGalIdx));
 if(meta){
  const cap=g.caption?`<b>${esc(g.caption[0].toUpperCase()+g.caption.slice(1))}</b> · `:"";
  const kindWord=g.photo_kind?"Изображение":"Фото";
  const license=g.license?(g.license_url?`<a href="${esc(g.license_url)}" target="_blank" rel="noopener">${esc(g.license)}</a>`:esc(g.license)):"";
  const cc=g.author?` · ${g.author.startsWith("Автор ")?esc(g.author):"Автор: "+esc(g.author)}${license?` (${license})`:""}`:(license?` · ${license}`:"");
  const fileSource=g.source_file_page?` · <a href="${esc(g.source_file_page)}" target="_blank" rel="noopener">Страница файла</a>`:"";
  meta.innerHTML=`${cap}<span class="tag">${esc(g.origin_label||"заводской кадр")}</span> ${kindWord}: ${srcLink(g.source_url)}${cc}${fileSource}`;
 }
}
function setGal(i){if(!activeGalItems.length)return;activeGalIdx=(i+activeGalItems.length)%activeGalItems.length;updateGalMeta();}
function stepGal(d){setGal(activeGalIdx+d);}

function bindGalSwipe(selector="#mgal-stage",count=activeGalItems.length,step=stepGal){
 const st=$(selector);if(!st||count<=1)return;
 let sx=0,sy=0,pid=null;
 st.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;pid=e.pointerId;sx=e.clientX;sy=e.clientY;});
 st.addEventListener("pointerup",e=>{if(pid!==e.pointerId)return;const dx=e.clientX-sx,dy=e.clientY-sy;pid=null;if(Math.abs(dx)>=46&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);});
 st.addEventListener("pointercancel",()=>{pid=null;});
}

function renderVideoBlocks(vids,fallbackPoster){
 if(!vids||!vids.length)return "";
 return `<div id="sec-video">${vids.map((v,idx)=>{
  const poster=fallbackPoster||v.thumb_url||"";
  return `<div class="vblock" data-vidx="${idx}">
   <div class="vstage" id="vstage-${idx}">
    <button type="button" class="vfacade" onclick="mountVideoPlayer(${idx})" aria-label="Воспроизвести видео: ${esc(v.title||v.host_label)}">
     ${poster?`<img class="vposter" src="${esc(poster)}" alt="" loading="lazy" onerror="this.remove()">`:""}
     <div class="vfacade-inner">
      <span class="vplay-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5z"/></svg></span>
      <span class="vtitle">${esc(v.title||"Видео аттракциона")}</span>
      <span class="vsub">Нажмите для запуска плеера (${esc(v.host_label||v.host)}) · без фоновой подгрузки</span>
     </div>
    </button>
   </div>
   <div class="vfoot">
    <span class="muted small"><span class="tag">${esc(v.host_label||v.host)}</span> ${esc(v.note||"Источник видео")}</span>
    <a class="src" href="${esc(v.direct_url)}" target="_blank" rel="noopener noreferrer">Открыть напрямую на ${esc(v.host_label||v.host)} ↗</a>
   </div>
  </div>`;
 }).join("")}</div>`;
}

let activeVideosList=[];
window.mountVideoPlayer=function(idx){
 const v=activeVideosList[idx];const stage=$("#modal").style.display==="flex"?$("#modal #vstage-"+idx):document.getElementById("vstage-"+idx);
 if(!v||!stage)return;
 if(v.host==="direct"){
  stage.innerHTML=`<div class="vplayer-mount"><video controls autoplay playsinline preload="metadata" src="${esc(v.embed_url)}"></video></div>`;
 }else{
  stage.innerHTML=`<div class="vplayer-mount"><iframe src="${esc(v.embed_url)}" title="${esc(v.title||v.host_label)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
 }
};

function stopActiveMedia(){
 document.querySelectorAll(".vplayer-mount video").forEach(v=>{try{v.pause();v.removeAttribute("src");v.load();v.remove();}catch{}});
 document.querySelectorAll(".vplayer-mount iframe").forEach(f=>{try{f.src="about:blank";f.remove();}catch{}});
 document.querySelectorAll(".vplayer-mount").forEach(m=>{try{m.remove();}catch{}});
}

function jumpInModal(secId){
 const el=document.getElementById(secId);
 if(el)el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}

/* ---------- Modal & #/model/<id> deep-linking (П1, П4) ---------- */
let modalOpener=null, modalModel=null, modalReturnHash="", modalReturnScroll=0;

async function openModel(id,pushHash=false){
 const md=MD[id];if(!md)return;
 const fresh=$("#modal").style.display!=="flex";
 if(fresh){
  modalOpener=document.activeElement;
  const curH=location.hash||"#/catalog";
  if(!curH.startsWith("#/model/")){modalReturnHash=curH;modalReturnScroll=window.scrollY;}
  $("#modal").scrollTop=0;
 }
 modalModel=id;
 if(pushHash&&location.hash!==`#/model/${id}`){
  history.pushState(null,"",`#/model/${id}`);
 }
 document.body.style.overflow="hidden";
 for(const selector of ["header.top","#app","#foot"]){const el=$(selector);if(el)el.inert=true}

 // Ensure full chunks for model, manufacturer, r11, and optional dark dossiers BEFORE rendering
 const need=[md._chunk,"mfrs-full","r11"];
 if((md.dark_case_ids||[]).length)need.push("dark-full");
 if(!md._full||!M[md.manufacturer_id]?._full||!loadedChunks.has("r11")){
  $("#mh").innerHTML=`<h2 id="model-title" style="margin:.1em 0">${esc(md.model)}</h2>`;
  $("#mc").innerHTML=`<p class="muted">Загружаем карточку модели и источники…</p>`;
  $("#modal").style.display="flex";
  try{await ensureChunks(need);}catch(e){
   if(modalModel===id)$("#mc").innerHTML=`<p role="alert">Не удалось загрузить подробные данные. Проверьте соединение и повторите.</p><button class="btn" onclick="openModel('${esc(id)}')">Повторить</button>`;
   return;
  }
  if(modalModel!==id)return;
 }

 stopActiveMedia();
 const m=M[md.manufacturer_id]||{};
 activeVideosList=md.videos||[];
 $("#mh").innerHTML=`<div class="muted small">${CATS.includes(md.e3_category)?`<a href="${catHref(md.e3_category)}" onclick="closeModal(true)">${esc(md.e3_category)}</a>`:esc(md.e3_category)} · <a href="#/types" onclick="closeModal(true)">${esc(TY[md.type_id]?.name_ru||"")}</a></div>
  <h2 id="model-title" style="margin:.1em 0">${esc(md.model)}</h2>
  <div class="mfr-sub">${mname(md.manufacturer_id)} · ${esc(m.country||"")} ${flags(m,true)}</div>
  ${md.om?`<div class="om-sub" style="margin-top:.25em"><span class="tag flag-om">в «Острове Мечты»</span> <span class="small muted">${esc(md.om)}</span></div>`:""}
  <div class="model-actions">
   <button class="btn ${inLL(id)?'on':''}" onclick="toggleLL('${id}')">${inLL(id)?'✓ В лонг-листе':'+ В лонг-лист'}</button>
   <button class="btn ${CMP.includes(id)?'on':''}" onclick="toggleCMP('${id}')">${CMP.includes(id)?'✓ В сравнении':'Сравнить'}</button>
   <button class="btn" type="button" onclick="shareSingleItem('${esc(id)}',${esc(JSON.stringify(md.model+' — '+(m.short||m.name||'')))})">Поделиться</button>
  </div>
  <nav class="modal-jumps" aria-label="Быстрый переход по карточке">
   <button type="button" onclick="jumpInModal('sec-media')">Фото${activeVideosList.length?' и видео':''}</button>
   <button type="button" onclick="jumpInModal('sec-specs')">Характеристики</button>
   <button type="button" onclick="jumpInModal('sec-rf')">Поставка в РФ</button>
   <button type="button" onclick="jumpInModal('sec-adv')">Преимущества</button>
   <button type="button" onclick="jumpInModal('sec-swot')">SWOT</button>
   <button type="button" onclick="jumpInModal('sec-reviews')">Отзывы</button>
  </nav>`;

 const e2=md.e2||{supplier:m.short||m.name||md.manufacturer_id,typology:md.e3_category,description:TY[md.type_id]?.name_ru||"",role:""};
 const rows=[["Поставщик (производитель)",e2.supplier,1],["Наименование модели",md.model,1],["Типология",e2.typology+(e2.typology!==md.e3_category?` (категория книги: ${md.e3_category})`:""),1],["Описание типа",(e2.description||"неизвестно")+(e2.desc_new?` (редакционное предложение; назначение: ${e2.desc_new.purpose}, аналог: ${e2.desc_new.analog})`:"")+(md.type_guess?" (тип не распознан по названию — подставлен типовой для категории, проверьте)":md.type_check?" (тип определён редакцией по описанию, категория расходится — проверьте)":md.aud_check?` (назначение «${md.audience}» расходится с ролью «${e2.role}», которую даёт тип, — проверьте тип или роль)`:""),1],["Роль в парке (предложение)",e2.role,1],["Назначение (оценка книги)",md.audience,0],
  ["Ростовые ограничения",hFull(md),1],["Количество посадочных мест, шт",md.seats,1],["Полная загрузка в час, чел",pphFull(md),1],["Мощность кВт",md.power_kw,1],["Площадь кв.м",md.area_m2,1],["Габариты, м",md.dimensions_m,1],["Высота, м",md.height_m,0],["Длина трассы, м",md.track_length_m,0],["Макс. скорость, км/ч",md.max_speed_kmh,0],["Переворотов (инверсий)",md.inversions,0],["Состав поезда",md.train_config,0],["Время поездки, с",md.ride_time_s,0],["Диаметр колеса, м",md.diameter_m,0],["Кабин",md.gondolas,0],["Мест в кабине",md.gondola_capacity,0],["Время оборота, мин",md.ride_time_min,0],["Высота старта, м",md.slide_height_m,0],["Длина спуска, м",md.slide_length_m,0],["Высота спуска, м",md.drop_height_m,0],["Средство",md.vehicle,0],["Площадь бассейна или водной поверхности, м²",md.pool_area_m2??md.water_area_m2,0],["Вагонов или машин",md.vehicles,0],["Длительность сеанса, мин",md.show_duration_min,0],["Полный цикл с посадкой, мин",md.cycle_time_min,0],["Время игры, с",md.game_time_s,0],["Степеней свободы платформы",md.dof,0],["Экран или проекция",md.screen,0],["Одновременно на объекте, чел",md.capacity_simultaneous,0],["Высота потолка, м",md.ceiling_height_m,0],["Колея, мм",md.gauge_mm,0],["Привод",md.drive,0],["Вес, кг",md.weight_kg,0],["Проектируется под объект",md.custom_built?"да — параметры типовые или одной установки (см. примечание)":null,0],["Срок производства",leadRow(md),1],
  ["Бесфундаментный монтаж",md.foundation_free==null?null:(md.foundation_free?"да":"нет"),0],["Передвижной",md.transportable==null?null:(md.transportable?"да":"нет"),0],["Крытый / уличный",md.indoor_outdoor,0],["Шум, дБ (по источнику)",md.noise_db,0],["Статус модели",md.model_status||(md.mfr_warning?md.mfr_warning:null),0]];
 let kp="";if(md.price_exw!=null){kp=`<div class="note"><b>Из КП:</b> цена EXW ${fmt(md.price_exw)} ${esc(md.currency||"")}, дата КП ${esc(md.kp_date||"—")}, грузовиков ${fmt(md.trucks)}. Цена из КП — не рыночная; только для внутреннего пользования.</div>`}
 $("#mc").innerHTML=`<div class="two"><div>
  ${renderModelGallery(md)}
  ${renderVideoBlocks(activeVideosList,md.photo_file)}
  <p>${esc(md.description_ru||"")}</p>${kp}
  <h3 id="sec-rf">Поставщик и поставка в Россию</h3><p>${rfBadge(m.rf_status)} ${m.rf_status_date?`<span class="muted small">на ${esc(m.rf_status_date)}</span>`:""}<br><span class="small">${esc(m.rf_status_note||"")}</span>${m.rf_status_source?`<br>${srcLink(m.rf_status_source)}`:""}</p>${(m.rf_evidence||[]).length?`<details class="small"><summary>Другие источники и наводки по РФ: ${m.rf_evidence.length}</summary><ul>${m.rf_evidence.map(e=>`<li>${esc(e.date||"без даты")}, ${esc(e.evidence_type)}: ${esc(e.summary_ru)} ${srcLink(e.url)}</li>`).join("")}</ul></details>`:""}
  <h3>Где представлены</h3>${whereModel(md)}</div>
  <div id="sec-specs"><table class="pt">${rows.filter(r=>r[2]||!(r[1]==null||r[1]==="")||["Назначение (оценка книги)","Высота, м","Крытый / уличный"].includes(r[0])).map(r=>`<tr class="${r[2]?'e2':''}"><td>${r[0]}</td><td>${r[1]==null||r[1]===""?'<span class="muted">неизвестно</span>':(r[0]==="Срок производства"?r[1]:fmt(r[1]))}</td></tr>`).join("")}</table>
  <p class="small muted">Необязательные поля без данных не показаны. ${esc(md.param_notes||"")}</p>${fieldEvidence(md)}
  ${leadSrc(md)}<h3>Источники</h3><div class="small">${srcLink(md.spec_source)}${(md.extra_sources||[]).map(s=>"<br>"+srcLink(s)).join("")}</div>
  <p style="margin-top:14px"><button class="btn ${inLL(id)?'on':''}" onclick="toggleLL('${id}')">${inLL(id)?'✓ в лонг-листе':'+ в лонг-лист'}</button> <button class="btn ${CMP.includes(id)?'on':''}" onclick="toggleCMP('${id}')">${CMP.includes(id)?'✓ в сравнении':'сравнить'}</button> <button class="btn" type="button" onclick="shareSingleItem('${esc(id)}',${esc(JSON.stringify(md.model))})">Скопировать ссылку</button></p></div></div>
  ${advantagesBlock(md,true)}
  <h3 id="sec-swot">SWOT модели: инвестор, эксплуатация, гость</h3>${swotBlock(md.swot,true)}
  <h3 id="sec-reviews">Отзывы</h3>${md.rv_scope?rvBlock(md,""):`<p class="small muted">Подтвержденных отзывов об этой версии пока нет. Дополнительные сведения о <a href="#/t/${esc(md.type_id)}" onclick="closeModal(true)">типе</a> и <a href="#/m/${esc(md.manufacturer_id)}" onclick="closeModal(true)">производителе</a>.</p>`}`;
 $("#modal").style.display="flex";
 updateGalMeta();bindGalSwipe();fitSchemeNotes();
 window.EncyclopediaAnalytics?.pageView(`#/model/${id}`);
 if(fresh)$(".modal .x").focus();
}

function closeModal(skipHashRestore=false){
 hideCompareNotice();stopActiveMedia();
 if($("#modal").style.display!=="flex")return;
 const closedId=modalModel;
 $("#modal").style.display="none";document.body.style.overflow="";
 for(const selector of ["header.top","#app","#foot"]){const el=$(selector);if(el)el.inert=false}
 modalModel=null;activeGalItems=[];activeVideosList=[];
 if(!skipHashRestore&&location.hash.startsWith("#/model/")){
  if(modalReturnHash&&!modalReturnHash.startsWith("#/model/")){
    history.replaceState(null,"",modalReturnHash);
   window.scrollTo(0,modalReturnScroll);
   window.EncyclopediaAnalytics?.pageView(modalReturnHash);
  }else{
   const md=MD[closedId];
   location.hash=md&&CATS.includes(md.e3_category)?catHref(md.e3_category):"#/catalog";
   return;
  }
 }
 const target=modalOpener?.isConnected&&modalOpener!==document.body&&modalOpener.getClientRects().length?modalOpener:document.querySelector('[data-model="'+closedId+'"]');
 if(target?.focus)target.focus({preventScroll:true});
 if(!skipHashRestore&&location.hash.startsWith("#/darkcase/"))route(true);
}

$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){if($("#modal").style.display==="flex")closeModal();$("#sres").style.display="none";return;}
 if($("#modal").style.display==="flex"&&activeGalItems.length>1&&!["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName)){
  if(e.key==="ArrowLeft"){e.preventDefault();stepGal(-1);return;}
  if(e.key==="ArrowRight"){e.preventDefault();stepGal(1);return;}
 }
 if(e.key==="Tab"&&$("#modal").style.display==="flex"){
  const items=[...$("#modal").querySelectorAll('a[href],button,input,select,summary,[tabindex="0"]')].filter(n=>n.getClientRects().length&&!n.disabled);
  const first=items[0],last=items[items.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
 }
});

/* ---------- Поиск (без псевдоссылок javascript:) ---------- */
const IDX=[
 ...DB.manufacturers.map(m=>({k:(m.name+" "+(m.short||"")+" "+(m.country||"")+" "+(m.specialty_ru||"")+" "+(m.aliases||[]).join(" ")).toLowerCase(),h:`#/m/${m.id}`,t:m.short||m.name,s:"производитель · "+(m.country||"")})),
 ...DB.models.map(md=>({k:(md.model+" "+(M[md.manufacturer_id]?.short||"")+" "+md.e3_category+" "+(TY[md.type_id]?.name_ru||"")+" "+(TY[md.type_id]?.name_en||"")).toLowerCase(),h:`#/model/${md.id}`,modelId:md.id,t:md.model,s:"модель · "+(M[md.manufacturer_id]?.short||"")+" · "+md.e3_category})),
 ...DB.taxonomy.types.map(t=>({k:(t.name_ru+" "+t.name_en).toLowerCase(),h:`#/t/${t.id}`,t:t.name_ru,s:"тип · "+t.name_en}))
];
$("#q").addEventListener("input",e=>{
 const q=e.target.value.trim().toLowerCase();const box=$("#sres");if(q.length<2){box.style.display="none";return}
 const words=q.split(/\s+/);const r=IDX.filter(x=>words.every(w=>x.k.includes(w))).slice(0,40);
 box.innerHTML=r.length?r.map((x,i)=>`<a href="${esc(x.h)}" data-i="${i}">${esc(x.t)}<br><small>${esc(x.s)}</small></a>`).join(""):'<div style="padding:12px 16px" class="small muted">Ничего не найдено. Отсутствие в книге не значит, что такого производителя нет.</div>';
 box.querySelectorAll("a[data-i]").forEach(a=>a.addEventListener("click",ev=>{
  const x=r[+a.dataset.i];
  if(ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.button===1)return;
  box.style.display="none";
  if(x.modelId){ev.preventDefault();modalOpener=$("#q");openModel(x.modelId,true);}
 }));
 box.style.display="block";
});
document.addEventListener("click",e=>{if(!e.target.closest(".search"))$("#sres").style.display="none"});

/* ---------- Страницы ---------- */
const P={};
const SECTION_SHORT={mech:"Механические аттракционы",coasters:"Американские горки",wheels:"Колеса обозрения",water:"Водные аттракционы",media:"Медиа и виртуальная реальность",fec:"Развлекательные центры",transport:"Поезда и транспорт",kids:"Детские аттракционы"};
function sectionLinks(){return '<div class="section-list">'+DB.sections.map(s=>'<a class="section-link" href="#/'+s.id+'"><strong>'+esc(SECTION_SHORT[s.id]||s.title)+'</strong><span>'+DB.sec_counts[s.id]+'</span></a>'+(s.id==='media'?'<a class="section-link" href="#/dark"><strong>Дарк-райды и дарк-волки</strong><span>'+DK.cases.length+' досье</span></a>':'')).join('')+'</div>'}

P["overview"]=()=>{const S=DB.stats;return `<div class="home-intro"><h1>Аттракционы мира</h1><p class="lead">Производители, модели и устройство аттракционов. Найдите подходящие варианты для парка, сравните характеристики и соберите лонг-лист для запроса КП.</p><p class="small muted">По открытым источникам. Неизвестные сведения честно отмечены в карточках.</p><div class="actions"><a class="btn pri" href="#/catalog">Открыть каталог</a><a class="btn" href="#/">Визуальная лента</a><a class="btn" href="#/map">Производители мира</a></div></div>
<div class="overview"><span><b>${fmt(S.models_mech)}</b> модели</span><span><b>${fmt(S.manufacturers)}</b> производителей</span><span><b>${fmt(S.countries)}</b> страны</span><span><b>${fmt(S.photos)}</b> моделей с фото</span>${S.videos?`<span><b>${fmt(S.videos)}</b> с видео</span>`:""}</div>
<h2>Каталог аттракционов</h2>${sectionLinks()}<p class="small muted">Число карточек в разделе. Детские модели также входят в другие разделы.</p>
<div class="home-help"><section><h2>От поиска к выбору и запросу КП</h2><ol><li>Выберите раздел и тип. Фильтры помогут учесть назначение, рост, пропускную способность, наличие фото и видео.</li><li>Откройте карточку: посмотрите ракурсы и видео, сопоставьте параметры, преимущества и ограничения. Скопируйте прямую ссылку на модель для коллег.</li><li>Добавьте подходящие позиции в <a href="#/compare">сравнение</a> и <a href="#/longlist">лонг-лист</a>, поделитесь подборкой по ссылке или скачайте готовый XLSX с характеристиками, источниками и автовопросами поставщику.</li></ol><p class="small muted">Статус поставки в Россию подтвержден не у всех производителей. Основания и ограничения приведены в профилях.</p></section>
<section><h2>Читать и разбираться</h2><p>История отрасли, механика, регулирование и термины для работы с каталогом.</p><div class="reading-links"><a href="#/chapters">Главы книги</a><a href="#/types">Типы аттракционов</a><a href="#/glossary">Глоссарий</a><a href="#/toc">Все разделы</a><a href="#/method">Методика</a></div></section></div>`};

P.catalog=()=>{const S=DB.stats;return `<h1>Каталог аттракционов</h1>
<section class="catalog-brief" aria-label="Как устроен каталог">
 <div class="stats-row">
  <span><b>${fmt(S.models_mech)}</b> модели</span>
  <span><b>${fmt(S.manufacturers)}</b> производителей (${fmt(S.countries)} страны)</span>
  <span><b>${fmt(DK.cases.length)}</b> дарк-досье</span>
  <span><b>${fmt(S.photos)}</b> моделей с фото${S.videos?` · <b>${fmt(S.videos)}</b> с видео`:""}</span>
 </div>
 <p>Выбирайте модели по фото и видео, добавляйте их в <a href="#/compare">сравнение</a> и <a href="#/longlist">лонг-лист</a>. Делитесь подборкой или скачивайте XLSX с характеристиками и вопросами для КП.</p>
 <div class="actions"><a class="btn pri" href="#/">Смотреть в фотоленте</a><a class="btn" href="#/map">Карта производителей</a><a class="btn" href="#/overview">Обзор справочника</a></div>
</section>
${sectionLinks()}<p class="small muted">Детские модели также входят в другие разделы. <a href="#/types">Все типы и механизмы</a>.</p><details><summary>Охват каталога по категориям</summary>${S.gap_html}</details>`};

P["toc"]=()=>`<h1>Оглавление энциклопедии</h1><p class="lead">Разделы справочника, источники и инструменты выбора.</p><ol class="toc">${DB.toc.map(t=>`<li>${t.href?`<a href="${t.href}">${esc(t.title)}</a>`:esc(t.title)}<span class="st ${t.href?'ok':'p2'}">${t.href?'готово':'в работе'}</span><div class="small muted">${esc(t.desc)}</div></li>`).join("")}</ol>`;

let MF={seg:"",country:"",rf:"",sanc:"",circle:"",key:"",q:"",sort:"name"};
P["map"]=()=>`<h1>Производители мира</h1><p class="lead">Заметные производители аттракционов (слабые записи помечены): страна, сегменты, статус для России. Нажмите на страну на карте, чтобы отфильтровать список.</p>
<div class="mapwrap" id="mapw">${DB.map_svg}<p class="map-credit">Карта: Natural Earth 1:110m, общественное достояние</p><div class="maptip" id="tip" role="tooltip"></div></div><div class="legend">${DB.map_legend}</div>
<div class="filters"><input placeholder="Фильтр по названию" value="${esc(MF.q)}" oninput="MF.q=this.value;drawMList()">
<select onchange="MF.seg=this.value;drawMList()"><option value="">Все сегменты</option>${Object.entries(SEG).map(([k,v])=>`<option value="${k}" ${MF.seg==k?'selected':''}>${v}</option>`).join("")}</select>
<select id="fcountry" onchange="MF.country=this.value;drawMList()"><option value="">Все страны</option>${[...new Set(DB.manufacturers.map(m=>m.country).filter(c=>c&&c!=="нет данных"))].sort().map(c=>`<option ${MF.country==c?'selected':''}>${esc(c)}</option>`).join("")}</select>
<select onchange="MF.rf=this.value;drawMList()"><option value="">Любой статус РФ</option>${Object.keys(RFS).map(s=>`<option ${MF.rf==s?'selected':''}>${s}</option>`).join("")}</select>
${DB.sanctions?`<select onchange="MF.sanc=this.value;drawMList()"><option value="">Любой санкционный режим</option>${Object.values(DB.sanctions.regimes).map(r=>`<option value="${r.code}" ${MF.sanc==r.code?"selected":""}>${esc(r.name_ru)}</option>`).join("")}</select>`:""}
<label><input type="checkbox" ${MF.key?'checked':''} onchange="MF.key=this.checked?'1':'';drawMList()"> только ключевые</label><span id="mcount" class="muted small"></span></div>
<div class="tw"><table class="t" id="mtab"></table></div>`;

function mfilter(){const q=MF.q.toLowerCase();return DB.manufacturers.filter(m=>(!MF.seg||(m.segments||[]).includes(MF.seg))&&(!MF.country||m.country==MF.country)&&(!MF.rf||(m.rf_status||"неизвестно")==MF.rf)&&(!MF.sanc||m.sanc_code==MF.sanc)&&(!MF.key||m.is_key)&&(!q||(m.name+" "+(m.short||"")+" "+(m.specialty_ru||"")+" "+(m.aliases||[]).join(" ")).toLowerCase().includes(q)))}

function fitSchemeNotes(){
 document.querySelectorAll('.scheme svg').forEach(svg=>{
  const frame=svg.getBoundingClientRect();if(!frame.width||!frame.height)return;
  const notes=[];
  svg.querySelectorAll('text').forEach(t=>{const b=t.getBoundingClientRect();if(b.width&&(b.left<frame.left-1||b.right>frame.right+1||b.top<frame.top-1||b.bottom>frame.bottom+1)){notes.push(t.textContent);t.remove()}});
  if(notes.length){const caption=document.createElement('p');caption.className='scheme-note small';caption.textContent=notes.join('. ');svg.insertAdjacentElement('afterend',caption)}
 });
}
document.addEventListener('toggle',e=>{if(e.target.matches('details')&&e.target.open)fitSchemeNotes()},true);

function labelTables(){
 document.querySelectorAll('main table').forEach(t=>{
  if(t.closest('.tw,.scroll,.table-scroll')||!t.rows[0]||t.rows[0].cells.length<3)return;
  const box=document.createElement('div');box.className='table-scroll';box.tabIndex=0;box.setAttribute('role','region');box.setAttribute('aria-label','Таблица, прокручивается по горизонтали');
  t.parentNode.insertBefore(box,t);box.appendChild(t);
 });
 document.querySelectorAll('.tw table').forEach(t=>{const heads=[...t.querySelectorAll('tr:first-child th')].map(h=>h.textContent.trim());t.querySelectorAll('td').forEach(c=>{c.setAttribute('data-label',heads[c.cellIndex]||'')})});
}

function drawMList(){const L=mfilter().sort((a,b)=>MF.sort=="country"?(a.country||"").localeCompare(b.country||"")||(a.short||"").localeCompare(b.short||""):MF.sort=="models"?((b.n_models||0)-(a.n_models||0)):(a.short||"").localeCompare(b.short||""));
 $("#mcount").textContent=`показано ${L.length} из ${DB.manufacturers.length}`;
 $("#mtab").innerHTML=`<tr><th onclick="MF.sort='name';drawMList()">Производитель</th><th onclick="MF.sort='country';drawMList()">Страна</th><th>Сегменты</th><th>Чем известен</th><th>Статус для РФ</th><th onclick="MF.sort='models';drawMList()" class="num">Моделей</th></tr>`+
 L.map(m=>`<tr><td><a href="#/m/${m.id}"><b>${esc(m.short||m.name)}</b></a><div>${flags(m)}</div></td><td>${esc(m.country||"")}</td><td>${(m.segments||[]).map(s=>`<span class="chip">${esc(SEG[s]||s)}</span>`).join("")}</td><td class="small">${esc(m.specialty_ru||"")}</td><td>${rfBadge(m.rf_status)}${m.rf_status_date?`<div class="muted small">${esc(m.rf_status_date)}</div>`:""}</td><td class="num">${m.n_models||""}</td></tr>`).join("");
 labelTables();document.querySelectorAll("#mapw .c.has").forEach(p=>p.setAttribute("aria-pressed",String(Boolean(MF.country)&&MF.country===DB.cc2country[p.dataset.c])));document.querySelectorAll("#mtab th[onclick]").forEach(th=>{th.tabIndex=0;th.setAttribute("role","button");th.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();th.click()}}});
}

function bindMap(){
 const map=$("#mapw"),tip=$("#tip"),svg=map?.querySelector("svg");if(!svg)return;
 svg.setAttribute("role","group");
 const hide=()=>{tip.style.display="none"};
 const show=(p,n,x,y)=>{
  tip.textContent=(DB.cc2country[p.dataset.c]||p.dataset.n||p.dataset.c)+(n?" · производителей в каталоге: "+n:" · в каталоге нет производителей");
  tip.style.display="block";
  const r=map.getBoundingClientRect(),t=tip.getBoundingClientRect();
  let left=x-r.left+12,top=y-r.top+12;
  if(left+t.width>r.width-8)left=x-r.left-t.width-12;
  if(top+t.height>r.height-8)top=y-r.top-t.height-12;
  tip.style.left=Math.max(8,Math.min(left,r.width-t.width-8))+"px";
  tip.style.top=Math.max(8,Math.min(top,r.height-t.height-8))+"px";
 };
 map.addEventListener("keydown",e=>{if(e.key==="Escape")hide()});
 map.addEventListener("mouseleave",hide);
 map.querySelectorAll(".c").forEach(p=>{
  const cc=p.dataset.c,n=DB.country_counts[cc];
  if(n){
   p.classList.add("has");p.style.fill=DB.map_color(n);
   p.setAttribute("role","button");p.setAttribute("tabindex","0");
   p.setAttribute("aria-label",(DB.cc2country[cc]||p.dataset.n||cc)+". Производителей в каталоге: "+n+". Фильтровать список");
   p.setAttribute("aria-pressed",String(Boolean(MF.country)&&MF.country===DB.cc2country[cc]));
   p.addEventListener("focus",()=>{const r=p.getBoundingClientRect();show(p,n,r.x+r.width/2,r.y+r.height/2)});
   p.addEventListener("blur",hide);
   p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();p.dispatchEvent(new MouseEvent("click",{bubbles:true}))}});
  }
  p.addEventListener("mousemove",e=>show(p,n,e.clientX,e.clientY));
  p.addEventListener("mouseleave",hide);
  p.addEventListener("click",()=>{
   if(!n)return;
   hide();MF.country=DB.cc2country[cc]||"";
   const s=$("#fcountry");if(s)s.value=MF.country;
   drawMList();
   s?.focus({preventScroll:true});
   s?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
  });
 });
}

P["m"]=id=>{const m=M[id];if(!m)return"<h1>Не найдено</h1>";const models=DB.models.filter(x=>x.manufacturer_id==id);const pr=m.profile;
 return `<p class="small"><a href="#/map">← все производители</a></p><h1>${esc(m.name)}</h1><div>${flags(m)}</div>${(()=>{const o=models.filter(x=>x.om);return o.length?`<p class="note">В «Острове Мечты»: ${o.map(x=>`${esc(x.om_name||"")} → <a href="#/model/${esc(x.id)}" onclick="return goModel('${x.id}',event)">${esc(x.model)}</a>`).join("; ")}. Размер или версия в парке могут отличаться.</p>`:""})()}
 <div class="two" style="margin-top:14px"><div>${pr?`<p class="lead">${esc(pr.profile_ru)}</p>${pr.sources?.length?`<div class="small muted">Источники профиля: ${pr.sources.map(srcLink).join("; ")}</div>`:""}`:`<p class="lead">${esc(m.specialty_ru||"")}</p>`}
 <table class="pt"><tr><td>Страна, город</td><td>${esc(m.country||"неизвестно")}${m.city?", "+esc(m.city):""}${m.country_note?` <span class="muted small">(${esc(m.country_note)})</span>`:""}</td></tr><tr><td>Основан</td><td>${m.founded?esc(String(m.founded)):"не установлено"}${m.founded_note?` <span class="muted small">(${esc(m.founded_note)})</span>`:""}</td></tr><tr><td>Статус компании</td><td>${fmt(m.company_status)}</td></tr><tr><td>Группа</td><td>${fmt(m.group)}</td></tr>
 <tr><td>Сегменты</td><td>${(m.segments||[]).map(s=>`<span class="chip">${esc(SEG[s]||s)}</span>`).join("")}</td></tr><tr><td>Категории</td><td>${(m.e3_categories||[]).map(c=>MECH.includes(c)?`<a class="chip" href="#/mech/${encodeURIComponent(c)}">${esc(c)}</a>`:`<span class="chip">${esc(c)}</span>`).join("")||"—"}</td></tr>
 <tr><td>Сайт</td><td>${m.website?srcLink(m.website):"—"}</td></tr>${m.contact?`<tr><td>Куда писать</td><td>${srcLink(m.contact.url)}${m.contact.email?` · <a href="mailto:${esc(m.contact.email)}">${esc(m.contact.email)}</a>`:""}${m.contact.phone?" · "+esc(m.contact.phone):""} <span class="muted small">(страница контактов на сайте производителя, проверка ${esc(m.contact.checked||"")})</span></td></tr>`:""}<tr><td>Почему в реестре</td><td class="small">${(m.notable_basis||[]).map(esc).join("<br>")||"—"}${m.notable_check?`<br><span class="muted">Разметка по правилу (а)–(г), ${esc(m.notable_date||"08.11.2026")}: ${esc(m.notable_check)}</span>`:""}</td></tr>
 <tr><td>Ключевой</td><td class="small">${m.is_key?esc((m.key_basis||[]).join("; ")):(m.key_excluded?esc(m.key_excluded+" (признаки: "+(m.key_basis||[]).join("; ")+")"):"нет")}</td></tr></table>
 ${(m.history_events||[]).length?`<h3>История</h3><div class="tl">${m.history_events.map(h=>`<div><b>${esc(h.year)}</b> — ${esc(h.event_ru)} ${h.source?srcLink(h.source):""}</div>`).join("")}</div>`:""}</div>
 <div><h3>Статус для России</h3><p>${rfBadge(m.rf_status)} ${m.rf_status_date?`<span class="muted small">на ${esc(m.rf_status_date)}</span>`:""}</p><p class="small">${esc(m.rf_status_note||"")}</p>${m.rf_status_source?`<p>${srcLink(m.rf_status_source)}</p>`:""}
 ${(m.rf_evidence||[]).length?`<h3>Свидетельства о рынке РФ</h3><ul class="small">${m.rf_evidence.map(e=>`<li><b>${esc(e.evidence_type)}</b>, ${esc(e.date||"без даты")}: ${esc(e.summary_ru)} ${srcLink(e.url)}</li>`).join("")}</ul>`:""}
 ${sancBlock(m)}
  ${pr&&pr.key_facts?.length?`<h3>Факты профиля</h3><ul class="small">${pr.key_facts.map(f=>`<li>${esc(f.fact_ru)} ${srcLink(f.source)}</li>`).join("")}</ul>`:""}
 <h3>Источники</h3><ul class="small">${(m.sources||[]).map(s=>`<li>${srcLink(s)}${s.supports?` — <span class="muted">${esc(s.supports)}</span>`:""}</li>`).join("")}</ul></div></div>
 ${advantagesBlock(m,false)}
 ${m.r11&&m.r11.swot?`<h2>SWOT производителя: инвестор, эксплуатация, гость</h2>${swotBlock(m.r11.swot,false)}`:`<p class="small muted">Проверенных сведений для анализа пока недостаточно.</p>`}
 ${m.r11?`<h2>Где представлен</h2>${whereMfr(m)}${m.r11.lead_range?`<p class="small"><b>${esc(leadLabel(m.r11.lead_range))} по данным производителя:</b> ≈ ${esc(m.r11.lead_range.text)} (${esc(m.r11.lead_range.scope||"")}) ${srcLink(m.r11.lead_range)}${m.r11.lead_range.date?` <span class="muted">(${esc(m.r11.lead_range.date)})</span>`:""}</p>`:""}<h2>Отзывы о производителе</h2>${m.r11.review_limit?`<p class="small muted">${esc(m.r11.review_limit)}</p>`:""}${rvBlock(m.r11)}`:""}
 ${models.length?`<h2>Модели в книге (${models.length})</h2><div class="grid g4">${models.map(mcard).join("")}</div>`:`<p class="muted">Карточек моделей этого производителя в книге пока нет.</p>`}`};

P["t"]=id=>{const t=TY[id];if(!t)return"<h1>Не найдено</h1>";const R=((DB.r11||{}).types||{})[id]||{};const xs=DB.models.filter(x=>x.type_id==id);const st=R.stats||{};
 const mfrs=[...new Set(xs.map(x=>x.manufacturer_id))];const lr=R.lead_regions||{};
 return `<p class="small"><a href="#/types">← все типы</a></p><h1>${esc(t.name_ru)}</h1><p class="lead">${esc(t.name_en)} — ${esc(t.desc_ru)}</p>
 <div class="overview type-overview"><span><b>${xs.length}</b> моделей в книге</span><span><b>${mfrs.length}</b> производителей</span><span><b>${st.pph_med_src!=null?fmt(st.pph_med_src):"—"}</b> медиана чел/час по ${st.n_pph_src||0} моделям с цифрой источника</span></div><p class="small muted">Страны производителей (число моделей): ${esc(st.countries_top||"—")}</p>
 ${DB.schemes[id]?`<figure class="scheme" style="max-width:680px">${schemeIcon(id)}<figcaption>Редакционная схема принципа действия типа «${esc(t.name_ru)}».</figcaption></figure>`:""}
 <h2>SWOT типа: инвестор, эксплуатация, гость</h2>${swotBlock(R.swot,false)}
 <h2>Срок производства: ориентиры по регионам</h2>${Object.keys(lr).length?`<ul class="small">${Object.entries(lr).map(([g,v])=>`<li><b>${esc(g)}</b>: ≈ ${esc(v.text)} — ${v.sources.map(s=>srcLink(s)+(s.date?` <span class="muted">(${esc(s.date)})</span>`:"")).join("; ")}</li>`).join("")}</ul><p class="small muted">Ориентир — диапазон сроков из источников по моделям и производителям этого типа внутри региона производства; это не срок конкретной модели — спросите его в КП.</p>`:`<p class="small muted">Сроков из источников по этому типу нет — спросите срок в КП.</p>`}
 <h2>Отзывы о типе</h2>${rvBlock(R)}
 <h2>Производители (${mfrs.length})</h2><p>${mfrs.map(i=>`<a class="chip" href="#/m/${i}">${esc((M[i]||{}).short||i)}</a>`).join("")}</p>
 <h2>Модели (${xs.length})</h2><div class="grid g4">${xs.slice(0,60).map(mcard).join("")}</div>${xs.length>60?`<p class="small"><a href="${catHref(t.e3)}" onclick="XF.type='${t.id}'">все ${xs.length} в разделе →</a></p>`:""}`};

P["types"]=()=>`<h1>Типы аттракционов</h1><p class="lead">Таксономия: мировые названия типов и их место в 14 категориях книги.</p>
<div class="note">В каталоге различаются семейные и экстремальные горки. Конкретный механизм и назначение указаны в карточке модели.</div>
<div class="tree">${DB.taxonomy.families.map(f=>`<div class="fam"><h2>${esc(f.name_ru)}</h2><div class="ty hd"><div>Тип</div><div>Категория</div><div class="num">Моделей в книге</div><div class="num">Производителей</div></div>
${DB.taxonomy.types.filter(t=>t.family==f.id).map(t=>`<div class="ty"><div><b>${t.n_models?`<a href="#/t/${t.id}">${esc(t.name_ru)}</a>`:esc(t.name_ru)}</b><div class="small muted">${esc(t.name_en)} — ${esc(t.desc_ru)}</div></div><div>${esc(t.e3||"—")}${CATS.includes(t.e3)&&t.n_models?` <a class="small" href="${catHref(t.e3)}">→ раздел</a>`:""}</div><div class="num">${t.n_models&&CATS.includes(t.e3)?`<a href="${catHref(t.e3)}" onclick="XF.type='${t.id}'">${t.n_models}</a>`:(t.n_models||"—")}</div><div class="num">${t.n_mfr||"—"}</div></div>`).join("")}</div>`).join("")}</div>`;

let XF={mf:"",country:"",aud:location.hash.startsWith("#/kids/")?"Детские":"",rf:"",circle:"",maxh:"",minpph:"",q:"",unk:true,type:"",hasPhoto:false,hasVideo:false,mobileOpen:false};
function activeXFCount(){
 return [XF.q,XF.mf,XF.aud,XF.rf,XF.maxh,XF.minpph,XF.country,XF.type,XF.hasPhoto?"1":"",XF.hasVideo?"1":"",!XF.unk?"1":""].filter(Boolean).length;
}
function resetXF(){XF={mf:"",country:"",aud:"",rf:"",circle:"",maxh:"",minpph:"",q:"",unk:true,type:"",hasPhoto:false,hasVideo:false,mobileOpen:XF.mobileOpen};route(true)}
window.toggleMobileFilters=function(){
 XF.mobileOpen=!XF.mobileOpen;
 const panel=$("#xfilters"),btn=$("#xf-toggle");
 if(panel)panel.classList.toggle("open",XF.mobileOpen);
 if(btn)btn.setAttribute("aria-expanded",String(XF.mobileOpen));
};

const SEC_LEAD={
 coasters:"Семейные и экстремальные американские горки: схемы, профили производителей и карточки моделей с параметрами, источниками и статусом для России. У горок, которые строят под проект, в карточке — типовые параметры линейки или одной установки (сказано в примечании карточки).",
 wheels:"Колёса обозрения: стационарные городские колёса, передвижные колёса на прицепах и детские мини-колёса — с параметрами, источниками и статусом для России.",
 kids:"Мини-аттракционы для детей во всех категориях: карусели, башни, автодромы, горки, колёса, поезда и игровые. Семейные модели, где дети катаются со взрослыми, — в разделах по категориям (фильтр «Семейные»).",
 water:"Водные аттракционы парков и оборудование аквапарков: бревно, рафтинг-река, шут-спуск, водная битва, горки аквапарка, игровые комплексы, волновые бассейны, сёрф-машины. У горок аквапарка, которые проектируют под объект, параметры типовые или одной установки (сказано в карточке).",
 media:"Медиа-аттракционы: dark ride (рельсовые, безрельсовые, интерактивные), летающие театры, 4D/5D-кинотеатры, симуляторы, VR-аттракционы и VR-арены, робот-рука, медиатуннели. Для крытого парка важны высота потолка, площадь зала и стоимость замены контента.",
 fec:"Оборудование развлекательных центров: игровые и призовые автоматы, спортивные аркады, монетные качалки, батутные и ниндзя-парки, лабиринты, верёвочные парки и скалодромы, лазертаг, боулинг, мини-гольф, проекционные игры.",
 transport:"Поезда парков (рельсовые и дорожные), монорельсы, трассы «Конвой» и ретро-автомобили, канатные дороги и пипл-муверы внутри парков — от детских до прогулочных."
};
const SEC_FAM={coasters:["coasters"],wheels:["wheels"],kids:["kids"],water:["water"],media:["media"],fec:["fec"],transport:["transport"]};

function secIndex(sid){const S=DB.sections.find(s=>s.id==sid);const aud=S.audience;const inS=x=>S.cats.includes(x.e3_category)&&(!aud||x.audience==aud);
 const ms=DB.models.filter(inS);const cats=S.cats.filter(c=>ms.some(x=>x.e3_category==c));const mfs=[...new Set(ms.map(x=>x.manufacturer_id))].map(i=>M[i]).filter(Boolean).sort((a,b)=>(a.short||"").localeCompare(b.short||""));
 const XSEC={fec:{"vr-arena":"media"}}[sid]||{};const tys=DB.taxonomy.types.filter(t=>SEC_FAM[sid].includes(t.family)||(sid!="kids"&&S.cats.includes(t.e3)&&t.family!="water")||XSEC[t.id]);
 return `<h1>${esc(S.title)}</h1><p class="lead">${SEC_LEAD[sid]}</p>${cats.length===1?`<p><a class="btn pri" href="#/${sid}/${encodeURIComponent(cats[0])}" onclick="XF.type='';XF.aud='${aud||''}'">Смотреть модели (${ms.length})</a></p>`:""}${(DB.sec_intro||{})[sid]||""}${sid=="coasters"?`<p>Почему одни горки тише других — <a href="#/quiet">отдельная глава</a>.</p>`:""}
 <div class="grid g3">${cats.map(c=>{const cm=ms.filter(x=>x.e3_category==c);const n=new Set(cm.map(x=>x.manufacturer_id)).size;const ph=cm.filter(x=>x.photo_file).length;const vd=cm.filter(x=>(x.videos_count||0)>0).length;
 return `<a class="card" href="#/${sid}/${encodeURIComponent(c)}" ${aud?`onclick="XF.aud='${aud}'"`:`onclick="XF.aud=''"`} style="color:inherit;text-decoration:none"><div class="scheme" style="border:0;padding:0">${DB.schemes[c]||""}<div class="muted small">упрощённая схема типа</div></div><h3>${esc(c)}</h3><p class="small muted">${esc(DB.mech_desc[c]||"")}</p><div class="small"><b>${cm.length}</b> ${aud?plN(cm.length,"детская","детские","детских")+" ":""}${plM(cm.length)} · <b>${n}</b> ${plN(n,"производитель","производителя","производителей")} · <b>${ph}</b> с фото${vd?` · <b>${vd}</b> с видео`:""}</div></a>`}).join("")}</div>
 ${tys.length?`<h2>Типы</h2><div class="tree"><div class="ty hd"><div>Тип</div><div>Категория</div><div class="num">Моделей в книге</div><div class="num">Производителей</div></div>${tys.map(t=>`<div class="ty"><div><b>${esc(t.name_ru)}</b><div class="small muted">${esc(t.name_en)} — ${esc(t.desc_ru)}</div></div><div>${esc(t.e3||"—")}${XSEC[t.id]?` <span class="small muted">(раздел «${esc(DB.sections.find(z=>z.id==XSEC[t.id]).title.split(":")[0])}»)</span>`:""}</div><div class="num">${t.n_models&&CATS.includes(t.e3)?`<a href="#/${XSEC[t.id]||sid}/${encodeURIComponent(t.e3)}" onclick="XF.type='${t.id}';XF.aud='${XSEC[t.id]?"":(aud||"")}'">${t.n_models}</a>`:(t.n_models||"—")}</div><div class="num">${t.n_mfr||"—"}</div></div>`).join("")}</div>`:""}
 <h2>Производители (${mfs.length})</h2><div class="grid g4">${mfs.map(m=>`<a class="card" href="#/m/${m.id}" style="color:inherit;text-decoration:none"><b>${esc(m.short)}</b> <span class="muted small">${esc(m.country)}</span><div>${flags(m)}</div><div class="small muted">${(n=>`${n} ${aud?plN(n,"детская","детские","детских")+" ":""}${plM(n)}`)(ms.filter(x=>x.manufacturer_id==m.id).length)} в разделе${m.has_profile||m.profile?" · есть профиль":""}</div></a>`).join("")}</div>`;}

P["coasters"]=cat=>cat?P["mech"](cat):secIndex("coasters");
P["wheels"]=cat=>cat?P["mech"](cat):secIndex("wheels");
P["water"]=cat=>cat?P["mech"](cat):secIndex("water");P["media"]=cat=>cat?P["mech"](cat):secIndex("media");P["fec"]=cat=>cat?P["mech"](cat):secIndex("fec");P["transport"]=cat=>cat?P["mech"](cat):secIndex("transport");
P["chapters"]=()=>`<h1>Главы</h1><p class="lead">Главы и практические разборы. Факты снабжены источниками, редакционные рекомендации отделены.</p><div class="grid g3">${Object.entries(DB.chapters||{}).map(([id,c])=>`<a class="card" href="#/ch/${id}" style="color:inherit;text-decoration:none"><h3>${esc(c.title)}</h3><p class="small muted">${esc(c.lead||"")}</p><div class="small">${c.n_paras} ${plN(c.n_paras,"абзац","абзаца","абзацев")} · ${c.n_src} ${plN(c.n_src,"источник","источника","источников")}</div></a>`).join("")}${(DB.glossary||[]).length?`<a class="card" href="#/glossary" style="color:inherit;text-decoration:none"><h3>Глоссарий RU/EN</h3><p class="small muted">Термины отрасли по-русски и по-английски.</p><div class="small">${DB.glossary.length} ${plN(DB.glossary.length,"термин","термина","терминов")}</div></a>`:""}<a class="card" href="#/quiet" style="color:inherit;text-decoration:none"><h3>Почему одни горки тише других</h3><p class="small muted">Краткий разбор инженерных решений.</p></a></div>`;
P["ch"]=id=>(DB.chapters||{})[id]?DB.chapters[id].html:`<p>Глава не найдена. <a href="#/chapters">Все главы</a></p>`;
let GQ="",GG="";
P["glossary"]=()=>{const gs=[...new Set((DB.glossary||[]).map(g=>g.group))].sort();return `<h1>Глоссарий RU/EN</h1><p class="lead">${(DB.glossary||[]).length} ${plN((DB.glossary||[]).length,"термин","термина","терминов")}, которые встречаются в книге и в КП производителей. У определения — источник, где термин так употреблён; «определение книги» — источника не нашлось.</p>
<div class="filters"><input placeholder="Термин по-русски или по-английски" value="${esc(GQ)}" oninput="GQ=this.value;drawG()"> <select onchange="GG=this.value;drawG()"><option value="">Все группы</option>${gs.map(g=>`<option ${GG==g?'selected':''}>${esc(g)}</option>`).join("")}</select> <span id="gcount" class="muted small"></span></div><div class="tw"><table class="t" id="gtab"></table></div>`};
function drawG(){const q=GQ.toLowerCase();const L=(DB.glossary||[]).filter(g=>(!GG||g.group==GG)&&(!q||(g.ru+" "+g.en).toLowerCase().includes(q))).sort((a,b)=>a.ru.localeCompare(b.ru,"ru"));
 $("#gcount").textContent=`показано ${L.length} из ${(DB.glossary||[]).length}`;$("#gtab").innerHTML=`<tr><th>Термин</th><th>English</th><th>Что значит</th><th>Группа</th><th>Источник</th></tr>`+L.map(g=>`<tr><td><b>${esc(g.ru)}</b></td><td>${esc(g.en)}</td><td class="small">${esc(g.def_ru)}</td><td class="small muted">${esc(g.group)}</td><td class="small">${g.source?(/^https?:/.test(g.source)?`<a class="src" href="${esc(g.source)}" target="_blank" rel="noopener">${esc(g.source.replace(/^https?:\/\/(www\.)?/,'').split('/')[0])}</a>`:esc(g.source)):'<span class="muted">определение книги</span>'}</td></tr>`).join("");labelTables()}
P["kids"]=cat=>cat?P["mech"](cat):secIndex("kids");

P["mech"]=cat=>{
 if(!cat) return `<h1>Механические аттракционы</h1><p class="lead">Семь категорий механических аттракционов, профили производителей и карточки моделей с параметрами, источниками и статусом для России.</p>
 ${DB.mech_intro_html||""}<div class="grid g3">${MECH.map(c=>{const ms=DB.models.filter(x=>x.e3_category==c);const mf=new Set(ms.map(x=>x.manufacturer_id));const ph=ms.filter(x=>x.photo_file).length;const vd=ms.filter(x=>(x.videos_count||0)>0).length;
 return `<a class="card" href="${catHref(c)}" style="color:inherit;text-decoration:none"><div class="scheme" style="border:0;padding:0">${DB.schemes[c]||""}<div class="muted small">упрощённая схема типа</div></div><h3>${esc(c)}</h3><p class="small muted">${esc(DB.mech_desc[c]||"")}</p><div class="small"><b>${ms.length}</b> ${plM(ms.length)} · <b>${mf.size}</b> ${plN(mf.size,"производитель","производителя","производителей")} · <b>${ph}</b> с фото${vd?` · <b>${vd}</b> с видео`:""}</div></a>`}).join("")}</div>
 <h2>Профили производителей механики</h2><div class="grid g4">${DB.manufacturers.filter(m=>(m.has_profile||m.profile)&&m.n_mech).sort((a,b)=>(a.short||"").localeCompare(b.short||"")).map(m=>`<a class="card" href="#/m/${m.id}" style="color:inherit;text-decoration:none"><b>${esc(m.short)}</b> <span class="muted small">${esc(m.country)}</span><div>${flags(m)}</div><div class="small muted">${m.n_mech} ${plM(m.n_mech)} механики</div></a>`).join("")}</div>`;

 cat=decodeURIComponent(cat);const all=DB.models.filter(x=>x.e3_category==cat);const mfs=[...new Set(all.map(x=>x.manufacturer_id))].sort((a,b)=>(M[a]?.short||a).localeCompare(M[b]?.short||b));
 if(XF.mf&&!mfs.includes(XF.mf))XF.mf="";if(XF.country&&!all.some(x=>M[x.manufacturer_id]?.country==XF.country))XF.country="";
 const rawSeg=parseHashAndShare().page;const _sid=SECIDS.includes(rawSeg)?rawSeg:secOf(cat);const _sec=DB.sections.find(s=>s.id==_sid)||DB.sections[0];
 const encCat=encodeURIComponent(cat);
 const nAct=activeXFCount();
 return `<p class="small" style="margin:0 0 6px"><a href="#/${_sid}">← ${esc(_sec.title.toLowerCase())}</a>${_sid=="kids"?` · <span class="muted">для просмотра всех моделей выберите любое назначение</span>`:""}</p>
 <h1>${esc(cat)}</h1><p class="lead">${esc(DB.mech_desc[cat]||"")}</p>
 <details class="category-guide" ontoggle="if(this.open&&!DB.mech_text?.[decodeURIComponent('${encCat}')])ensureChunks(['editorial']).then(()=>route(true))"><summary>Обзор категории, схема и производители (${mfs.length})</summary><div class="two"><div>${(DB.mech_text||{})[cat]||"<p class='muted small'>Загружаем обзор…</p>"}</div><figure class="scheme" style="margin:0">${DB.schemes[cat]||""}<figcaption>Упрощённая схема типа (редакционная иллюстрация, не чертёж производителя).</figcaption></figure></div>
 <h2>Производители (${mfs.length})</h2><p>${mfs.map(i=>`<a class="chip" href="#/m/${i}">${esc(M[i]?.short||i)}</a>`).join("")}</p></details>
 <div class="filter-mobile-bar">
  <button type="button" class="btn" id="xf-toggle" aria-expanded="${XF.mobileOpen}" onclick="toggleMobileFilters()">Фильтры${nAct?` <span class="llbadge" id="xf-badge">${nAct}</span>`:`<span class="llbadge hide" id="xf-badge">0</span>`}</button>
  <div class="quick-checks">
   <label><input type="checkbox" id="xf-ph-m" ${XF.hasPhoto?'checked':''} onchange="XF.hasPhoto=this.checked;syncXFChecks('${encCat}')"> с фото</label>
   <label><input type="checkbox" id="xf-vd-m" ${XF.hasVideo?'checked':''} onchange="XF.hasVideo=this.checked;syncXFChecks('${encCat}')"> с видео</label>
  </div>
  <span id="xcount-m" class="muted small" style="flex-basis:100%"></span>
 </div>
 <div class="filters is-collapsible ${XF.mobileOpen?'open':''}" id="xfilters">
  <input placeholder="Название" value="${esc(XF.q)}" oninput="XF.q=this.value;drawX('${encCat}')">
  <select onchange="XF.mf=this.value;drawX('${encCat}')"><option value="">Все производители</option>${mfs.map(i=>`<option value="${i}" ${XF.mf==i?'selected':''}>${esc(M[i]?.short||i)}</option>`).join("")}</select>
  <select onchange="XF.aud=this.value;drawX('${encCat}')"><option value="">Любое назначение</option>${["Детские","Семейные","Экстремальные","Туристические"].map(a=>`<option ${XF.aud==a?'selected':''}>${a}</option>`).join("")}</select>
  <select onchange="XF.rf=this.value;drawX('${encCat}')"><option value="">Любой статус РФ</option>${Object.keys(RFS).map(s=>`<option ${XF.rf==s?'selected':''}>${s}</option>`).join("")}</select>
  <label>рост до <input type="number" style="width:70px" value="${esc(XF.maxh)}" oninput="XF.maxh=this.value;drawX('${encCat}')"> см</label>
  <label>от <input type="number" style="width:80px" value="${esc(XF.minpph)}" oninput="XF.minpph=this.value;drawX('${encCat}')"> чел/час</label>
  <label class="small"><input type="checkbox" ${XF.unk?'checked':''} onchange="XF.unk=this.checked;drawX('${encCat}')"> включая неизвестно</label>
  <label class="small"><input type="checkbox" id="xf-ph-d" ${XF.hasPhoto?'checked':''} onchange="XF.hasPhoto=this.checked;syncXFChecks('${encCat}')"> с фото</label>
  <label class="small"><input type="checkbox" id="xf-vd-d" ${XF.hasVideo?'checked':''} onchange="XF.hasVideo=this.checked;syncXFChecks('${encCat}')"> с видео</label>
  <select onchange="XF.country=this.value;drawX('${encCat}')"><option value="">Все страны</option>${[...new Set(all.map(x=>M[x.manufacturer_id]?.country).filter(c=>c&&c!=="нет данных"))].sort().map(c=>`<option ${XF.country==c?'selected':''}>${esc(c)}</option>`).join("")}</select>
  ${XF.type?`<span class="chip">тип: ${esc(TY[XF.type]?.name_ru||XF.type)} <button type="button" style="border:0;background:none;padding:0 4px" onclick="XF.type='';route(true)">×</button></span>`:""}
  <button type="button" class="feed-text" onclick="resetXF()">сбросить фильтры</button>
  <span id="xcount" class="muted small"></span>
 </div>
 <details class="small" style="margin:6px 0 14px"><summary>Как читать чел/час и «≈»</summary><p class="small muted">Число без знака — по источнику; «≈» — оценка книги (у механики «места × 20», у горок и колёс — по медиане типа). Единицы, режим и источник проверяйте в карточке.</p></details>
 <div class="grid g4" id="xgrid"></div>`;
};

window.syncXFChecks=function(encCat){
 ["#xf-ph-m","#xf-ph-d"].forEach(s=>{const el=$(s);if(el)el.checked=XF.hasPhoto;});
 ["#xf-vd-m","#xf-vd-d"].forEach(s=>{const el=$(s);if(el)el.checked=XF.hasVideo;});
 drawX(encCat);
};

function drawX(c){
 const cat=decodeURIComponent(c);const q=XF.q.toLowerCase();
 const L=DB.models.filter(x=>x.e3_category==cat&&(!XF.mf||x.manufacturer_id==XF.mf)&&(!XF.aud||x.audience==XF.aud)&&(!XF.rf||(M[x.manufacturer_id]?.rf_status||"неизвестно")==XF.rf)&&(!XF.maxh||(x.min_height_cm==null?XF.unk:x.min_height_cm<=+XF.maxh))&&(!XF.minpph||(pphV(x)==null?XF.unk:pphV(x)>=+XF.minpph))&&(!XF.country||M[x.manufacturer_id]?.country==XF.country)&&(!XF.type||x.type_id==XF.type)&&(!XF.hasPhoto||Boolean(x.photo_file))&&(!XF.hasVideo||(x.videos_count||0)>0)&&(!q||x.model.toLowerCase().includes(q)))
  .sort((a,b)=>(M[a.manufacturer_id]?.short||"").localeCompare(M[b.manufacturer_id]?.short||"")||a.model.localeCompare(b.model));
 const unkN=L.filter(x=>(XF.maxh&&x.min_height_cm==null)||(XF.minpph&&pphV(x)==null)).length;const estN=XF.minpph?L.filter(x=>x.capacity_pph==null&&x.pph_est!=null&&!x.pph_per_vehicle).length:0;
 let oth="";if(XF.type){const o={};DB.models.filter(x=>x.type_id==XF.type&&x.e3_category!=cat).forEach(x=>o[x.e3_category]=(o[x.e3_category]||0)+1);const k=Object.keys(o);if(k.length)oth=` · ещё ${Object.values(o).reduce((a,b)=>a+b,0)} ${plM(Object.values(o).reduce((a,b)=>a+b,0))} этого типа в других категориях: `+k.map(c2=>MECH.includes(c2)?`<a href="#/mech/${encodeURIComponent(c2)}">${esc(c2)}</a> (${o[c2]})`:`${esc(c2)} (${o[c2]})`).join(", ")}
 const totalInCat=DB.models.filter(x=>x.e3_category==cat).length;
 const msgHtml=`показано ${L.length} из ${totalInCat}`+(unkN?`, из них ${unkN} с неизвестным ростом или чел/час`:"")+(estN?`, у ${estN} чел/час — оценка книги`:"")+oth;
 if($("#xcount"))$("#xcount").innerHTML=msgHtml;
 if($("#xcount-m"))$("#xcount-m").innerHTML=msgHtml;
 const nAct=activeXFCount();const bdg=$("#xf-badge");
 if(bdg){bdg.textContent=String(nAct);bdg.classList.toggle("hide",!nAct);}
 $("#xgrid").innerHTML=L.map(mcard).join("")||'<p class="muted">Под фильтр ничего не подходит. <button class="btn" onclick="resetXF()">Сбросить фильтры</button></p>';
}

P["compare"]=()=>{
 const ctx=activeCMPCtx();
 const L=ctx.ids.map(id=>MD[id]).filter(Boolean);
 const banner=ctx.isShared?`<div class="shared-banner"><p><b>Сравнение моделей по ссылке (${L.length}).</b> Ваше личное сравнение (${ctx.ownIds.length}/6) не изменено.</p><div class="actions"><button class="btn pri" onclick="mergeSharedIntoCMP(${esc(JSON.stringify(ctx.ids))})">Добавить в мое сравнение</button><button class="btn" onclick="addAllToLL(${esc(JSON.stringify(ctx.ids))})">Сохранить все в лонг-лист</button><a class="btn" href="#/compare">Мое сравнение (${ctx.ownIds.length}/6)</a></div></div>`:"";
 if(!L.length)return `<h1>Сравнение моделей</h1>${banner}<p class="lead">Отметьте «сравнить» у 2–6 моделей в разделах с карточками: <a href="#/mech">«Механические»</a>, <a href="#/coasters">«Горки»</a>, <a href="#/wheels">«Колёса»</a>, <a href="#/water">«Водные»</a>, <a href="#/media">«Медиа»</a>, <a href="#/fec">«Центры»</a>, <a href="#/transport">«Поезда»</a> или <a href="#/kids">«Детские»</a>.</p>`;
 const F=[["Иллюстрация",x=>x.photo_file?`<img src="${esc(x.photo_file)}" alt="${esc(x.model)}" style="width:100%;height:110px;object-fit:cover;border-radius:6px" loading="lazy">`:`<span class="muted small">схема в карточке</span>`,1],["Производитель",x=>M[x.manufacturer_id]?.short],["Страна",x=>M[x.manufacturer_id]?.country],["Статус для РФ",x=>rfBadge(M[x.manufacturer_id]?.rf_status),1],["Категория",x=>x.e3_category],["Назначение",x=>x.audience],["Места, шт",x=>x.seats],["Загрузка, чел/час",x=>pphF(x)],["Рост от, см",x=>hFull(x)],["Мощность, кВт",x=>x.power_kw],["Площадь, м²",x=>x.area_m2],["Габариты, м",x=>x.dimensions_m],["Высота, м",x=>x.height_m],["Длина трассы, м",x=>x.track_length_m],["Скорость, км/ч",x=>x.max_speed_kmh],["Переворотов",x=>x.inversions],["Диаметр колеса, м",x=>x.diameter_m],["Кабин",x=>x.gondolas],["Бесфундаментный",x=>x.foundation_free==null?null:(x.foundation_free?"да":"нет")],["Условия параметров и статус",x=>[x.param_notes,x.model_status?"Статус модели: "+x.model_status:"",x.mfr_warning].filter(Boolean).map(t=>"<p class=\"small\">"+esc(t)+"</p>").join("")||"<span class=\"muted\">Дополнительные условия не указаны; уточнить комплектацию у поставщика.</span>",1],["Преимущества и отличия",x=>advantagesCompact(x),1],["Основной источник модели",x=>srcLink(x.spec_source),1]];
 const idsJson=esc(JSON.stringify(ctx.ids));
 return `<h1>Сравнение моделей</h1>${banner}<p class="small muted">Проверьте условия параметров и статус: числа могут относиться к типовой конфигурации или границе диапазона. Нажмите название модели, чтобы открыть полную карточку.</p>
 <div class="share-bar">
  <button class="btn pri" onclick="exportXLSX(${idsJson})">Скачать XLSX (с вопросами КП)</button>
  <button class="btn" onclick="addAllToLL(${idsJson})">В лонг-лист (${L.length})</button>
  <button class="btn" onclick="copyListUrl('compare',${idsJson})">Ссылка на подборку</button>
  <button class="btn" onclick="copyModelsForChat('Сравнение моделей','compare',${idsJson})">Скопировать для чата</button>
  ${ctx.isShared?"":`<button class="btn" onclick="CMP=[];saveCMP();route(true)">Очистить</button>`}
 </div>
 <div class="tw"><table class="t"><tr><th>Параметр</th>${L.map(x=>`<th><a class="btn compare-model" href="#/model/${esc(x.id)}" data-model="${esc(x.id)}" onclick="return goModel('${x.id}',event)">${esc(x.model)}</a>${ctx.isShared?"":`<br><button class="btn" onclick="toggleCMP('${x.id}')">убрать</button>`}</th>`).join("")}</tr>
 ${F.map(f=>`<tr><td><b>${f[0]}</b></td>${L.map(x=>{const v=f[1](x);return `<td>${f[2]?v:(v==null||v===""?'<span class="muted">неизвестно</span>':fmt(v))}</td>`}).join("")}</tr>`).join("")}</table></div>
 <p class="small muted">Чел/час: число — по источнику; «≈» — оценка книги (см. «Методику»). Сравнивать загрузку и окупаемость можно только на одной базе.</p>`;
};

function candidateQuestions(x){const m=M[x.manufacturer_id]||{};const q=[];q.push("Подтвердить выбранные преимущества на сопоставимой комплектации и условиях работы");
 const lead=x.lead||{};
 if(lead.kind!=="source"||lead.duration_kind!=="manufacturing")q.push(lead.kind==="approx"?"Подтвердить срок этой модели: в книге только ориентир":"Получить срок изготовления и отдельно доставки/монтажа");
 else q.push("Подтвердить актуальность срока и точку начала отсчета в новом КП");
 if(lead.day_basis)q.push("Уточнить календарный график: источник дает срок в днях, без универсального перевода в месяцы");
 if(x.capacity_pph==null||x.pph_est!=null||/формул|оценк/.test(x.pph_src||""))q.push("Получить рабочую пропускную способность и время цикла с посадкой");
 if(!m.service_rf)q.push("Уточнить сервис, запасные части и сроки их поставки");
 if(m.rf_status!=="поставляет")q.push("Подтвердить возможность поставки и ее условия");
 if(m.rf_operating_limitation)q.push(m.rf_operating_limitation);
 if(!x.installations||!x.installations.length)q.push("Запросить действующую установку этой версии для референс-визита");
 else q.push("Подтвердить действующий статус и совпадение версии у выбранного референсного объекта");
 return q;}
function candidateQuestionsHtml(L){return `<h2>Что уточнить по кандидатам</h2><p class="small muted">Эти вопросы помогают подготовить запрос. Они не являются рейтингом моделей; готовый лист «Запрос КП» входит в XLSX.</p><div class="scroll"><table><thead><tr><th>Модель</th><th>До включения в проект</th></tr></thead><tbody>${L.map(x=>`<tr><td><a class="btn" href="#/model/${esc(x.id)}" onclick="return goModel('${x.id}',event)">${esc(x.model)}</a></td><td><ul>${candidateQuestions(x).map(q=>`<li>${esc(q)}</li>`).join("")}</ul></td></tr>`).join("")}</tbody></table></div>`;}

P["longlist"]=()=>{
 const ctx=activeLLCtx();
 const L=ctx.ids.map(id=>MD[id]).filter(Boolean);
 const idsJson=esc(JSON.stringify(ctx.ids));
 const banner=ctx.isShared?`<div class="shared-banner"><p><b>Лонг-лист по ссылке (${L.length}).</b> Ваш личный лонг-лист (${ctx.ownIds.length}) сохранен и не перезаписан. Выгрузка XLSX и CSV ниже сформирует именно открытую подборку по ссылке.</p><div class="actions"><button class="btn pri" onclick="mergeSharedIntoLL(${idsJson})">Добавить в мой лонг-лист</button><a class="btn" href="#/longlist">Мой лонг-лист (${ctx.ownIds.length})</a></div></div>`:"";
 return `<h1>Лонг-лист</h1>${banner}<p class="lead">Отобранные модели, основания выбора и вопросы поставщикам. XLSX открывается как самостоятельная таблица.</p>${L.length?`<div class="share-bar"><button class="btn pri" onclick="exportXLSX()">Скачать XLSX</button> <button class="btn" onclick="exportCSV()">Скачать CSV</button> <button class="btn" onclick="copyListUrl('longlist',${idsJson})">Ссылка на подборку</button> <button class="btn" onclick="copyModelsForChat('Лонг-лист моделей','longlist',${idsJson})">Скопировать для чата</button> ${ctx.isShared?"":`<button class="btn" onclick="window.EncyclopediaFeed.clearSaved('models');LL=[];saveLL();route(true)">Очистить</button>`}</div>
 <div class="tw"><table class="t"><tr><th>Модель</th><th>Производитель</th><th>Тип</th><th>Источник</th>${ctx.isShared?"":"<th></th>"}</tr>${L.map(x=>`<tr><td><a href="#/model/${esc(x.id)}" onclick="return goModel('${x.id}',event)">${esc(x.model)}</a></td><td>${mname(x.manufacturer_id)}</td><td>${esc(TY[x.type_id]?.name_ru||x.type_id)}</td><td>${srcLink(x.spec_source)}</td>${ctx.isShared?"":`<td><button class="btn" onclick="toggleLL('${x.id}')">убрать</button></td>`}</tr>`).join('')}</table></div>${candidateQuestionsHtml(L)}`:'<p>Пока пусто. Отметьте модели кнопкой «+ лонг-лист» в каталоге или фотоленте.</p>'}<h2>Как использовать выгрузку</h2><ol>${DB.paste_steps.map(s=>'<li>'+esc(s)+'</li>').join('')}</ol>`;
};

function pphV(x){return x.capacity_pph!=null?x.capacity_pph:(x.pph_est!=null&&!x.pph_per_vehicle?x.pph_est:null)}
function plN(n,a,b,c){const x=n%10,y=n%100;return x==1&&y!=11?a:x>=2&&x<=4&&(y<12||y>14)?b:c}
function plM(n){const a=n%10,b=n%100;return a==1&&b!=11?"модель":a>=2&&a<=4&&(b<12||b>14)?"модели":"моделей"}
function pphF(x){if(x.capacity_pph!=null)return fmt(x.capacity_pph)+(x.pph_src&&x.pph_src.includes("× 5")?"*":"");return x.pph_est!=null?"≈"+fmt(x.pph_est)+(x.pph_per_vehicle?(x.pph_unit_short||"/маш."):""):"—"}
function pphFull(x){if(x.capacity_pph!=null){let s=fmt(x.capacity_pph)+" — "+(x.pph_src||"источник");if(x.pph_src&&x.pph_src.includes("× 5")&&x.pph_book_alt!=null)s+=`; по методике книги (${x.pph_book_alt_src}) было бы ≈${fmt(x.pph_book_alt)}`;if(x.pph_source&&x.pph_source.url)s+=` (${x.pph_source.quote?"«"+x.pph_source.quote+"», ":""}${x.pph_source.url})`;else if(x.pph_quote)s+=` (в источнике: «${x.pph_quote}»)`;return s}return x.pph_est!=null?(x.pph_per_vehicle?`≈${fmt(x.pph_est)}${x.pph_unit||" на одну машину"} — ${(x.pph_src||"оценка книги").replace(/^оценка на (один вагон|одну машину): /,"оценка книги: ")} (уточнить в КП)`:`≈${fmt(x.pph_est)} — ${x.pph_src||"оценка книги"} (источник цифру не даёт; уточнить в КП)`):null}
const PUBLIC_HEAD=['Производитель','Модель','Тип','Страна','Описание','Места или игроки','Пропускная способность из источника','Пропускная способность: пояснение','Мощность, кВт','Площадь, м²','Высота, м','Габариты','Ростовой порог, см','Рост без сопровождения, см','Источники параметров и уточнений','Сайт производителя','Преимущества и отличия модели','Особенности производителя','Основания преимуществ модели','Примеры установок','Срок и состав срока','Источник срока','Статус модели','Условия размещения','Бесфундаментное исполнение','Передвижное исполнение','Проверка оснований модели','Условия параметров и ограничения'];
function parameterConditions(x){return [x.param_notes,x.mfr_warning,x.competitive_advantages?.limit].filter(Boolean).join("\n\n")}
function e2row(x){const m=M[x.manufacturer_id]||{},a=x.competitive_advantages||{};return [m.short||m.name,x.model,TY[x.type_id]?.name_ru||x.type_id,m.country,x.description_ru,x.seats,x.capacity_pph,pphFull(x),x.power_kw,x.area_m2,x.height_m,x.dimensions_m,x.min_height_cm,heightUnaccompanied(x),specEvidenceText(x),m.website,advantagesText(x),advantagesText(m),advantagesEvidence(x),(x.installations||[]).map(installationExport).join('\n'),x.lead?.kind==='source'?x.lead.text:'неизвестно',x.lead?.src?.url,x.model_status,x.indoor_outdoor,x.foundation_free==null?null:x.foundation_free?'да':'нет',x.transportable==null?null:x.transportable?'да':'нет',a.research?a.research.reason+' '+a.research.checked_sources.map(s=>s.url).filter(Boolean).join(' '):'Основания приведены в карточке',parameterConditions(x)]}

const RFQ_DOMESTIC=new Set(["Россия","Беларусь","Узбекистан"]);
function rfqRows(L){const head=["Производитель","Страна","Сайт","Куда писать (страница контактов на сайте производителя)","Импортёр в РФ (наводка)","Модель","Известно из книги","Запросить по модели","Запросить по модели (англ.)","Общие вопросы производителю","Общие вопросы производителю (англ.)","Источник в книге"];
 const rows=[head];const num=a=>a.map((q,i)=>(i+1)+") "+q).join(" ");const seen=new Set();
 const REGK=x=>{const c=x.e3_category,t=x.type_id;if(c=="Призовой интерактив"){if(t=="soft-play")return"042";if(t=="inflatable"||t=="trampoline")return"038";if(["video-arcade","sports-arcade","redemption","merchandiser","coin-kiddie","interactive-kids","interactive-play"].includes(t))return"el";return"unk"}if(c=="Иммерсивный медиа")return"med";return"038"};
 const REGQ={"038":["декларация или сертификат соответствия ТР ЕАЭС 038/2016 «О безопасности аттракционов»: есть ли, кто оформляет","EAEU conformity under TR EAEU 038/2016 (amusement rides): existing declaration or certificate, or who will obtain it"],
  "042":["сертификат соответствия ТР ЕАЭС 042/2017 «О безопасности оборудования для детских игровых площадок» (действует и для оборудования в помещениях): есть ли, кто оформляет","EAEU conformity certificate under TR EAEU 042/2017 (children's playground equipment, also indoor): existing certificate, or who will obtain it"],
  "el":["документы соответствия ЕАЭС на автомат как электрооборудование (ТР ТС 004/2011, ТР ТС 020/2011 или другие — какие нужны): есть ли, кто оформляет","EAEU conformity documents for the machine as electrical equipment (TR CU 004/2011, TR CU 020/2011 or others — which apply): existing documents, or who will obtain them"],
  "med":["документы соответствия ЕАЭС: для кресел и платформ с движением — ТР ЕАЭС 038/2016; для оборудования без движения — какие нужны; есть ли, кто оформляет","EAEU conformity documents: TR EAEU 038/2016 for motion seats and platforms; for equipment without motion — which apply; existing documents, or who will obtain them"],
  "unk":["какие документы соответствия ЕАЭС нужны на это оборудование (технический регламент или ГОСТ) и есть ли они; кто оформляет","which EAEU conformity documents apply to this equipment (technical regulation or standard), are they available, and who will obtain them"]};
 const regBy={};L.forEach(x=>{(regBy[x.manufacturer_id]=regBy[x.manufacturer_id]||new Set()).add(REGK(x))});
 const byM=[...L].sort((a,b)=>String((M[a.manufacturer_id]||{}).short||a.manufacturer_id).localeCompare(String((M[b.manufacturer_id]||{}).short||b.manufacturer_id),"ru"));
 byM.forEach(x=>{const m=M[x.manufacturer_id]||{};const dom=RFQ_DOMESTIC.has(m.country);const k=[],ru=[],en=[];
  const cat=String(x.e3_category||""),isF=cat=="Призовой интерактив",isW=cat=="Водный / сезонный",isMd=cat=="Иммерсивный медиа",isT=cat=="Трековый / транспортный";
  const cyc=isF?"длительность одной игры или сеанса и число игроков одновременно":"время цикла",cycE=isF?"duration of one game or session and number of simultaneous players":"cycle time";
  if(x.seats!=null)k.push((isF?"игроков одновременно ":"мест ")+x.seats);else if(isF){ru.push("число игроков одновременно");en.push("number of simultaneous players")}else{ru.push("число мест (пассажиров за цикл)");en.push("number of seats (riders per cycle)")}
  const pphF5=x.capacity_pph!=null&&/× 5/.test(x.pph_src||"");
  if(pphF5){k.push("пропускная способность "+fmt(x.capacity_pph)+" чел/ч — внутренняя оценка рабочего каталога по формуле «места × 5», не цифра производителя");ru.push("пропускная способность, чел/ч: теоретическая и рабочая; "+cyc);en.push("theoretical and operational hourly capacity (riders per hour); "+cycE)}
  else if(x.capacity_pph!=null){k.push("пропускная способность "+fmt(x.capacity_pph)+" чел/ч ("+(x.pph_src||"источник")+")");ru.push("подтвердите пропускная способность: в книге "+fmt(x.capacity_pph)+" чел/ч ("+(x.pph_src||"источник")+") — это теоретическая или рабочая цифра; "+(isF?cyc:"время цикла с посадкой и высадкой"));en.push("please confirm hourly capacity: our source gives "+fmt(x.capacity_pph)+" riders per hour — is it theoretical or operational; "+(isF?cycE:"cycle time including loading and unloading"))}else{if(x.pph_est!=null)k.push("пропускная способность ≈"+fmt(x.pph_est)+" чел/ч"+(x.pph_per_vehicle?(x.pph_unit||" на одну машину"):"")+" — оценка книги");ru.push("пропускная способность, чел/ч: теоретическая и рабочая; "+cyc);en.push("theoretical and operational hourly capacity (riders per hour); "+cycE)}
  if(hFull(x))k.push("рост: "+hFull(x));
  if(heightUnaccompanied(x)==null&&x.min_height_cm!=null){ru.push("уточните условия сопровождения для указанного ростового порога и отдельный допуск без взрослого");en.push("please clarify accompaniment conditions for the stated height threshold and the unaccompanied minimum height")}
  if(x.min_height_cm==null&&x.min_height_accompanied_cm==null){if(isF){ru.push("ограничения по возрасту, росту и весу игроков, если есть");en.push("player age, height and weight limits, if any")}else{ru.push("минимальный рост без сопровождения и со взрослым; максимальный рост и вес");en.push("minimum rider height unaccompanied and accompanied by an adult; maximum height and weight")}}
  else if(x.min_height_cm==null||x.min_height_accompanied_cm==null){ru.push("минимальный рост "+(x.min_height_cm==null?"без сопровождения":"со взрослым"));en.push("minimum rider height "+(x.min_height_cm==null?"unaccompanied":"accompanied by an adult"))}
  if(x.power_kw!=null)k.push("мощность "+fmt(x.power_kw)+" кВт");else{ru.push("установленная мощность, кВт; параметры питания");en.push("installed power (kW); power supply requirements")}
  if(x.dimensions_m||x.area_m2!=null)k.push("габариты "+(x.dimensions_m||"")+(x.area_m2!=null?(x.dimensions_m?", ":"")+fmt(x.area_m2)+" м²":""));else{ru.push("габариты площадки и высота; требования к фундаменту");en.push("footprint and height; foundation requirements")}
  const conditions=parameterConditions(x);if(conditions){k.push("Условия исходных параметров: "+conditions);ru.push("подтвердить параметры выбранной комплектации, включая мощность и габариты, с учетом приведенных условий и диапазонов");en.push("confirm parameters of the selected configuration, including power and dimensions, considering the stated conditions and ranges")}
  if(x.price_exw!=null)k.push("цена EXW из КП: "+fmt(x.price_exw)+" "+(x.currency||"")+(x.kp_date?" ("+x.kp_date+")":""));
  else{ru.push("цена EXW с валютой и условиями оплаты, срок действия предложения");en.push("EXW price with currency, payment terms and offer validity")}
  if(x.lead_time_months==null){ru.push("срок изготовления");en.push("manufacturing lead time")}
  if(x.lead?.kind==='source'&&x.lead?.text)k.push("срок по источнику: "+x.lead.text);
  if(x.lead?.day_basis){ru.push("рабочие или календарные дни, дата начала отсчета и календарный график изготовления");en.push("working or calendar days, start condition and dated manufacturing schedule")}
  if(x.trucks==null){ru.push("число грузовиков или контейнеров для доставки");en.push("number of trucks or containers for shipping")}
  if(String(x.e3_category||"").startsWith("Coaster")){ru.push("число поездов и интервал отправки (от них зависит пропускная способность); длина трассы, высота, скорость, перегрузки; тип подъёма и тормозов; уровень шума в дБА на заданном расстоянии");en.push("number of trains and dispatch interval (capacity depends on them); track length, height, speed, g-forces; lift and brake type; noise level in dBA at a stated distance")}
  if(!String(x.e3_category||"").startsWith("Колесо")&&!isF&&!isMd&&x.indoor_outdoor!=="крытый"){ru.push("если аттракцион уличный: диапазон рабочих температур и предельный ветер; есть ли исполнение для холодного климата");en.push("if installed outdoors: operating temperature range and wind limit; is a cold-climate version available")}
  if(String(x.e3_category||"").startsWith("Колесо")){ru.push("время оборота; посадка с остановкой или на ходу; число и вместимость кабин; обогрев или кондиционирование кабин, работа зимой; предельная скорость ветра");en.push("rotation time; loading with stops or while rotating; number and capacity of gondolas; gondola heating or air conditioning, winter operation; maximum wind speed for operation")}
  if(isF){ru.push("питание: работает ли от сети 220–230 В, 50 Гц без преобразователя; какие карточные (безналичные) системы оплаты поддерживает; если игра под чужим брендом (фильм, игра, спорт) — разрешены ли по лицензии продажа и работа в России");en.push("power: does it run on 220–230 V, 50 Hz mains without a converter; which card (cashless) systems it supports; if the game uses a third-party brand (film, game, sport) — does the licence allow sale and operation in Russia")}
  if(isW){ru.push("расход воды и мощность насосов; требования к водоподготовке (фильтрация, обеззараживание), объём бассейна-приёмника; для крытого аквапарка — нужная высота зала");en.push("water flow and pump power; water treatment requirements (filtration, disinfection), splash pool volume; for an indoor water park — required hall height")}
  if(isMd){ru.push("нужные высота и площадь зала; стоимость и срок замены контента (фильма, сюжета), есть ли готовая библиотека; лицензия на сюжет или бренд для показа в России; есть ли озвучка на русском");en.push("required hall height and floor area; cost and lead time to replace content (film, storyline), is a ready library available; licence for the storyline or brand in Russia; is Russian voice-over available")}
  if(isT){ru.push("длина трассы, наименьший радиус поворота и наибольший уклон; тип пути и питания (рельсы, дорога, аккумулятор, топливо); число вагонов и мест в составе");en.push("route length, minimum curve radius and maximum gradient; track and power type (rail, road, battery, fuel); number of cars and seats per train")}
  if(x.dup_catalog)k.push("похоже, уже в рабочем каталоге: "+x.dup_catalog+" — сверьте до запроса");
  if(m.inactive)k.unshift("статус компании: "+(m.company_status||"работа не подтверждена"));
  if(m.rf_operating_limitation)k.push(m.rf_operating_limitation);
  {const sr=SR(m);if(sr){k.push("санкционный режим страны производителя: "+sr.name_ru+" (сверка: "+sr.status+")");if(isF&&sr.games_9504)k.push("если позиция — игровой автомат (код 9504): "+sr.games_9504)}}
  let gru="",gen="";if(!seen.has(x.manufacturer_id)){seen.add(x.manufacturer_id);
   const g=[dom?"срок и условия доставки до парка":"поставки в Россию после 2022 года: были ли (дата, объект, через кого); возможна ли поставка сейчас, через какого импортёра и каким путём ввоза",...[...regBy[x.manufacturer_id]].map(r=>REGQ[r][0]),"назначенный срок службы и гарантия","запчасти: склад, сроки и путь поставки"+(dom?"":" в Россию"),"монтаж, шеф-монтаж, обучение персонала, сервис"+(dom?"":" в России"),"документация на русском языке: паспорт, руководство по эксплуатации"];
   const ge=["deliveries to Russia since 2022: any (date, site, via whom); is delivery possible now, via which importer and route",...[...regBy[x.manufacturer_id]].map(r=>REGQ[r][1]),"designated service life and warranty","spare parts: stock, lead times and supply route to Russia","installation or supervision, staff training, service in Russia","documentation in Russian: ride passport, operation manual"];
   if(!dom){g.push("оплата из России: через какой банк и в какой валюте вы принимаете платежи");ge.push("payment from Russia: which bank and currency you accept payments through")}
   {const sr=SR(m);if(sr&&sr.parts_limited){g.push("как будут поставляться запчасти, на которые в стране производителя действуют ограничения экспорта в Россию ("+sr.parts_short+")");ge.push("how spare parts subject to export restrictions to Russia ("+sr.parts_short_en+") will be supplied")}else if(sr&&sr.code=="NONE"){g.push("есть ли в конструкции узлы из стран, которые ограничивают экспорт в Россию (двигатели, подшипники, редукторы, шкафы управления), и чем их можно заменить");ge.push("whether the ride contains components from countries that restrict exports to Russia (motors, bearings, gearboxes, control cabinets) and what they can be replaced with")}}
   gru=num(g);gen=dom?"":num(ge)}
  rows.push([m.short||x.manufacturer_id,m.country||"",m.website||"",m.contact?[m.contact.url,m.contact.email,m.contact.phone].filter(Boolean).join("; "):"",dom?"":(m.rf_importer_hint||"проверить в реестре деклараций и сертификатов ЕАЭС (pub.fsa.gov.ru) по названию изготовителя: заявитель — импортёр, который уже ввозил эту марку"),x.model,k.join("; ")||"—",num(ru),dom?"":num(en),gru,gen,((x.spec_source&&x.spec_source.url)||"")])});
 return rows}

function llData(customIds){
 const ids=Array.isArray(customIds)?customIds:activeLLCtx().ids;
 const L=ids.map(id=>MD[id]).filter(Boolean);
 return {L,head:PUBLIC_HEAD,rows:L.map(e2row)};
}
function dl(name,blob){window.__lastExportDownload={name,size:blob.size,blob};const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
async function exportCSV(customIds){
 const ids=Array.isArray(customIds)?customIds:activeLLCtx().ids;
 await ensureChunks(["mfrs-full","r11",...modelChunksForIds(ids)]);
 const {head,rows}=llData(ids);
 const q=v=>v==null?"":typeof v==="number"?String(v).replace(".",","):(/[;"\n]/.test(String(v))?'"'+String(v).replace(/"/g,'""')+'"':String(v));
 dl(`лонг-лист_${new Date().toISOString().slice(0,10)}.csv`,new Blob(["\uFEFF"+[head,...rows].map(r=>r.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}));
}

const CRC=(()=>{let t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=t[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}})();
function zip(files){const enc=new TextEncoder();let parts=[],cd=[],off=0;const u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];
 for(const [name,str] of files){const nb=enc.encode(name),db=enc.encode(str),crc=CRC(db);
  const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)]);
  parts.push(lh,nb,db);cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);off+=lh.length+nb.length+db.length}
 const cdl=cd.reduce((s,a)=>s+a.length,0);const end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cdl),...u32(off),0,0]);
 return new Blob([...parts,...cd,end],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
function colL(i){let s="";i++;while(i>0){let m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
function sheetXml(rows,widths,wrapCols=[]){const x=v=>String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,"");
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${widths?`<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")}</cols>`:""}<sheetData>`+
 rows.map((r,ri)=>`<row r="${ri+1}">`+r.map((v,ci)=>{if(v==null||v==="")return"";const ref=colL(ci)+(ri+1);return typeof v==="number"&&isFinite(v)?`<c r="${ref}"${ri==0?' s="1"':wrapCols.includes(ci)?' s="2"':''}><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr"${ri==0?' s="1"':wrapCols.includes(ci)?' s="2"':''}><is><t xml:space="preserve">${x(v)}</t></is></c>`}).join("")+`</row>`).join("")+`</sheetData></worksheet>`}

async function exportXLSX(customIds){
 const ids=Array.isArray(customIds)?customIds:activeLLCtx().ids;
 await ensureChunks(["mfrs-full","r11",...modelChunksForIds(ids)]);
 const {L,head,rows}=llData(ids);
 const how=[["Как использовать лонг-лист"],["Числа могут относиться к типовой конфигурации или границе диапазона. Перед использованием прочитайте столбец Условия параметров и ограничения и подтвердите выбранную комплектацию у поставщика."],...DB.paste_steps.map(s=>[s]),["Основания преимуществ приведены в отдельных колонках. Факт источника и условная польза различаются."]];
 const sheets=[["Лонг-лист",sheetXml([head,...rows],head.map((_,i)=>i===27?64:24),[27])],["Как использовать",sheetXml(how,[100],[0])],["Запрос КП",sheetXml(rfqRows(L),[22,12,26,40,50,30,60,70,70,90,90,40],[6,7,8])]];
 const wb=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${s[0]}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`;
 const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Helvetica Neue"/></font><font><b/><sz val="11"/><name val="Helvetica Neue"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
 const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`;
 const root=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
 dl(`лонг-лист_${new Date().toISOString().slice(0,10)}.xlsx`,zip([["[Content_Types].xml",ct],["_rels/.rels",root],["xl/workbook.xml",wb],["xl/_rels/workbook.xml.rels",rels],["xl/styles.xml",styles],...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,s[1]])]));
}

P["market"]=()=>DB.market_html||"";
P["quiet"]=()=>DB.quiet_html||"";
P["used"]=()=>DB.used_html||"";
P["ostrov"]=()=>DB.ostrov_html||"";
P["method"]=()=>DB.method_html||"";
P["sources"]=()=>{
 const photoModels=DB.models.filter(x=>x.photo_file);
 const videoModels=DB.models.filter(x=>(x.videos_count||0)>0);
 return `<h1>Источники</h1><p class="lead">Ссылки из записей книги (${(DB.sources||[]).length}): источники фактов, уточнений, фотографий и видеороликов. Поисковый запрос сам по себе не подтверждает утверждение. Даты публикации и проверки указаны в записях, если они установлены.</p><div class="filters"><input placeholder="Фильтр" oninput="document.querySelectorAll('#srcl li').forEach(li=>li.classList.toggle('hide',!li.textContent.toLowerCase().includes(this.value.toLowerCase())))"></div><ol id="srcl" class="small">${(DB.sources||[]).map(s=>`<li>${srcLink(s)} <span class="muted">— ${esc(s.used_by)}</span></li>`).join("")}</ol>
 <h2>Фотографии и иллюстрации моделей (${photoModels.length})</h2><p class="small muted">Изображения взяты с официальных сайтов, брошюр и архивов производителей, подтвержденных дистрибьюторов, сайтов парков и профильных баз (RCDB, Coasterpedia, Wikimedia Commons) с указанием типа кадра (заводской кадр, конкретная установка в парке, 3D-рендер или чертеж) и уменьшены до 1200 px в прогрессивном sRGB JPEG. Права принадлежат правообладателям; для свободных лицензий сохранены автор и лицензия.</p><ol class="small">${photoModels.map(x=>`<li><a href="#/model/${esc(x.id)}" onclick="return goModel('${x.id}',event)">${esc(x.model)}</a> (${esc(M[x.manufacturer_id]?.short||x.manufacturer_id)})${(x.photos_count||0)>1?` · ${x.photos_count} кадра`:""} — ${srcLink(x.photo_page||x.photo_url||(x.spec_source||{}).url)}${x.photo_caption?` <span class="muted">— ${esc(x.photo_caption)}</span>`:""}</li>`).join("")}</ol>
 ${videoModels.length?`<h2>Встроенные видео (${videoModels.length} моделей)</h2><p class="small muted">Ролики подключаются по клику с официальных страниц производителей, каналов парков и видеоплатформ без локального копирования видеофайлов.</p><ol class="small">${videoModels.map(x=>`<li><a href="#/model/${esc(x.id)}" onclick="return goModel('${x.id}',event)">${esc(x.model)}</a> (${esc(M[x.manufacturer_id]?.short||x.manufacturer_id)}) — ${(x.videos||[]).map(v=>srcLink({url:v.direct_url,title:v.title||v.host_label})).join("; ")||"в карточке"}</li>`).join("")}</ol>`:""}`;
};

/* ---------- Dark attraction dossiers (DB.dark) ---------- */
const DKFORMAT={classic:'Классическая поездка',continuous:'Непрерывная система',trackless:'Безрельсовая поездка',interactive:'Интерактивная поездка',suspended:'Подвесная поездка',boat:'Лодочный маршрут',hybrid:'Гибрид','narrative-walk':'Сюжетный пеший маршрут',haunted:'Дом страха','immersive-walk':'Иммерсивный маршрут','night-trail':'Ночная световая тропа',adjacent:'Смежный формат'};
const DKREGION={'Europe':'Европа','North America':'Северная Америка','Asia':'Азия','Russia/CIS':'Россия и СНГ','Other':'Другие регионы'};
const DKMEDIA={'gallery':'Галерея','gallery-page':'Галерея','official-gallery':'Официальная галерея','official-gallery-link':'Официальная галерея','official-page':'Официальная страница','operator-page':'Страница оператора','supplier-gallery':'Галерея поставщика','photo-link':'Фото у источника','official-photo-link':'Фото у источника','official-video':'Официальное видео','official-video-page':'Страница с видео','video':'Видео','video-page':'Страница с видео'};
const DKBASIS={reported:'По опубликованному источнику','supplier-claim':'Заявление поставщика',unknown:'Неизвестно'};
function dkReviewKind(s){return s==='independent-firsthand'?'Независимый личный опыт':s}
let dkFilter={q:'',format:'',region:'',hasPhoto:false,hasVideo:false};
let dkCompare=[];try{dkCompare=JSON.parse(localStorage.getItem('dark-case-compare-v1')||'[]').filter(id=>DKCASE[id]).slice(0,6)}catch(e){}
function dkRefs(ids){return [...new Set(ids||[])].map(id=>{const s=DKSRC[id];return s?`<a class="dk-ref" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`:''}).join(' · ')}
function dkPlainRefs(ids){return [...new Set(ids||[])].map(id=>DKSRC[id]?.url).filter(Boolean).join('\n')}
function dkLink(id){const c=DKCASE[id];return c?`<a href="#/darkcase/${id}">${esc(c.name)}</a>`:''}
function dkIntro(){return `<p class="dk-breadcrumb"><a href="#/dark">Дарк-райды и дарк-волки</a> / <a href="#/darkcompare">Сравнение объектов (<span data-dk-count>${dkCompare.length}</span>/6)</a></p>`}
function dkToggle(id){if(!DKCASE[id])return;const i=dkCompare.indexOf(id);let msg='';if(i>=0){dkCompare.splice(i,1);msg='Объект удален из сравнения.'}else if(dkCompare.length<6){dkCompare.push(id);msg='Объект добавлен в сравнение.'}else{msg='В сравнении уже 6 объектов. Уберите один, чтобы добавить другой.'}
 localStorage.setItem('dark-case-compare-v1',JSON.stringify(dkCompare));
 document.querySelectorAll('[data-dk-compare]').forEach(b=>{const on=dkCompare.includes(b.dataset.dkCompare);b.textContent=on?'В сравнении':'Сравнить объект';b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on)});
 const box=document.getElementById('dk-notice');if(box)box.textContent=msg;
 document.querySelectorAll('[data-dk-count]').forEach(n=>n.textContent=String(dkCompare.length));
 if(location.hash.startsWith('#/darkcompare')){route(true);}
}
function dkCompareButton(id){return `<button class="btn ${dkCompare.includes(id)?'on':''}" data-dk-compare="${id}" aria-pressed="${dkCompare.includes(id)}" onclick="dkToggle('${id}')">${dkCompare.includes(id)?'В сравнении':'Сравнить объект'}</button>`}
function dkCards(){const q=dkFilter.q.toLocaleLowerCase('ru').trim().split(/\s+/).filter(Boolean);return DK.cases.filter(c=>(!dkFilter.format||c.format===dkFilter.format)&&(!dkFilter.region||c.region===dkFilter.region)&&(!dkFilter.hasPhoto||(c.photos_count||0)>0)&&(!dkFilter.hasVideo||(c.videos_count||0)>0)&&q.every(w=>(c.name+' '+c.location+' '+c.country+' '+c.summary+' '+(c.tags||[]).join(' ')).toLocaleLowerCase('ru').includes(w)))}
function dkDraw(){const box=document.getElementById('dk-cases');if(!box)return;const xs=dkCards();document.getElementById('dk-results').textContent=`Объектов: ${xs.length} из ${DK.cases.length}`;
 box.innerHTML=xs.length?xs.map(c=>`<article class="dk-list-item"><div><span class="small muted">${esc(DKFORMAT[c.format]||c.format)} · ${esc(c.country)}${(c.photos_count||0)?` · ${c.photos_count} фото`:""}${(c.videos_count||0)?` · ▶ видео`:""}</span><h2>${dkLink(c.id)}</h2><p>${esc(c.summary)}</p><p class="small muted">${esc(c.location)}. ${esc(c.version)}</p></div><div class="dk-item-actions"><a class="btn" href="#/darkcase/${c.id}">Открыть досье</a>${dkCompareButton(c.id)}</div></article>`).join(''):'<p>По этим условиям объектов нет. Попробуйте другой формат или регион.</p>';
}
P.dark=()=>`<div class="dk-heading"><h1>Дарк-райды и дарк-волки</h1><p class="lead">Поездки через историю, пешие миры, дома страха и ночные тропы. Устройство, реальные объекты, эксплуатация и экономика с границами известных данных.</p></div>
 <div class="reading-links dk-tabs"><a href="#/ch/dark-formats">Как устроены</a><a href="#/ch/dark-operations">Как эксплуатировать</a><a href="#/ch/dark-economics">Посещаемость и экономика</a><a href="#/ch/dark-selection">Выбор для парка</a><a href="#/darkmodels">Модели и поставщики</a><a href="#/darkcoverage">Охват и пробелы</a></div>
 <details><summary>Охват раздела и источники</summary><p>${DK.cases.length} досье объектов, ${(DK.photos||[]).length||DK.photos_total||0} фотографий, ${DK.source_count_unique} источников. <a href="#/darkcoverage">Подробности охвата и пробелы</a>.</p></details>
 <p class="small muted">Досье относятся к конкретным местам и версиям. Посещения, часовая мощность и вместимость различаются.</p>
 <div class="dk-toolbar"><a class="btn" href="#/darkcompare">Сравнить выбранные (<span data-dk-count>${dkCompare.length}</span>/6)</a><button class="btn" onclick="dkExport('csv')">Все показатели CSV</button><button class="btn" onclick="dkExport('xlsx')">Все досье XLSX</button></div><p id="dk-notice" class="small" role="status" aria-live="polite"></p>
 <h2>Объекты мира</h2><div class="filters dk-filters"><label>Поиск<input id="dk-q" type="search" value="${esc(dkFilter.q)}" placeholder="Название, место или особенность" oninput="dkFilter.q=this.value;dkDraw()"></label><label>Формат<select id="dk-format" onchange="dkFilter.format=this.value;dkDraw()"><option value="">Все форматы</option>${Object.entries(DKFORMAT).map(([id,name])=>`<option value="${id}" ${dkFilter.format===id?'selected':''}>${name}</option>`).join('')}</select></label><label>Регион<select id="dk-region" onchange="dkFilter.region=this.value;dkDraw()"><option value="">Все регионы</option>${Object.entries(DKREGION).map(([id,name])=>`<option value="${id}" ${dkFilter.region===id?'selected':''}>${name}</option>`).join('')}</select></label><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" ${dkFilter.hasPhoto?'checked':''} onchange="dkFilter.hasPhoto=this.checked;dkDraw()"> с фото</label><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" ${dkFilter.hasVideo?'checked':''} onchange="dkFilter.hasVideo=this.checked;dkDraw()"> с видео</label></div><p id="dk-results" class="small muted" aria-live="polite"></p><div id="dk-cases"></div>`;

function dkFactList(xs){return (xs||[]).map(x=>`<div class="dk-fact"><h3>${esc(x.label||x.role||'')}</h3><p>${esc(x.text||x.name||'')}</p><p class="small">${dkRefs(x.source_ids)}</p></div>`).join('')}
function dkMetricLabel(m){return m.label||(DK.metric_labels||{})[m.metric]||m.metric}
function dkMetrics(c){return `<div class="tw"><table class="dk-metrics"><thead><tr><th scope="col">Показатель</th><th scope="col">Значение</th><th scope="col">Период и границы</th></tr></thead><tbody>${(c.metrics||[]).map(m=>`<tr><th scope="row">${esc(dkMetricLabel(m))}</th><td><strong>${m.value===null?'Неизвестно':esc(m.value)}</strong>${m.value===null?'':`<br>${esc(m.unit)}`}</td><td>${esc(m.period)}<br><b>${esc(m.scope)}</b><p>${esc(m.note||'')}</p><span class="small muted">${esc(DKBASIS[m.basis])}</span><p class="small">${dkRefs(m.source_ids)}</p></td></tr>`).join('')}</tbody></table></div>`}

let dkActiveGal=[], dkActiveIdx=0;
window.setDkGal=function(i){if(!dkActiveGal.length)return;dkActiveIdx=(i+dkActiveGal.length)%dkActiveGal.length;
 const p=dkActiveGal[dkActiveIdx];const img=$("#dkgal-img"),cnt=$("#dkgal-cnt"),meta=$("#dkgal-meta");
 if(img){img.src=p.file;img.alt=p.caption||"";}
 if(cnt)cnt.textContent=`${dkActiveIdx+1} / ${dkActiveGal.length}`;
 document.querySelectorAll(".dkgal-th").forEach((b,idx)=>b.classList.toggle("on",idx===dkActiveIdx));
 if(meta)meta.innerHTML=`<b>${esc(p.caption)}</b><br><span class="small"><span class="tag">конкретная установка в парке</span> ${esc(p.date)} · ${esc(p.author)} · <a href="${esc(p.source_page)}" target="_blank" rel="noopener">Источник</a> · <a href="${esc(p.license_url)}" target="_blank" rel="noopener">${esc(p.license)}</a>. ${esc(p.changes)}.</span><p class="small muted" style="margin:4px 0 0">${esc(p.version_note)}</p>`;
};

function dkGallery(c){
 const ps=(DK.photos||[]).filter(p=>p.case_id===c.id);
 const ls=c.media_links||[];
 const vids=c.videos||[];
 activeVideosList=vids;
 dkActiveGal=ps;dkActiveIdx=0;
 const hasSpoilers=ps.some(p=>p.spoiler);
 const galBody=ps.length?`<div class="mgal"><div class="mgal-stage" id="dkgal-stage" tabindex="0" aria-label="Галерея объекта, стрелки влево и вправо переключают кадры">
   <img id="dkgal-img" src="${esc(ps[0].file)}" alt="${esc(ps[0].caption)}" loading="lazy">
   ${ps.length>1?`<span class="mgal-count" id="dkgal-cnt">1 / ${ps.length}</span><button type="button" class="mgal-nav mgal-prev" onclick="setDkGal(dkActiveIdx-1)" aria-label="Предыдущий кадр">‹</button><button type="button" class="mgal-nav mgal-next" onclick="setDkGal(dkActiveIdx+1)" aria-label="Следующий кадр">›</button>`:""}
   <span class="mgal-origin">установка: ${esc(c.location||c.name)}</span>
  </div>
  ${ps.length>1?`<div class="mgal-thumbs">${ps.map((p,i)=>`<button type="button" class="mgal-th dkgal-th ${i===0?'on':''}" aria-label="Кадр ${i+1}: ${esc(p.caption)}" onclick="setDkGal(${i})"><img src="${esc(p.file)}" alt="" loading="lazy"></button>`).join("")}</div>`:""}
  <div class="mgal-meta" id="dkgal-meta"><b>${esc(ps[0].caption)}</b><br><span class="small"><span class="tag">конкретная установка в парке</span> ${esc(ps[0].date)} · ${esc(ps[0].author)} · <a href="${esc(ps[0].source_page)}" target="_blank" rel="noopener">Источник</a> · <a href="${esc(ps[0].license_url)}" target="_blank" rel="noopener">${esc(ps[0].license)}</a>. ${esc(ps[0].changes)}.</span><p class="small muted" style="margin:4px 0 0">${esc(ps[0].version_note)}</p></div></div>`:"";

 return `<h2>Фотографии, видео и материалы</h2>
  ${ps.length?`<details class="dk-gallery-toggle" ${hasSpoilers?"":"open"}><summary>${hasSpoilers?`Открыть фотографии (${ps.length}). Внутри могут быть сюжетные спойлеры`:`Фотографии объекта (${ps.length})`}</summary><p class="small muted">Снимки относятся к указанной дате, а не обязательно к нынешней версии.</p>${galBody}</details>`:'<p>Локальные фотографии со свободной лицензией в досье не найдены. Доступные материалы правообладателей приведены ниже.</p>'}
  ${vids.length?`<h3>Видео объекта</h3>${renderVideoBlocks(vids,ps[0]&&!ps[0].spoiler?ps[0].file:"")}`:""}
  ${ls.length?`<details><summary>Галереи, видео и материалы у источников (${ls.length})</summary><ul>${ls.map(l=>`<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a><span class="small muted"> · ${esc(DKMEDIA[l.kind]||l.kind)}. ${esc(l.rights||'Право на перепубликацию не подтверждено; только ссылка.')}</span></li>`).join('')}</ul></details>`:''}`;
}

function dkAllCaseSourceIds(c){let ids=[];for(const k of ['facts','roles','metrics','operations','history','reviews','advantages'])for(const x of c[k]||[])ids.push(...x.source_ids||[]);for(const x of c.unknowns||[])ids.push(...x.searched_source_ids||[]);return [...new Set(ids)]}
function dkModelLinks(c){return (c.model_ids||[]).map(id=>MD[id]?`<a class="btn" href="#/model/${esc(id)}" onclick="return goModel('${id}',event)">${esc(MD[id].model)}</a>`:'').join(' ')}
function dkLearning(c){const l=c.learning;if(typeof l==='string')return `<p>${esc(l)}</p>`;if(Array.isArray(l))return '<ul>'+l.map(x=>`<li>${esc(typeof x==='string'?x:JSON.stringify(x))}</li>`).join('')+'</ul>';if(l&&typeof l==='object')return Object.entries(l).map(([,v])=>`<p>${esc(Array.isArray(v)?v.join('\n'):v)}</p>`).join('');return ''}

P.darkcase=id=>{const c=DKCASE[id];if(!c)return `${dkIntro()}<h1>Объект не найден</h1><p>Вернитесь к списку и выберите досье.</p>`;const sourceIds=dkAllCaseSourceIds(c);return `${dkIntro()}<article class="dk-case"><p class="small muted">${esc(DKFORMAT[c.format]||c.format)} · ${esc(c.location)} · ${esc(c.country)}</p><h1>${esc(c.name)}</h1><p class="lead">${esc(c.summary)}</p><p class="dk-version"><b>Версия:</b> ${esc(c.version)}</p>${c.status?`<p class="small muted">${esc(c.status)}</p>`:''}<div class="dk-toolbar">${dkCompareButton(c.id)}<button class="btn" type="button" onclick="shareSingleItem('${esc(c.id)}',${esc(JSON.stringify(c.name))})">Поделиться досье</button><button class="btn" onclick="dkExport('xlsx',['${c.id}'])">Скачать досье XLSX</button><a class="btn" href="#/darkcompare">Сравнение (<span data-dk-count>${dkCompare.length}</span>/6)</a></div><p id="dk-notice" class="small" role="status" aria-live="polite"></p>
 <h2>Идея и устройство</h2>${dkFactList(c.facts)}
 <h2>Кто сделал</h2><div class="dk-roles">${dkFactList(c.roles)}</div>${c.manufacturer_ids?.length?`<p class="small">Профили компаний: ${c.manufacturer_ids.map(mid=>`<a href="#/m/${mid}">${esc(M[mid]?.name||mid)}</a>`).join(' · ')}</p>`:''}${c.model_ids?.length?`<p class="small muted">Связанные продуктовые карточки. Характеристики платформы могут отличаться от этой установки.</p><div class="dk-toolbar">${dkModelLinks(c)}</div>`:''}
 <h2>Показатели и экономика</h2><p class="small muted">Числа разных периодов, версий и границ учета не складываются. Часовая мощность не равна посещаемости.</p>${dkMetrics(c)}
 <h2>Эксплуатация и доступность</h2>${dkFactList(c.operations)}
 <h2>История и изменения</h2><ol class="dk-history">${(c.history||[]).map(x=>`<li><b>${esc(x.date)}</b><p>${esc(x.event)}</p><p class="small">${dkRefs(x.source_ids)}</p></li>`).join('')}</ol>
 <h2>Отличия и применимость</h2><p class="small muted">Факт отделен от редакционной оценки пользы. Это основания для отбора, а не рейтинг превосходства.</p>${(c.advantages||[]).map(a=>`<section class="dk-advantage"><h3>${esc(a.fact)}</h3><p><b>Когда полезно:</b> ${esc(a.when_useful)}</p><p><b>Ограничение:</b> ${esc(a.limit)}</p><p class="small">${dkRefs(a.source_ids)}</p></section>`).join('')}
 <h2>Отзывы и наблюдения</h2>${(c.reviews||[]).length?c.reviews.map(r=>`<div class="dk-fact"><p>${esc(r.text)}</p><p class="small muted">${esc(dkReviewKind(r.kind))}. ${esc(r.limitation)}</p><p class="small">${dkRefs(r.source_ids)}</p></div>`).join(''):'<p>Подходящий независимый разбор этой версии в проверенных источниках не найден.</p>'}
 ${dkGallery(c)}
 <h2>Чего пока не знаем</h2><ul>${(c.unknowns||[]).map(u=>`<li><p>${esc(u.note)}</p><p class="small">Проверены: ${dkRefs(u.searched_source_ids)}</p></li>`).join('')}</ul>
 <h2>Что взять для своего проекта</h2><p class="small muted">Редакционный разбор для предварительного выбора.</p>${dkLearning(c)}${c.related_case_ids?.length?`<p><b>Сопоставить с:</b> ${c.related_case_ids.map(dkLink).join(' · ')}</p>`:''}
 <details class="dk-source-register"><summary>Источники досье (${sourceIds.length})</summary><ol>${sourceIds.map(sid=>{const s=DKSRC[sid];return s?`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><p class="small muted">${esc(s.locator)}. Проверено ${esc(s.accessed)}.</p></li>`:""}).join('')}</ol></details></article>`};

P.darkcompare=()=>{
 const ctx=activeDKCompareCtx();
 const cs=ctx.ids.map(id=>DKCASE[id]).filter(Boolean);
 const idsJson=esc(JSON.stringify(ctx.ids));
 const banner=ctx.isShared?`<div class="shared-banner"><p><b>Сравнение объектов по ссылке (${cs.length}).</b> Ваше личное сравнение объектов (${ctx.ownIds.length}/6) не изменено.</p><div class="actions"><button class="btn pri" onclick="mergeSharedIntoDK(${idsJson})">Добавить в мое сравнение</button><a class="btn" href="#/darkcompare">Мое сравнение (${ctx.ownIds.length}/6)</a></div></div>`:"";
 return `${dkIntro()}<h1>Сравнение объектов</h1>${banner}<p class="lead">Сопоставьте устройство и ограничения конкретных установок. Их бюджеты и посещаемость относятся к разным периодам и не образуют общий рейтинг.</p><p id="dk-notice" role="status" aria-live="polite"></p>${cs.length?`<div class="dk-toolbar"><button class="btn pri" onclick="dkExport('xlsx',${idsJson})">Скачать сравнение XLSX</button><button class="btn" onclick="dkExport('csv',${idsJson})">Показатели CSV</button><button class="btn" onclick="copyListUrl('darkcompare',${idsJson})">Ссылка на подборку</button><button class="btn" onclick="copyDarkForChat(${idsJson})">Скопировать для чата</button><a class="btn" href="#/dark">Добавить объект</a></div><div class="tw"><table class="dk-comparison"><thead><tr><th scope="col">Предмет сравнения</th>${cs.map(c=>`<th scope="col">${dkLink(c.id)}${ctx.isShared?"":`<br>${dkCompareButton(c.id)}`}</th>`).join('')}</tr></thead><tbody>${[['Версия',c=>esc(c.version)],['Формат',c=>esc(DKFORMAT[c.format])],['Что отличает',c=>esc(c.summary)],['Показатели с условиями',c=>(c.metrics||[]).map(m=>`<p><b>${esc(dkMetricLabel(m))}:</b> ${m.value===null?'неизвестно':esc(m.value)+' '+esc(m.unit)}<br>${esc(m.period)}. ${esc(m.scope)}. ${esc(m.note)}<br><span class="small">${esc(DKBASIS[m.basis])}. ${dkRefs(m.source_ids)}</span></p>`).join('')],['Эксплуатация',c=>dkFactList(c.operations)],['Применимость',c=>(c.advantages||[]).map(a=>`<p><b>${esc(a.fact)}</b><br>Редакционная польза: ${esc(a.when_useful)}<br>Ограничение: ${esc(a.limit)}<br>${dkRefs(a.source_ids)}</p>`).join('')],['Связанные модели',c=>dkModelLinks(c)]].map(([label,fn])=>`<tr><th scope="row">${label}</th>${cs.map(c=>`<td>${fn(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p>Выберите до шести объектов в <a href="#/dark">разделе дарк-райдов и дарк-волков</a>. Модели оборудования сохраняются в своем <a href="#/compare">сравнении моделей</a>.</p>'}`;
};

P.darkmodels=()=>`${dkIntro()}<h1>Модели и участники проекта</h1><p class="lead">Транспортная платформа, сюжет, медиасистема и весь аттракцион требуют разных исполнителей. Ниже сохранены все тематические модели исходного каталога с уточнением роли и границ сравнения.</p><div class="dk-models">${(DK.model_dispositions||[]).map(d=>{const m=MD[d.model_id];if(!m)return "";return `<section class="dk-list-item"><div><h2><a class="ttl" href="#/model/${esc(m.id)}" onclick="return goModel('${m.id}',event)">${esc(m.model)}</a></h2><p><a href="#/m/${m.manufacturer_id}">${esc(M[m.manufacturer_id]?.name||'')}</a></p><p>${esc(d.note)}</p><p class="small">${dkRefs(d.source_ids)}</p><p>${(m.dark_case_ids||[]).map(dkLink).join(' · ')}</p></div><div><a class="btn" href="#/model/${esc(m.id)}" onclick="return goModel('${m.id}',event)">Карточка модели</a></div></section>`}).join('')}</div><h2>Роли в реализованных объектах</h2><p>Дизайнер и интегратор могут входить в команду оператора или быть внешними компаниями. Участие в одном проекте не доказывает полномочия поставлять все его компоненты.</p><div class="tw"><table><thead><tr><th>Участник</th><th>Подтвержденная роль и объект</th></tr></thead><tbody>${(DK.providers||[]).map(p=>`<tr><th scope="row">${esc(p.name)}</th><td>${p.roles.map(r=>`${esc(r.role)}: ${dkLink(r.case_id)} <span class="small">${dkRefs(r.source_ids)}</span>`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>`;
P.darkcoverage=()=>`${dkIntro()}<h1>Охват исследования</h1><p class="lead">Это проверяемая выборка мирового опыта, а не перечень всех существующих аттракционов. Граница исследования определяется разнообразием механизмов, условий и бизнес-моделей.</p>${DK.coverage_html||''}<h2>Кандидаты и решения</h2><div class="tw"><table><thead><tr><th>Объект</th><th>Решение</th><th>Основание</th></tr></thead><tbody>${(DK.candidates||[]).map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(({include:'Отдельное досье',context:'В контексте другого досье',adjacent:'Смежный формат',duplicate:'Дубликат / другая версия',insufficient:'Недостаточно подтверждения','out-of-scope':'Вне границ'})[c.decision]||c.decision)}</td><td>${esc(c.reason)}${c.url?` <a href="${esc(c.url)}" target="_blank" rel="noopener">Источник / след поиска</a>`:''}</td></tr>`).join('')}</tbody></table></div>`;

function dkModelDossiers(m){const ids=m.dark_case_ids||[];return ids.length?`<h3>Подробные досье установок</h3><p>${ids.map(id=>dkLink(id).replace('<a ','<a onclick="closeModal(true)" ')).join(' · ')}</p><p class="small muted">Параметры конкретного объекта не заменяют параметры продуктовой линейки.</p>`:''}
const dkWhereModelBase=whereModel;whereModel=function(m){return dkWhereModelBase(m)+dkModelDossiers(m)};
const dkMfrBase=P.m;P.m=function(id){const ms=DB.models.filter(m=>m.manufacturer_id===id);const ids=[...new Set([...ms.flatMap(m=>m.dark_case_ids||[]),...DK.cases.filter(c=>(c.manufacturer_ids||[]).includes(id)).map(c=>c.id)])];return dkMfrBase(id)+(ids.length?`<h2>Дарк-аттракционы: реализованные объекты</h2><p>${ids.map(dkLink).join(' · ')}</p><p>Роли исполнителей и условия преимуществ приведены в каждом досье.</p>`:'')};
const dkTypeBase=P.t;P.t=function(id){return dkTypeBase(id)+(['dark-ride','dark-walk','dark-coaster','interactive-theater','dark-hybrid','scenic-suspended'].includes(id)?'<p><a class="btn" href="#/dark">Объекты, фотографии и выбор для парка</a></p>':'')};
IDX.push(...DK.cases.map(c=>({k:(c.name+' '+c.location+' '+c.country+' '+(c.tags||[]).join(' ')).toLowerCase(),h:'#/darkcase/'+c.id,t:c.name,s:'досье объекта · '+(DKFORMAT[c.format]||c.format)})));
const dkMediaBase=P.media;P.media=function(cat){const html=dkMediaBase(cat);return cat?html:html.replace('</p>','</p><p class="reading-links"><a href="#/dark">Дарк-райды и дарк-волки: объекты и практический разбор</a></p>')};

function dkMetricRows(cs){return [['Объект','Версия','Показатель','Значение','Единица','Период','Область учета','Статус данных','Условия и ограничения','Источники'],...cs.flatMap(c=>(c.metrics||[]).map(m=>[c.name,c.version,dkMetricLabel(m),m.value===null?'Неизвестно':m.value,m.unit,m.period,m.scope,DKBASIS[m.basis]||m.basis,m.note,dkPlainRefs(m.source_ids)]))]}
function dkText(v){if(v==null)return '';if(typeof v==='string'||typeof v==='number')return String(v);if(Array.isArray(v))return v.map(dkText).join('\n');return Object.entries(v).map(([k,x])=>k+': '+dkText(x)).join('\n')}
function dkSheets(cs){const sourceIds=[...new Set(cs.flatMap(dkAllCaseSourceIds))];const photos=(DK.photos||[]).filter(p=>cs.some(c=>c.id===p.case_id));
 const info=[['Как читать досье'],['Каждая запись относится к определенному объекту и версии. Модель оборудования и установленный аттракцион не равнозначны.'],['Посещения, уникальные посетители, вместимость и расчетная часовая мощность различаются. Неизвестное значение не равно нулю.'],['Бюджеты сохраняют исходную валюту, год и состав работ. Значения разных лет не приведены к одной покупательной способности. Это не предложение поставщика.'],['Польза для собственного проекта и выводы о применимости являются редакционной оценкой, а не обещанием результата.'],['Право на фотографии указано отдельно. Ссылка на официальную галерею сама по себе не разрешает перепубликовать ее изображения.'],['Перед проектным решением уточните актуальную конфигурацию, требования площадки, эксплуатационные расходы и условия сервиса.']];
 const objects=[['Объект','Место','Страна','Регион','Формат','Версия','Кратко','Связанные модели','Редакционный разбор'],...cs.map(c=>[c.name,c.location,c.country,DKREGION[c.region]||c.region,DKFORMAT[c.format]||c.format,c.version,c.summary,(c.model_ids||[]).map(id=>MD[id]?.model||id).join('\n'),dkText(c.learning)])];
 const detail=[['Объект','Версия','Раздел','Предмет','Сведения','Ограничения','Источники']];
 for(const c of cs){for(const [k,label] of [['facts','Идея и устройство'],['roles','Участник проекта'],['operations','Эксплуатация'],['history','История'],['reviews','Отзывы']])for(const x of c[k]||[])detail.push([c.name,c.version,label,x.label||x.role||x.date||dkReviewKind(x.kind)||'',x.text||x.name||x.event||'',x.limitation||'',dkPlainRefs(x.source_ids)]);for(const a of c.advantages||[])detail.push([c.name,c.version,'Отличия и применимость',a.fact,'Редакционная польза: '+a.when_useful,a.limit,dkPlainRefs(a.source_ids)]);for(const m of c.media_links||[])detail.push([c.name,c.version,'Материалы у источника',m.label,DKMEDIA[m.kind]||m.kind,m.rights||'Право на перепубликацию не подтверждено',m.url])}
 const unknowns=[['Объект','Версия','Недостающие сведения','Что известно о пробеле','Проверенные источники'],...cs.flatMap(c=>(c.unknowns||[]).map(u=>[c.name,c.version,u.field,u.note,dkPlainRefs(u.searched_source_ids)]))];
 const photoRows=[['Объект','Фотография','Дата снимка','Автор','Лицензия','Лицензия URL','Источник','Оригинал','Изменения','Граница версии'],...photos.map(p=>[DKCASE[p.case_id]?.name||p.case_id,p.caption,p.date,p.author,p.license,p.license_url,p.source_page,p.download_url,p.changes,p.version_note])];
 const sourceRows=[['Источник','Название','Тип','Адрес','Проверен','Место в источнике','Зафиксированные сведения'],...sourceIds.map(id=>{const s=DKSRC[id];return s?[id,s.title,s.kind,s.url,s.accessed,s.locator,s.evidence]:null}).filter(Boolean)];
 return [['Как читать',info,[100]],['Объекты',objects,[30,30,18,22,28,65,65,35,90]],['Показатели',dkMetricRows(cs),[30,60,30,20,18,30,60,28,80,70]],['Сведения',detail,[30,60,28,40,90,70,70]],['Пробелы',unknowns,[30,60,30,90,70]],['Фотографии',photoRows,[30,60,22,30,20,50,70,70,35,70]],['Источники',sourceRows,[38,60,20,70,20,60,90]]];
}
function dkXml(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'')}
function dkSheetXml(rows,widths){return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols><sheetData>'+rows.map((r,ri)=>`<row r="${ri+1}">`+r.map((v,ci)=>v===null||v===undefined||v===''?'':typeof v==='number'&&isFinite(v)?`<c r="${colL(ci)}${ri+1}" s="${ri===0?1:2}"><v>${v}</v></c>`:`<c r="${colL(ci)}${ri+1}" t="inlineStr" s="${ri===0?1:2}"><is><t xml:space="preserve">${dkXml(v)}</t></is></c>`).join('')+'</row>').join('')+'</sheetData></worksheet>'}
function dkWorkbook(cs){const sheets=dkSheets(cs);const ns='http://schemas.openxmlformats.org';
 const wb=`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${s[0]}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
 const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${ns}/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="${ns}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
 const styles=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="${ns}/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><color rgb="FF000000"/><name val="Helvetica Neue"/></font><font><b/><sz val="11"/><name val="Helvetica Neue"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
 const ct=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
 return zip([['[Content_Types].xml',ct],['_rels/.rels',`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],['xl/workbook.xml',wb],['xl/_rels/workbook.xml.rels',rels],['xl/styles.xml',styles],...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,dkSheetXml(s[1],s[2])])]);
}
async function dkExport(kind,caseIdsOrObjs){
 await ensureChunks(["dark-full"]);
 let cs;
 if(Array.isArray(caseIdsOrObjs)){
  cs=caseIdsOrObjs.map(x=>typeof x==="string"?DKCASE[x]:DKCASE[x?.id]).filter(Boolean);
 }else if(parseHashAndShare().page==="darkcompare"){
  cs=activeDKCompareCtx().ids.map(id=>DKCASE[id]).filter(Boolean);
 }else{
  cs=DK.cases;
 }
 if(!cs.length)return;
 const filename='дарк-аттракционы_'+new Date().toISOString().slice(0,10);
 if(kind==='xlsx'){dl(filename+'.xlsx',dkWorkbook(cs));return}
 const q=v=>{let s=String(v??'');if(typeof v==='number')s=s.replace('.',',');else if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 dl(filename+'.csv',new Blob(['\uFEFF'+dkMetricRows(cs).map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
}

P[""]=()=>window.EncyclopediaFeed.html();
P["ideas"]=()=>window.EncyclopediaFeed.ideasHTML();

/* ---------- Async chunk-aware router ---------- */
let lastHash=null, routeSeq=0;
function requiredChunksForRoute(p,arg){
 if(p==="m")return ["mfrs-full","r11","dark-full",...modelChunksForIds(DB.models.filter(x=>x.manufacturer_id===arg).map(x=>x.id))];
 if(p==="t")return ["r11","mfrs-full",...modelChunksForIds(DB.models.filter(x=>x.type_id===arg).map(x=>x.id))];
 if(p==="compare")return ["mfrs-full","r11",...modelChunksForIds(activeCMPCtx().ids)];
 if(p==="longlist")return ["mfrs-full","r11",...modelChunksForIds(activeLLCtx().ids)];
 if(p.startsWith("dark")){
  const base=["dark-full"];
  if(p==="darkmodels")base.push("mfrs-full");
  return base;
 }
 if(["chapters","ch","glossary","market","quiet","used","ostrov","method"].includes(p))return ["editorial"];
 if(SECIDS.includes(p)&&!arg)return ["editorial"];
 if(p==="sources")return ["sources",...modelChunksForIds(DB.models.map(x=>x.id))];
 return [];
}

async function route(force){
 const {raw,page:p,arg}=parseHashAndShare();
 if(p==="model"&&arg){
  // Direct #/model/<id> entry: ensure underlying screen is rendered, then open modal
  const md=MD[arg];
  if(!md){closeModal(true);$("#app").innerHTML=`<h1>Модель не найдена</h1><p>Возможно, ссылка устарела. Найдите модель через поиск или откройте каталог.</p><a class="btn" href="#/catalog">Открыть каталог</a>`;$("#app").dataset.page="model";lastHash=raw;return;}
  if(!lastHash||$("#app").innerHTML.includes("Книга загружается")||$("#app").innerHTML.includes("Открываем энциклопедию")){
   const bgCat=md&&CATS.includes(md.e3_category)?md.e3_category:null;
   if(bgCat){
    const enc=encodeURIComponent(bgCat);
    $("#app").innerHTML=P["mech"](enc);$("#app").dataset.page=secOf(bgCat);drawX(enc);
   }else{
    $("#app").innerHTML=P.catalog();$("#app").dataset.page="catalog";
   }
  }
  lastHash=raw;
  await openModel(arg,false);
  return;
 }

 if(!force&&raw===lastHash)return;
 const keepScroll=force&&raw===lastHash;const y=window.scrollY;
 lastHash=raw;const mySeq=++routeSeq;

 if(!p||p==="ideas"){
  await window.EncyclopediaFeed.mount(p);
  return;
 }

 const needed=requiredChunksForRoute(p,arg);
 if(needed.some(n=>!loadedChunks.has(n))){
  $("#app").innerHTML=`<div class="feed-loading" role="status"><h1>Загружаем раздел…</h1></div>`;
  try{await ensureChunks(needed);}catch(e){
   if(mySeq===routeSeq)$("#app").innerHTML=`<h1>Не удалось загрузить раздел</h1><p role="alert">Проверьте соединение и повторите загрузку.</p><button class="btn" onclick="route(true)">Повторить</button>`;
   return;
  }
  if(mySeq!==routeSeq)return;
 }

 stopActiveMedia();
 const f=P[p]||P.catalog;
 $("#app").innerHTML=f(arg);
 $("#app").dataset.page=p;
 $("#app").classList.toggle("reading-page",["ch","quiet","used","method","sources"].includes(p));
 document.querySelectorAll(".filters select").forEach(s=>{if(!s.hasAttribute("aria-label"))s.setAttribute("aria-label",s.options[0]?.text||"Фильтр")});
 document.querySelectorAll(".filters input[placeholder]").forEach(s=>s.setAttribute("aria-label",s.placeholder));
 document.querySelectorAll(".tw,.scroll").forEach(n=>{n.tabIndex=0;n.setAttribute("role","region");n.setAttribute("aria-label","Таблица, прокручивается по горизонтали")});
 document.querySelectorAll("#nav a").forEach(a=>{
  const group=SECIDS.includes(p)||p==="t"||p==="types"||p==="overview"||p.startsWith("dark")?"catalog":p==="m"?"map":["chapters","ch","market","used","quiet","ostrov","glossary","sources"].includes(p)?"toc":p;
  const on=a.getAttribute("href").replace(/^#\/?/,"").split("/")[0]===group;
  a.classList.toggle("on",on);if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
 });
 if(p==="map"){bindMap();drawMList()}
 if(SECIDS.includes(p)&&arg){drawX(arg)}
 if(p==="glossary")drawG();
 if(p==="dark")dkDraw();
 if(p==="darkcase"){
  bindGalSwipe("#dkgal-stage",dkActiveGal.length,d=>setDkGal(dkActiveIdx+d));
  $("#dkgal-stage")?.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setDkGal(dkActiveIdx+(e.key==="ArrowRight"?1:-1))}});
 }
 document.querySelectorAll('.dk-filters input,.dk-filters select').forEach(x=>x.removeAttribute('aria-label'));
 labelTables();fitSchemeNotes();
 if(keepScroll)window.scrollTo(0,y);else window.scrollTo(0,0);
 window.EncyclopediaAnalytics?.pageView();
}

window.addEventListener("hashchange",()=>{
 if(!location.hash.startsWith("#/model/"))closeModal(true);
 route();
});

window.EncyclopediaCatalog={
 route:()=>route(true),
 openModel:(id)=>openModel(id,true),
 sync:()=>{LL=window.EncyclopediaFeed.readList("models").filter(id=>MD[id]);saveLL();},
 search:()=>document.querySelector("#q").dispatchEvent(new Event("input",{bubbles:true}))
};
window.addEventListener("storage",e=>{if(e.key==="attrenc.ll"){LL=window.EncyclopediaFeed.readList("models").filter(id=>MD[id]);if($("#llc"))$("#llc").textContent=LL.length;if(location.hash.startsWith("#/longlist"))route(true);}});

$("#foot").innerHTML=DB.footer_html;saveLL();saveCMP();route();
