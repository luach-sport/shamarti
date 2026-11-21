/* TikTok video files: is the video downloadable (creator's setting, private, removed) and where its file is.
   Sources in order: TikTok's own download address (with TikTok's mark, like the app's "Save video"),
   then TikWM's copies. */
(function () {
  'use strict';
  const SH = window.SH;
  const T = SH.tiktok;

  // Cookies TikTok sets on the page; its video addresses only work with them.
  function cookiesFrom(headers) {
    const raw = (headers && headers['set-cookie']) || '';
    const skip = /^(expires|path|domain|max-age|samesite|secure|httponly|priority|partitioned)$/i;
    const out = [];
    const re = /(?:^|,\s*)([A-Za-z0-9_-]+)=([^;,]*)/g;
    let m;
    while ((m = re.exec(raw))) if (!skip.test(m[1])) out.push(m[1] + '=' + m[2]);
    return out.join('; ');
  }

  // The data TikTok puts inside its video page. Often missing when TikTok shows a check page instead.
  T.pageData = async (url, log) => {
    try {
      const page = await SH.getHtml(url, SH.UA.desktop, log);
      let item = null, status = -1;
      const m = page.html.match(/<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
      if (m) {
        const d = JSON.parse(m[1]);
        const vd = d && d.__DEFAULT_SCOPE__ && d.__DEFAULT_SCOPE__['webapp.video-detail'];
        if (vd) { status = +vd.statusCode || 0; item = (vd.itemInfo && vd.itemInfo.itemStruct) || null; }
      } else {
        const s = page.html.match(/<script[^>]+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
        if (s) { const d = JSON.parse(s[1]); item = (d && d.ItemModule && d.ItemModule[T.idOf(url)]) || null; status = item ? 0 : -1; }
      }
      SH.plog(log, 'tiktok page data: status ' + status + (item ? ', video found' : ', none'));
      return { status, item, cookies: cookiesFrom(page.headers), url: page.url };
    } catch (e) {
      SH.plog(log, 'tiktok page failed: ' + (e && e.message));
      return { status: -1, item: null, cookies: '', url };
    }
  };

  // The creator turned off "Allow downloads" (setting 3 = off, like TikTok's other privacy settings).
  T.downloadBlocked = (item) => {
    if (!item) return false;
    const a = item.author || {};
    if (a.downloadSetting === 3 || item.downloadSetting === 3) return true;
    if (item.preventDownload === true || (item.video && item.video.preventDownload === true)) return true;
    if (item.itemControl && item.itemControl.can_download === false) return true;
    return false;
  };

  const STATUS = { 10216: 'private', 10222: 'private', 10204: 'gone', 10202: 'gone', 10221: 'gone' };
  const okUrl = (u) => typeof u === 'string' && /^https?:\/\//.test(u) && !/^https?:\/\/www\.tiktok\.com\//.test(u);

  // { sources: [{ url, headers, from }], reason: '' | 'blocked' | 'private' | 'gone' | 'photo' | 'failed' }
  T.videoInfo = async (url, log) => {
    const full = await T.resolve(url, log);
    if (/\/photo\//.test(full)) return { sources: [], reason: 'photo' };
    const page = await T.pageData(full, log);
    if (STATUS[page.status]) return { sources: [], reason: STATUS[page.status] };
    if (T.downloadBlocked(page.item)) return { sources: [], reason: 'blocked' };

    const v = (page.item && page.item.video) || {};
    const fromPage = { 'User-Agent': SH.UA.desktop, Referer: page.url || full };
    if (page.cookies) fromPage.Cookie = page.cookies;
    const wm = await T.tikwm(full, log);
    const w = wm && !wm.error ? wm : null;
    if (w && Array.isArray(w.images) && w.images.length) return { sources: [], reason: 'photo' };
    const fromWm = { 'User-Agent': SH.UA.mobile };

    const list = [];
    if (okUrl(v.downloadAddr)) list.push({ url: v.downloadAddr, headers: fromPage, from: 'tiktok' });
    if (w && w.wmplay) list.push({ url: w.wmplay, headers: fromWm, from: 'tikwm' });
    if (okUrl(v.playAddr)) list.push({ url: v.playAddr, headers: fromPage, from: 'tiktok' });
    (v.bitrateInfo || []).forEach((b) => ((b.PlayAddr && b.PlayAddr.UrlList) || []).forEach((u) => { if (okUrl(u)) list.push({ url: u, headers: fromPage, from: 'tiktok' }); }));
    if (w && w.play) list.push({ url: w.play, headers: fromWm, from: 'tikwm' });
    if (w && w.hdplay) list.push({ url: w.hdplay, headers: fromWm, from: 'tikwm' });

    const seen = new Set();
    const sources = list.filter((s) => (seen.has(s.url) ? false : seen.add(s.url)));
    SH.plog(log, 'video files found: ' + sources.length);
    return { sources, reason: sources.length ? '' : wm && wm.error ? 'gone' : 'failed' };
  };
})();
