/* שמרתי links: finding the link in shared text, telling which app it's from, cleaning it,
   and fetching its picture, title and creator (TikTok / YouTube oEmbed, X, Open Graph for everything else). */
(function () {
  'use strict';
  const SH = window.SH;

  // ================= Sources =================
  SH.SOURCES = [
    { id: 'tiktok', name: 'TikTok', color: 'ink', letter: 'T', video: true, domains: ['tiktok.com'] },
    { id: 'instagram', name: 'Instagram', color: 'pink', letter: 'I', video: true, domains: ['instagram.com', 'instagr.am', 'threads.net', 'threads.com'] },
    { id: 'youtube', name: 'YouTube', color: 'red', letter: 'Y', video: true, domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
    { id: 'facebook', name: 'Facebook', color: 'blue', letter: 'F', video: true, domains: ['facebook.com', 'fb.watch', 'fb.com', 'fb.me'] },
    { id: 'x', name: 'X', color: 'gray', letter: 'X', domains: ['x.com', 'twitter.com', 't.co'] },
    { id: 'pinterest', name: 'Pinterest', color: 'purple', letter: 'P', domains: ['pinterest.com', 'pin.it', 'pinterest.co.il'] },
    { id: 'telegram', name: 'Telegram', color: 'teal', letter: 'T', domains: ['t.me', 'telegram.me'] },
    { id: 'web', name: 'אתרים', label: 'אתר', color: 'gray', icon: 'globe', domains: [] }
  ];
  SH.allSources = () => SH.SOURCES.filter((s) => s.id !== 'web').concat((SH.state && SH.state.sources) || [], SH.SOURCES.filter((s) => s.id === 'web'));
  SH.sourceById = (id) => SH.allSources().find((s) => s.id === id) || SH.SOURCES.find((s) => s.id === 'web');
  SH.sourceLabel = (s) => (s ? s.label || s.name : 'אתר');

  // ================= URLs =================
  const URL_RE = /https?:\/\/[^\s<>"'“”‘’]+/i;
  const BARE_RE = /(?:^|\s)((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/[^\s<>"'“”]*)?)/i;
  SH.findUrl = (text) => {
    const s = String(text || '');
    let m = s.match(URL_RE);
    let u = m ? m[0] : '';
    if (!u) { const b = s.match(BARE_RE); if (b && /[./]/.test(b[1]) && !/@/.test(b[1])) u = 'https://' + b[1]; }
    if (!u) return '';
    u = u.replace(/[).,!?;:'"״׳\]}>]+$/, '');
    try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:' ? x.toString() : ''; } catch (e) { return ''; }
  };
  SH.hostOf = (url) => { try { return new URL(url).hostname.replace(/^(www|m|mobile|vm|vt)\./, '').toLowerCase(); } catch (e) { return ''; } };
  const hostMatch = (host, d) => host === d || host.endsWith('.' + d);
  SH.detectSource = (url) => {
    let host = '';
    try { host = new URL(url).hostname.toLowerCase(); } catch (e) { return 'web'; }
    const custom = (SH.state && SH.state.sources) || [];
    for (const s of custom) if ((s.domains || []).some((d) => hostMatch(host, d))) return s.id;
    for (const s of SH.SOURCES) if (s.domains.some((d) => hostMatch(host, d))) return s.id;
    return 'web';
  };

  const DROP_ANY = /^(utm_\w+|fbclid|gclid|dclid|msclkid|igshid|mibextid)$/i;
  const DROP_SOCIAL = /^(igsh|_t|_r|is_from_webapp|sender_device|sender_web_id|share_app_id|share_item_id|share_link_id|social_sharing|is_copy_url|ug_btm|ugbiz_name|tt_from|u_code|user_id|sec_user_id|checksum|timestamp|refer|share_id|rdid|s|xmt|wtsid|ref_src|ref_url|si|feature|pp|rcm|sh)$/i;
  // Removes tracking parameters added by the share buttons (keeps what the page needs, like ?v= or &t=).
  SH.cleanUrl = (url) => {
    try {
      const x = new URL(url);
      const host = x.hostname.toLowerCase();
      const social = SH.SOURCES.some((s) => s.domains.some((d) => hostMatch(host, d)));
      [...x.searchParams.keys()].forEach((k) => {
        if (DROP_ANY.test(k) || (social && DROP_SOCIAL.test(k))) x.searchParams.delete(k);
      });
      if (social) x.hash = '';
      let s = x.toString();
      if (s.endsWith('?')) s = s.slice(0, -1);
      return s;
    } catch (e) { return url; }
  };
  SH.youtubeId = (url) => {
    try {
      const x = new URL(url);
      const h = x.hostname.replace(/^(www|m|music)\./, '');
      if (h === 'youtu.be') return x.pathname.slice(1).split('/')[0] || '';
      if (/youtube(-nocookie)?\.com$/.test(h)) {
        if (x.searchParams.get('v')) return x.searchParams.get('v');
        const m = x.pathname.match(/^\/(shorts|live|embed|v)\/([\w-]{6,})/);
        if (m) return m[2];
      }
    } catch (e) { /* not a url */ }
    return '';
  };
  // A key for spotting the same thing saved twice, whatever link variant was used.
  SH.urlKey = (url) => {
    const yt = SH.youtubeId(url);
    if (yt) return 'yt:' + yt;
    try {
      const x = new URL(SH.cleanUrl(url));
      const host = x.hostname.replace(/^(www|m|mobile)\./, '').toLowerCase();
      let m = x.pathname.match(/\/video\/(\d+)/);
      if (/tiktok\.com$/.test(host) && m) return 'tt:' + m[1];
      m = x.pathname.match(/^\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([\w-]+)/);
      if (/instagram\.com$/.test(host) && m) return 'ig:' + m[1];
      m = x.pathname.match(/\/status(?:es)?\/(\d+)/);
      if (/(^|\.)(x|twitter)\.com$/.test(host) && m) return 'x:' + m[1];
      const params = [...x.searchParams.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((p) => p.join('=')).join('&');
      return host + x.pathname.replace(/\/+$/, '') + (params ? '?' + params : '');
    } catch (e) { return String(url || '').toLowerCase(); }
  };
  SH.isTall = (item) => {
    const u = String(item.url || '');
    if (item.src === 'tiktok') return true;
    if (item.src === 'instagram' && /\/(reel|reels|tv)\//.test(u)) return true;
    if (item.src === 'youtube' && /\/shorts\//.test(u)) return true;
    if (item.src === 'facebook' && /\/(reel|reels)\//.test(u)) return true;
    return false;
  };

  // ================= Preview =================
  const UA_MOBILE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
  const UA_BOT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
  const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const abs = (u, base) => { try { return u ? new URL(u, base).toString() : ''; } catch (e) { return ''; } };

  async function getHtml(url, ua) {
    const r = await SH.http(url, { as: 'text', timeout: 15000, headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8' } });
    if (!r.ok || typeof r.data !== 'string') throw new Error('http ' + r.status);
    return { html: r.data.slice(0, 1500000), url: r.url || url };
  }
  function parseOg(html, base) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const meta = (...names) => {
      for (const n of names) {
        const el = doc.querySelector('meta[property="' + n + '"]') || doc.querySelector('meta[name="' + n + '"]');
        const v = el && (el.getAttribute('content') || '').trim();
        if (v) return v;
      }
      return '';
    };
    const link = doc.querySelector('link[rel="image_src"]');
    const canon = doc.querySelector('link[rel="canonical"]');
    return {
      title: meta('og:title', 'twitter:title') || ((doc.querySelector('title') || {}).textContent || '').trim(),
      desc: meta('og:description', 'twitter:description', 'description'),
      image: abs(meta('og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src') || (link && link.getAttribute('href')), base),
      site: meta('og:site_name'),
      author: meta('author', 'article:author', 'twitter:creator'),
      canonical: abs(meta('og:url') || (canon && canon.getAttribute('href')), base)
    };
  }

  async function tiktok(url) {
    let final = url;
    let og = null;
    if (/^(vm|vt)\./.test(new URL(url).hostname) || /^\/t\//.test(new URL(url).pathname)) {
      try {
        const page = await getHtml(url, UA_MOBILE);
        final = page.url;
        og = parseOg(page.html, page.url);
        if (!/\/(video|photo)\//.test(final) && og.canonical) final = og.canonical;
      } catch (e) { console.warn('tiktok resolve', e && e.message); }
    }
    try {
      const r = await SH.http('https://www.tiktok.com/oembed?url=' + encodeURIComponent(final), { timeout: 15000 });
      const d = r.data;
      if (r.ok && d && typeof d === 'object' && (d.thumbnail_url || d.title)) {
        const handle = String(d.author_url || '').match(/@[\w.]+/);
        return { url: final, title: clip(d.title, 300), author: handle ? handle[0] : clip(d.author_name, 80), image: d.thumbnail_url || '', site: 'TikTok' };
      }
    } catch (e) { console.warn('tiktok oembed', e && e.message); }
    if (!og) { const page = await getHtml(final, UA_BOT); og = parseOg(page.html, page.url); }
    return { url: final, title: clip(og.desc || og.title, 300), author: '', image: og.image, site: 'TikTok' };
  }

  async function youtube(url) {
    const id = SH.youtubeId(url);
    const short = /\/shorts\//.test(url);
    const out = { url, title: '', author: '', image: '', site: 'YouTube', images: [] };
    if (id) out.images = short ? ['https://i.ytimg.com/vi/' + id + '/oardefault.jpg', 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'] : ['https://i.ytimg.com/vi/' + id + '/hq720.jpg', 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'];
    try {
      const watch = id ? 'https://www.youtube.com/watch?v=' + id : url;
      const r = await SH.http('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(watch), { timeout: 12000 });
      if (r.ok && r.data && typeof r.data === 'object') {
        out.title = clip(r.data.title, 300);
        out.author = clip(r.data.author_name, 80);
        if (r.data.thumbnail_url) out.images.push(r.data.thumbnail_url);
      }
    } catch (e) { console.warn('youtube oembed', e && e.message); }
    if (!out.title && !id) {
      const page = await getHtml(url, UA_MOBILE);
      const og = parseOg(page.html, page.url);
      out.title = clip(og.title, 300); if (og.image) out.images.push(og.image);
    }
    out.image = out.images[0] || '';
    return out;
  }

  async function twitter(url) {
    const m = url.match(/(?:x|twitter)\.com\/([^/]+)\/status(?:es)?\/(\d+)/);
    if (m) {
      try {
        const r = await SH.http('https://api.fxtwitter.com/' + m[1] + '/status/' + m[2], { timeout: 12000 });
        const t = r.data && r.data.tweet;
        if (r.ok && t) {
          const media = t.media || {};
          const img = (media.photos && media.photos[0] && media.photos[0].url) || (media.videos && media.videos[0] && media.videos[0].thumbnail_url) || (t.author && t.author.avatar_url) || '';
          return { url, title: clip(t.text, 300), author: t.author ? '@' + t.author.screen_name : '', image: img, site: 'X' };
        }
      } catch (e) { console.warn('fxtwitter', e && e.message); }
    }
    return generic(url, 'x');
  }

  async function generic(url, src) {
    const order = ['instagram', 'facebook', 'x'].includes(src) ? [UA_BOT, UA_MOBILE] : [UA_MOBILE, UA_BOT];
    let og = null, final = url, lastErr = null;
    for (const ua of order) {
      try {
        const page = await getHtml(url, ua);
        final = page.url;
        og = parseOg(page.html, page.url);
        if (og.image || (og.title && !/^(instagram|facebook|log in|login|התחברות)/i.test(og.title))) break;
      } catch (e) { lastErr = e; }
    }
    if (!og) throw lastErr || new Error('no page');
    let title = og.title, author = og.author;
    if (src === 'instagram') {
      // "Name on Instagram: "caption"" / "@user • Instagram reel"
      const im = String(og.title || '').match(/^(.*?)\s+on Instagram:\s*["“]?([\s\S]*?)["”]?$/i);
      if (im) { author = im[1]; title = im[2]; }
      if (!im && og.desc) { const dm = og.desc.match(/-\s*([\w.]+)\s+on\s+[^:]+:\s*["“]?([\s\S]*?)["”]?\.?$/i); if (dm) { author = '@' + dm[1]; title = dm[2]; } }
    }
    if (!title || /^(instagram|facebook)$/i.test(title)) title = og.desc || title;
    if (og.site && title) {
      const esc = og.site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      title = title.replace(new RegExp('\\s*[|•–—:-]\\s*' + esc + '\\s*$'), '').replace(new RegExp('^' + esc + '\\s*[|•–—:-]\\s*'), '') || title;
    }
    return { url: final, title: clip(title, 300), author: clip(author, 80), image: og.image, site: clip(og.site, 60) };
  }

  // Fetches title, creator and picture for a link. Throws when nothing could be read.
  SH.fetchPreview = async (url, src) => {
    if (!SH.online()) throw new Error('offline');
    let p;
    if (src === 'tiktok') p = await tiktok(url);
    else if (src === 'youtube') p = await youtube(url);
    else if (src === 'x') p = await twitter(url);
    else p = await generic(url, src);
    p.title = (p.title || '').replace(/\s*[|•–-]\s*(TikTok|Instagram|YouTube|Facebook)\s*$/i, '');
    return p;
  };

  // Downloads a picture and shrinks it. Returns { data (base64 JPEG), w, h } or null.
  SH.fetchImage = async (urls) => {
    for (const u of [].concat(urls || []).filter(Boolean)) {
      try {
        const r = await SH.http(u, { as: 'base64', timeout: 20000, headers: { 'User-Agent': UA_MOBILE, Accept: 'image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8' } });
        if (!r.ok || !r.data) continue;
        const mime = SH.imageMime(r.data) || (/^image\//.test(r.type) ? r.type.split(';')[0] : '');
        if (!mime) continue;
        const img = await SH.resizeImage('data:' + mime + ';base64,' + r.data, 720, 0.82);
        if (img.w < 40 || img.h < 40) continue;
        // YouTube serves a tiny grey placeholder (120x90) when a size does not exist
        if (/ytimg\.com/.test(u) && img.w <= 120) continue;
        return img;
      } catch (e) { console.warn('image', u.slice(0, 80), e && e.message); }
    }
    return null;
  };
})();
