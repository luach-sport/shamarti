/* Reading web pages: download the HTML as a chosen visitor (browser, WhatsApp, Facebook)
   and read its preview tags (og:title, og:image…), the same tags WhatsApp uses for its link previews. */
(function () {
  'use strict';
  const SH = window.SH;

  // A short technical log of what was tried, so a failed preview can be reported and fixed.
  SH.plog = (log, msg) => { if (Array.isArray(log) && log.length < 50) log.push(String(msg).slice(0, 240)); };
  SH.absUrl = (u, base) => { try { return u ? new URL(String(u).replace(/&amp;/g, '&'), base).toString() : ''; } catch (e) { return ''; } };
  const uaName = (ua) => Object.keys(SH.UA).find((k) => SH.UA[k] === ua) || 'browser';

  SH.getHtml = async (url, ua, log) => {
    const r = await SH.http(url, {
      as: 'text', timeout: 15000,
      headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8' }
    });
    const size = typeof r.data === 'string' ? Math.round(r.data.length / 1024) + 'KB' : typeof r.data;
    SH.plog(log, 'page as ' + uaName(ua) + ': ' + r.status + ', ' + size + (r.url && r.url !== url ? ' → ' + r.url.slice(0, 120) : ''));
    if (!r.ok || typeof r.data !== 'string') throw new Error('http ' + r.status);
    return { html: r.data.slice(0, 3000000), url: r.url || url, headers: r.headers || {} };
  };

  SH.parseOg = (html, base) => {
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
      image: SH.absUrl(meta('og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src') || (link && link.getAttribute('href')), base),
      site: meta('og:site_name'),
      author: meta('author', 'article:author', 'twitter:creator'),
      canonical: SH.absUrl(meta('og:url') || (canon && canon.getAttribute('href')), base)
    };
  };

  // Tries visitors in turn; returns the first page tags that have a picture, else the best ones seen (or null).
  SH.crawl = async (url, uas, log) => {
    let best = null;
    for (const ua of uas) {
      try {
        const page = await SH.getHtml(url, ua, log);
        const og = SH.parseOg(page.html, page.url);
        og.url = page.url;
        SH.plog(log, '  tags: ' + (og.image ? 'picture' : 'no picture') + ', ' + (og.title ? 'title' : 'no title'));
        if (og.image) return og;
        if (!best && (og.title || og.desc)) best = og;
      } catch (e) { /* try the next visitor */ }
    }
    return best;
  };
})();
