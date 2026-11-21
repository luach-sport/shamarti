/* Small helpers: escaping, ids, timing, numbers, file names. */
(function () {
  'use strict';
  const SH = window.SH;

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  SH.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  SH.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  SH.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  SH.debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); }; };
  SH.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  SH.isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  SH.fmt = (n) => new Intl.NumberFormat('he-IL').format(n);
  SH.isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  SH.str = (v, n) => String(v == null ? '' : v).slice(0, n);
  SH.clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  SH.plural = (n, one, many) => (n === 1 ? one : SH.fmt(n) + ' ' + many);
  SH.fileSize = (b) => {
    if (!(b > 0)) return '';
    const mb = b / 1048576;
    return mb >= 1 ? (mb >= 10 ? Math.round(mb) : mb.toFixed(1)) + ' מ״ב' : Math.max(1, Math.round(b / 1024)) + ' ק״ב';
  };
  // Text that is safe as a file name (keeps Hebrew).
  SH.safeName = (s, max) => SH.clip(String(s || '').replace(/[\\/:*?"<>|#%{}\u0000-\u001F]+/g, ' '), max || 40) || 'סרטון';
})();
