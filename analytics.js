/* Yandex Metrika for the published encyclopedia. Local previews never send data to Metrika. */
(function () {
  "use strict";
  const counterId = 114240618;
  const production = location.hostname === "konstantinpopov89.github.io" && location.pathname.startsWith("/attractions-encyclopedia/");
  if (window.EncyclopediaAnalytics) return;

  if (production && counterId) {
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://mc.yandex.ru/metrika/tag.js?id=" + counterId;
    document.head.appendChild(tag);
    window.ym(counterId, "init", { defer: true, webvisor: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }

  let previous = "";
  function computeTitle() {
    const modal = document.getElementById("modal");
    if (modal && modal.style.display === "flex") {
      const mt = document.getElementById("model-title");
      if (mt && mt.textContent.trim()) return mt.textContent.trim() + " — Аттракционы мира";
    }
    const heading = document.querySelector("#app h1");
    return heading && heading.textContent.trim() ? heading.textContent.trim() + " — Аттракционы мира" : document.title;
  }

  function pageView(customHash) {
    const url = new URL(location.href);
    url.searchParams.delete("v");
    url.searchParams.delete("_ym_debug");
    if (typeof customHash === "string" && customHash) {
      url.hash = customHash.startsWith("#") ? customHash : "#" + customHash;
    } else if (!url.hash || url.hash === "#") {
      url.hash = "/";
    }
    const current = url.href;
    if (current === previous) return;
    const title = computeTitle();
    const referer = previous || document.referrer;
    window.EncyclopediaAnalyticsLastHit = { url: current, title: title, referer: referer, sent: Boolean(production && counterId) };
    if (production && counterId && typeof window.ym === "function") {
      window.ym(counterId, "hit", current, { title: title, referer: referer });
    }
    previous = current;
  }

  window.EncyclopediaAnalytics = { pageView };
})();
