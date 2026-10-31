/* Links: find a link inside shared text, clean tracking parts, and a key to spot the same thing saved twice. */
(function () {
  'use strict';
  const SH = window.SH;

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

  const DROP_ANY = /^(utm_\w+|fbclid|gclid|dclid|msclkid|igshid|mibextid)$/i;
  const DROP_SOCIAL = /^(igsh|_t|_r|is_from_webapp|sender_device|sender_web_id|share_app_id|share_item_id|share_link_id|social_sharing|is_copy_url|ug_btm|ugbiz_name|tt_from|u_code|user_id|sec_user_id|checksum|timestamp|refer|share_id|rdid|s|xmt|wtsid|ref_src|ref_url|si|feature|pp|rcm|sh)$/i;
  // Removes tracking parameters added by the share buttons (keeps what the page needs, like ?v= or &t=).
  SH.cleanUrl = (url) => {
    try {
      const x = new URL(url);
      const host = x.hostname.toLowerCase();
      const social = SH.SOURCES.some((s) => s.domains.some((d) => SH.hostMatch(host, d)));
      [...x.searchParams.keys()].forEach((k) => {
        if (DROP_ANY.test(k) || (social && DROP_SOCIAL.test(k))) x.searchParams.delete(k);
      });
      if (social) x.hash = '';
      let s = x.toString();
      if (s.endsWith('?')) s = s.slice(0, -1);
      return s;
    } catch (e) { return url; }
  };
  // Short share links (vm.tiktok.com/…, tiktok.com/t/…) that only redirect to the real address.
  SH.isShortLink = (url) => { try { const x = new URL(url); return /^(vm|vt)\.tiktok\.com$/.test(x.hostname) || (/tiktok\.com$/.test(x.hostname) && /^\/t\//.test(x.pathname)); } catch (e) { return false; } };
  // Once the full address is known, the saved item keeps it (stable, and works without the redirect).
  SH.upgradeShortLink = (it, full) => {
    if (!it || !full || !SH.isShortLink(it.url) || SH.isShortLink(full) || !SH.findUrl(full)) return false;
    it.url = SH.cleanUrl(full);
    it.key = SH.urlKey(it.url);
    return true;
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
})();
