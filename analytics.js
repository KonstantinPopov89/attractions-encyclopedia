/* Yandex Metrika for the published encyclopedia. Local previews never send data. */
(function () {
  "use strict";
  const counterId = 114240618;
  const production = location.hostname === "konstantinpopov89.github.io" && location.pathname === "/attractions-encyclopedia/";
  if (!production || !counterId || window.EncyclopediaAnalytics) return;
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://mc.yandex.ru/metrika/tag.js?id=" + counterId;
  document.head.appendChild(tag);
  window.ym(counterId, "init", { defer: true, webvisor: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
  let previous = "";
  function pageView() {
    const url = new URL(location.href);
    url.searchParams.delete("v");
    url.searchParams.delete("_ym_debug");
    if (!url.hash || url.hash === "#") url.hash = "/";
    const current = url.href;
    if (current === previous) return;
    const heading = document.querySelector("#app h1");
    window.ym(counterId, "hit", current, { title: heading ? heading.textContent.trim() : document.title, referer: previous || document.referrer });
    previous = current;
  }
  window.EncyclopediaAnalytics = { pageView };
})();
