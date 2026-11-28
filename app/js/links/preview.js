/* A link's preview: title, creator and picture, from the module that knows that site.
   loadPreview() never fails: it returns what it found plus a short log of what it tried. */
(function () {
  'use strict';
  const SH = window.SH;

  const BY_SOURCE = {
    tiktok: (u, log) => SH.tiktok.preview(u, log),
    youtube: (u, log) => SH.youtubePreview(u, log),
    x: (u, log) => SH.twitterPreview(u, log),
    instagram: (u, log) => SH.instagram.preview(u, log)
  };
  const MORE_IMAGES = { tiktok: (u, log) => SH.tiktok.moreImages(u, log) };

  SH.fetchPreview = async (url, src, log) => {
    if (!SH.online()) throw new Error('offline');
    const fn = BY_SOURCE[src] || ((u, l) => SH.genericPreview(u, src, l));
    const p = await fn(url, log);
    p.images = (p.images || []).filter(Boolean);
    p.image = p.images[0] || '';
    p.title = (p.title || '').replace(/\s*[|•–-]\s*(TikTok|Instagram|YouTube|Facebook)\s*$/i, '');
    return p;
  };

  const hostOf = (u) => { try { return new URL(u).hostname; } catch (e) { return '?'; } };

  // Downloads the first picture that works and shrinks it. Returns { data (base64 JPEG), w, h } or null.
  SH.fetchImage = async (urls, log, tried) => {
    tried = tried || new Set();
    for (const u of [].concat(urls || []).filter(Boolean)) {
      if (tried.has(u)) continue;
      tried.add(u);
      try {
        const headers = { 'User-Agent': SH.UA.mobile, Accept: 'image/jpeg,image/png,image/webp;q=0.9,image/*;q=0.8,*/*;q=0.5' };
        if (/tiktokcdn|tiktok\.com/.test(hostOf(u))) headers.Referer = 'https://www.tiktok.com/';
        const r = await SH.http(u, { as: 'base64', timeout: 20000, headers });
        const mime = r.data ? SH.imageMime(r.data) || (/^image\//.test(r.type) ? r.type.split(';')[0] : '') : '';
        SH.plog(log, 'picture from ' + hostOf(u) + ': ' + r.status + ', ' + (mime || 'unknown type') + (r.data ? ', ' + Math.round(r.data.length * 0.75 / 1024) + 'KB' : ''));
        if (!r.ok || !r.data || !/^image\//.test(mime) || mime === 'image/heic') continue;
        const img = await SH.resizeImage('data:' + mime + ';base64,' + r.data, 720, 0.82);
        if (img.w < 40 || img.h < 40) continue;
        if (/ytimg\.com/.test(u) && img.w <= 120) continue; // YouTube's grey "no picture" placeholder
        return img;
      } catch (e) { SH.plog(log, 'picture failed (' + hostOf(u) + '): ' + (e && e.message)); }
    }
    return null;
  };

  SH.loadPreview = async (url, src) => {
    const log = [];
    let p = null, img = null;
    try { p = await SH.fetchPreview(url, src, log); } catch (e) { SH.plog(log, 'no preview: ' + (e && e.message)); }
    if (SH.state.settings.thumbs && SH.online()) {
      const tried = new Set();
      if (p) img = await SH.fetchImage(p.images, log, tried);
      if (!img && MORE_IMAGES[src]) {
        try { img = await SH.fetchImage(await MORE_IMAGES[src]((p && p.url) || url, log), log, tried); } catch (e) { /* nothing more */ }
      }
    }
    SH.plog(log, 'result: ' + (p && p.title ? 'title' : 'no title') + ', ' + (img ? 'picture ' + img.w + 'x' + img.h : 'no picture'));
    return { p, img, log };
  };
})();
