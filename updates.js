/* Check for a newer release without interrupting selection or navigation. */
(() => {
  const release = document.querySelector('meta[name="encyclopedia-release"]');
  const notice = document.getElementById('update-notice');
  const link = document.getElementById('update-link');
  if (!release || !notice || !link || !/^https?:$/.test(location.protocol)) return;
  const current = Number(release.dataset.sequence);
  let checkedAt = 0, checking = false, nextRelease = '';
  function updateHref() {
    const url = new URL(location.href);
    url.searchParams.set('v', nextRelease);
    link.href = url.href;
  }
  async function check() {
    if (checking || document.hidden || Date.now() - checkedAt < 60000) return;
    checkedAt = Date.now(); checking = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const url = new URL('version.json', location.href);
      url.searchParams.set('check', String(checkedAt));
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) return;
      const version = await response.json();
      if (!Number.isSafeInteger(version.sequence) || version.sequence <= current ||
          typeof version.release !== 'string' || !/^\d{8}-r\d{2,}$/.test(version.release)) return;
      nextRelease = version.release;
      updateHref();
      notice.hidden = false;
    } catch (_) {
      // Offline reading and a transient deployment failure need no interruption.
    } finally {
      clearTimeout(timeout); checking = false;
    }
  }
  link.addEventListener('click', updateHref);
  window.addEventListener('hashchange', () => { if (nextRelease) updateHref(); });
  document.addEventListener('visibilitychange', check);
  window.addEventListener('focus', check);
  setInterval(check, 300000);
  check();
})();
