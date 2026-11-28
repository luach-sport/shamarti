/* TikTok links: short links (vm.tiktok.com) to full addresses, and the title, creator and cover picture.
   Order: TikTok's own oEmbed → TikWM (public TikTok API) → the page tags WhatsApp reads. */
(function () {
  'use strict';
  const SH = window.SH;
  const T = (SH.tiktok = {});
  const TIKWM = 'https://www.tikwm.com';

  T.idOf = (url) => { const m = String(url || '').match(/\/(?:video|photo|v)\/(\d{8,})/); return m ? m[1] : ''; };
  T.userOf = (url) => { const m = String(url || '').match(/tiktok\.com\/@([\w.-]+)/); return m ? m[1] : ''; };
  T.isShort = (url) => { try { const x = new URL(url); return /^(vm|vt)\./.test(x.hostname) || /^\/t\//.test(x.pathname); } catch (e) { return false; } };
  T.canonical = (url) => {
    const id = T.idOf(url);
    if (!id) return url;
    return 'https://www.tiktok.com/@' + T.userOf(url) + '/' + (/\/photo\//.test(url) ? 'photo' : 'video') + '/' + id;
  };

  // Short links redirect to the full address. Ask as a crawler (like yt-dlp does) and read the redirect.
  T.resolve = async (url, log) => {
    if (!T.isShort(url)) return T.idOf(url) ? T.canonical(url) : url;
    try {
      let r = await SH.http(url, { as: 'text', noRedirect: true, timeout: 12000, headers: { 'User-Agent': SH.UA.facebook } });
      const loc = r.headers && r.headers.location;
      SH.plog(log, 'short link: ' + r.status + (loc ? ' → ' + loc.slice(0, 120) : ''));
      if (loc) {
        const u = SH.absUrl(loc, url);
        if (T.idOf(u)) return T.canonical(u);
      }
      r = await SH.http(url, { as: 'text', timeout: 15000, headers: { 'User-Agent': SH.UA.facebook } });
      SH.plog(log, 'short link (followed): ' + r.status + ' → ' + String(r.url).slice(0, 120));
      if (T.idOf(r.url)) return T.canonical(r.url);
      if (typeof r.data === 'string') {
        const og = SH.parseOg(r.data, r.url);
        if (T.idOf(og.canonical)) return T.canonical(og.canonical);
        const m = r.data.match(/\/(?:video|photo)\/(\d{15,})/);
        if (m) return 'https://www.tiktok.com/@/video/' + m[1];
      }
    } catch (e) { SH.plog(log, 'short link failed: ' + (e && e.message)); }
    return url;
  };

  T.oembed = async (url, log) => {
    try {
      const r = await SH.http('https://www.tiktok.com/oembed?url=' + encodeURIComponent(url), { timeout: 12000, headers: { 'User-Agent': SH.UA.desktop } });
      const d = r.data;
      SH.plog(log, 'oembed: ' + r.status + (SH.isObj(d) && d.thumbnail_url ? ', has picture' : ''));
      if (r.ok && SH.isObj(d) && (d.thumbnail_url || d.title)) {
        const handle = String(d.author_url || '').match(/@[\w.-]+/);
        return { title: SH.clip(d.title, 300), author: handle ? handle[0] : SH.clip(d.author_name, 80), images: d.thumbnail_url ? [d.thumbnail_url] : [] };
      }
    } catch (e) { SH.plog(log, 'oembed failed: ' + (e && e.message)); }
    return null;
  };

  // TikWM answers are kept for a few minutes (it allows about one request a second).
  const cache = {};
  const abs = (u) => (u ? (/^https?:/.test(u) ? u : TIKWM + (u[0] === '/' ? '' : '/') + u) : '');
  T.tikwm = async (url, log) => {
    const hit = cache[url];
    if (hit && Date.now() - hit.at < 5 * 60e3) return hit.data;
    try {
      const r = await SH.http(TIKWM + '/api/?hd=1&url=' + encodeURIComponent(url), { timeout: 20000, headers: { 'User-Agent': SH.UA.mobile } });
      const d = r.data;
      SH.plog(log, 'tikwm: ' + r.status + (SH.isObj(d) ? ', code ' + d.code + (d.code !== 0 && d.msg ? ' ' + String(d.msg).slice(0, 80) : '') : ''));
      if (!r.ok || !SH.isObj(d)) return null;
      const out = d.code === 0 && SH.isObj(d.data) ? d.data : { error: String(d.msg || 'error') };
      ['play', 'wmplay', 'hdplay', 'cover', 'origin_cover', 'ai_dynamic_cover'].forEach((k) => { if (out[k]) out[k] = abs(out[k]); });
      if (Array.isArray(out.images)) out.images = out.images.map(abs);
      cache[url] = { at: Date.now(), data: out };
      return out;
    } catch (e) { SH.plog(log, 'tikwm failed: ' + (e && e.message)); return null; }
  };

  T.preview = async (url, log) => {
    const full = await T.resolve(url, log);
    const out = { url: full, title: '', author: '', site: 'TikTok', images: [] };
    const o = (await T.oembed(full, log)) || (full !== url ? await T.oembed(url, log) : null);
    if (o) Object.assign(out, o);
    if (!out.images.length || !out.title) {
      const w = await T.tikwm(full, log);
      if (w && !w.error) {
        out.title = out.title || SH.clip(w.title, 300);
        if (!out.author && w.author && w.author.unique_id) out.author = '@' + w.author.unique_id;
        out.images.push(...[w.origin_cover, w.cover].filter(Boolean));
      }
    }
    if (!out.images.length) {
      const og = await SH.crawl(full, [SH.UA.whatsapp, SH.UA.facebook], log);
      if (og) { if (og.image) out.images.push(og.image); out.title = out.title || SH.clip(og.desc || og.title, 300); }
    }
    if (!out.title && !out.images.length) throw new Error('no preview');
    return out;
  };

  // More pictures to try when the first ones could not be downloaded or opened (for example HEIC covers).
  T.moreImages = async (url, log) => {
    const full = await T.resolve(url, log);
    const w = await T.tikwm(full, log);
    const list = w && !w.error ? [w.origin_cover, w.cover, w.ai_dynamic_cover] : [];
    const og = await SH.crawl(full, [SH.UA.whatsapp], log);
    if (og && og.image) list.push(og.image);
    return list.filter(Boolean);
  };
})();
