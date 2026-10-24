/* שמרתי core: helpers, icons, native bridge, storage, images, clipboard, files. */
(function () {
  'use strict';
  const SH = (window.SH = window.SH || {});
  const VER = window.SHAMARTI_VERSION || { version: '1.0', build: 'dev' };
  SH.VERSION = VER;
  SH.APP_ID = 'com.luachsport.shamarti';
  SH.REPO = 'luach-sport/shamarti';
  // Feedback goes to the developer's own Google Apps Script (shared with MyCar), which e-mails only the
  // developer and says which app the message came from. No e-mail address ships in the app.
  SH.FEEDBACK_URL = 'https://script.google.com/macros/s/AKfycbwuxeoRQSIFoCfTrJqJ_QUeF1JANm0H4PY5Mc00Ns8hBm9K8lvJ2S5hBYQOVtA3lZX1lw/exec';
  SH.FEEDBACK_KEY = 'mc_9-ATPT_LPmYj188PGtCksaLh';
  SH.FEEDBACK_APP = 'shamarti';

  // ================= Helpers =================
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  SH.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  SH.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  SH.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  SH.debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); }; };
  SH.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  SH.isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  SH.fmt = (n) => new Intl.NumberFormat('he-IL').format(n);

  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const p2 = (n) => String(n).padStart(2, '0');
  SH.dayStart = (d) => { d = new Date(d); d.setHours(0, 0, 0, 0); return d.getTime(); };
  SH.dateShort = (ts) => { const d = new Date(ts); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2); };
  SH.dateFull = (ts) => { const d = new Date(ts); return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(); };
  SH.dateInput = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  SH.time = (ts) => { const d = new Date(ts); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  SH.dateLong = (ts) => { const d = new Date(ts); return (d.getDay() === 6 ? 'שבת' : 'יום ' + DAYS[d.getDay()]) + ', ' + d.getDate() + ' ב' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  SH.dayLabel = (ts) => {
    const t = SH.dayStart(ts), today = SH.dayStart(Date.now());
    if (t === today) return 'היום';
    if (t === today - 864e5) return 'אתמול';
    const d = new Date(ts);
    return d.getDate() + ' ב' + MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
  };
  // "ב-4 בספטמבר" / "היום" / "אתמול" (prep is 'ב' or 'מ')
  SH.whenWith = (prep, ts) => {
    const l = SH.dayLabel(ts);
    if (l === 'היום' || l === 'אתמול') return prep === 'מ' ? 'מ' + l : l;
    return prep + '-' + l;
  };
  SH.plural = (n, one, many) => (n === 1 ? one : SH.fmt(n) + ' ' + many);

  // Hebrew-aware search text: lower case, no nikud or punctuation, final letters folded, spaces kept.
  const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  SH.norm = (s) => String(s || '')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[^a-z0-9א-ת]+/g, ' ')
    .replace(/יי+/g, 'י')
    .replace(/וו+/g, 'ו')
    .trim();
  // Highlights the words of a query inside plain text (returns safe HTML).
  SH.highlight = (text, q) => {
    const words = String(q || '').trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const t = String(text || '');
    if (!words.length) return SH.esc(t);
    const re = new RegExp('(' + words.join('|') + ')', 'gi');
    return t.split(re).map((part, i) => (i % 2 ? '<mark>' + SH.esc(part) + '</mark>' : SH.esc(part))).join('');
  };

  // ================= Icons =================
  const P = {
    play: '<path d="M7 4.5v15l12.5-7.5Z"/>',
    pot: '<path d="M4 11h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z"/><path d="M2 11h20M9 7c0-1 1-1.5 1-2.5M14 7c0-1 1-1.5 1-2.5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z"/><path d="M20 17v4H6.5A2.5 2.5 0 0 1 4 18.5"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>',
    dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
    mountain: '<path d="M3 20l6-10 4 6 3-4 5 8Z"/><circle cx="17" cy="6" r="2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
    baby: '<circle cx="12" cy="8" r="5"/><path d="M10 8h.01M14 8h.01M10.5 10.5a2 2 0 0 0 3 0"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    car: '<path d="M19 17h2v-4l-2.5-5.5A2 2 0 0 0 16.7 6H7.3a2 2 0 0 0-1.8 1.5L3 13v4h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4Z"/>',
    laugh: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4.5 4.5 0 0 0 8 0Z"/><path d="M9 9h.01M15 9h.01"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    back: '<path d="m9 18 6-6-6-6"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    move: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M10 13h6M13 10l3 3-3 3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8M8 13h5"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    sparkle: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1.5"/>',
    sort: '<path d="M3 6h13M3 12h9M3 18h5"/><path d="M18 9V21M15 18l3 3 3-3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
    offline: '<path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 4.2-2.6"/><path d="M19 12.9a10 10 0 0 0-2.4-1.7"/><path d="M12 20h.01"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>'
  };
  SH.ICONS = P;
  SH.icon = (name, cls) => '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || P.folder) + '</svg>';
  SH.logo = (size) => '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" rx="30" fill="#D9381E"/><path d="M42 26h36a5 5 0 0 1 5 5v65l-23-16-23 16V31a5 5 0 0 1 5-5z" fill="#FFFFFF"/><path d="M53 41v22l18-11z" fill="#D9381E"/></svg>';

  // Colour palette for categories and sources (light and dark variants).
  SH.PALETTE = {
    red: { c: '#D9381E', soft: '#FDECE8', ink: '#A82A15', dsoft: '#3A211B', dink: '#FF9D85' },
    amber: { c: '#D99A0E', soft: '#FFF3D6', ink: '#7A5000', dsoft: '#3A2E12', dink: '#F5C451' },
    purple: { c: '#6B45D1', soft: '#EEE6FF', ink: '#5B33B8', dsoft: '#2A2140', dink: '#B9A2FF' },
    teal: { c: '#14907F', soft: '#DDF3EF', ink: '#0F6E66', dsoft: '#14302C', dink: '#6FD6C6' },
    pink: { c: '#C23A6E', soft: '#FFE4EE', ink: '#A31D52', dsoft: '#3A1A27', dink: '#FF8FB8' },
    blue: { c: '#2F5BD3', soft: '#E2ECFF', ink: '#2448B8', dsoft: '#1A2540', dink: '#8FB0FF' },
    green: { c: '#2E8B3E', soft: '#E3F4E5', ink: '#1F6B2C', dsoft: '#18301B', dink: '#86D694' },
    gray: { c: '#596070', soft: '#E9EBEF', ink: '#3F4552', dsoft: '#262A31', dink: '#C3C8D2' },
    ink: { c: '#16181D', soft: '#E9EBEF', ink: '#16181D', dsoft: '#262A31', dink: '#F1F2F4' }
  };
  SH.colorVars = (id) => {
    const p = SH.PALETTE[id] || SH.PALETTE.gray;
    return '--c:' + p.c + ';--soft:' + p.soft + ';--cink:' + p.ink + ';--dsoft:' + p.dsoft + ';--dink:' + p.dink;
  };

  // ================= Native bridge =================
  SH.capacitor = () => { const rt = window.ShamartiCap; return (rt && rt.Capacitor) || window.Capacitor || null; };
  SH.isNative = () => {
    const C = SH.capacitor();
    if (!C) return false;
    try { return typeof C.isNativePlatform === 'function' ? !!C.isNativePlatform() : C.platform === 'android'; } catch (e) { return false; }
  };
  const pluginCache = {};
  SH.plugin = (name) => {
    if (!SH.isNative()) return null;
    if (Object.prototype.hasOwnProperty.call(pluginCache, name)) return pluginCache[name];
    let p = null;
    try {
      const rt = window.ShamartiCap;
      if (rt && typeof rt.registerPlugin === 'function') p = rt.registerPlugin(name);
      else if (window.Capacitor && window.Capacitor.Plugins) p = window.Capacitor.Plugins[name] || null;
    } catch (e) { p = null; }
    pluginCache[name] = p;
    return p;
  };
  SH.callRaw = async (name, method, args) => {
    const p = SH.plugin(name);
    if (!p || typeof p[method] !== 'function') throw new Error('no-plugin ' + name + '.' + method);
    return p[method](args);
  };
  SH.call = async (name, method, args) => {
    try { return await SH.callRaw(name, method, args); } catch (e) { console.warn('[native]', name, method, e && (e.message || e)); return undefined; }
  };
  SH.listen = async (name, event, cb) => {
    const p = SH.plugin(name);
    if (!p) return;
    try { await p.addListener(event, cb); } catch (e) { console.warn('[native] listen', name, event, e && e.message); }
  };

  // ================= HTTP =================
  // Native requests on Android (no CORS, follows redirects, custom User-Agent); fetch on the web.
  // opts.as: 'json' (default) | 'text' | 'base64'. Returns { status, ok, data, url (final, after redirects), type }.
  SH.http = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    const as = opts.as || 'json';
    const headers = Object.assign({}, opts.headers || {});
    if (as === 'json' && !headers.Accept) headers.Accept = 'application/json';
    const timeout = opts.timeout || 15000;
    const rt = window.ShamartiCap;
    if (SH.isNative() && rt && rt.CapacitorHttp) {
      if (opts.data != null) headers['Content-Type'] = 'application/json';
      const req = rt.CapacitorHttp.request({
        url, method, headers, data: opts.data, connectTimeout: timeout, readTimeout: timeout,
        responseType: as === 'base64' ? 'blob' : as === 'text' ? 'text' : 'json'
      });
      const res = await Promise.race([req, SH.sleep(timeout + 3000).then(() => { throw new Error('timeout'); })]);
      let data = res.data;
      if (typeof data === 'string' && as === 'json') { try { data = JSON.parse(data); } catch (e) { /* keep text */ } }
      const h = res.headers || {};
      const type = String(h['Content-Type'] || h['content-type'] || '');
      return { status: res.status, ok: res.status >= 200 && res.status < 300, data, url: res.url || url, type };
    }
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), timeout);
    try {
      const webHeaders = Object.assign({}, headers);
      delete webHeaders['User-Agent']; delete webHeaders.Referer;
      const init = { method, headers: webHeaders, signal: ctl ? ctl.signal : undefined };
      if (opts.data != null) { init.body = JSON.stringify(opts.data); init.headers['Content-Type'] = opts.plain ? 'text/plain;charset=utf-8' : 'application/json'; }
      const res = await fetch(url, init);
      let data;
      if (as === 'base64') data = await blobToBase64(await res.blob());
      else {
        const txt = await res.text();
        data = txt;
        if (as === 'json') { try { data = JSON.parse(txt); } catch (e) { /* text */ } }
      }
      return { status: res.status, ok: res.ok, data, url: res.url || url, type: res.headers.get('content-type') || '' };
    } finally { clearTimeout(t); }
  };
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ''));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  SH.blobToBase64 = blobToBase64;

  // ================= Network =================
  let online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const netListeners = [];
  SH.online = () => online;
  SH.onNetwork = (cb) => netListeners.push(cb);
  function setOnline(v) {
    v = !!v;
    if (v === online) return;
    online = v;
    netListeners.forEach((cb) => { try { cb(v); } catch (e) { console.warn(e); } });
  }
  SH.initNetwork = async () => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    if (SH.isNative()) {
      const st = await SH.call('Network', 'getStatus');
      if (st && typeof st.connected === 'boolean') online = st.connected;
      SH.listen('Network', 'networkStatusChange', (s) => setOnline(s && s.connected));
    }
  };

  // ================= Storage =================
  // The saved items live in a file in the app's private data folder. Two files are written in turns
  // (state-a / state-b) with a sequence number, so a crash mid-write never loses everything.
  const DIR = 'DATA';
  const BASE = 'shamarti';
  const LS_KEY = 'shamarti.state.v1';
  let seq = 0, slot = 'a';
  async function readFile(path) {
    try {
      const r = await SH.callRaw('Filesystem', 'readFile', { path: BASE + '/' + path, directory: DIR, encoding: 'utf8' });
      return r && typeof r.data === 'string' ? r.data : null;
    } catch (e) { return null; }
  }
  SH.loadState = async () => {
    if (SH.isNative()) {
      const docs = [];
      for (const s of ['a', 'b']) {
        const raw = await readFile('state-' + s + '.json');
        if (!raw) continue;
        try { const d = JSON.parse(raw); if (d && d.state) docs.push({ s, d }); } catch (e) { console.warn('state file', s, 'unreadable'); }
      }
      docs.sort((x, y) => (y.d.seq || 0) - (x.d.seq || 0));
      if (docs.length) {
        seq = docs[0].d.seq || 0;
        slot = docs[0].s === 'a' ? 'b' : 'a';
        return docs[0].d.state;
      }
      return null;
    }
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  };
  let saveTimer = null, writing = Promise.resolve();
  SH.saveState = (obj, now) => {
    const write = () => {
      saveTimer = null;
      const doc = { seq: ++seq, savedAt: Date.now(), app: SH.APP_ID, state: obj };
      const raw = JSON.stringify(doc);
      if (!SH.isNative()) { try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) { console.warn('save', e); } return writing; }
      const target = 'state-' + slot + '.json';
      slot = slot === 'a' ? 'b' : 'a';
      writing = writing.then(() => SH.callRaw('Filesystem', 'writeFile', { path: BASE + '/' + target, data: raw, directory: DIR, encoding: 'utf8', recursive: true }))
        .catch((e) => console.warn('save failed', e && e.message));
      return writing;
    };
    clearTimeout(saveTimer);
    if (now) return write();
    saveTimer = setTimeout(write, 300);
    return writing;
  };
  SH.flushSave = () => { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; return SH.saveState(SH.state, true); } return writing; };

  // ================= Thumbnails =================
  // Each item's picture is a JPEG in the app's data folder (thumbs/<id>-<n>.jpg). On the web: localStorage.
  let baseUri = '';
  SH.thumbs = {
    async init() {
      if (!SH.isNative()) return;
      try {
        await SH.callRaw('Filesystem', 'mkdir', { path: BASE + '/thumbs', directory: DIR, recursive: true }).catch(() => {});
        const r = await SH.callRaw('Filesystem', 'getUri', { path: BASE, directory: DIR });
        baseUri = (r && r.uri) || '';
      } catch (e) { console.warn('thumb dir', e && e.message); }
    },
    src(path) {
      if (!path) return '';
      if (SH.isNative()) {
        const C = SH.capacitor();
        if (!baseUri || !C || typeof C.convertFileSrc !== 'function') return '';
        return C.convertFileSrc(baseUri + '/' + path);
      }
      try { return localStorage.getItem('shamarti.thumb.' + path) || ''; } catch (e) { return ''; }
    },
    async save(id, base64) {
      const path = 'thumbs/' + id + '-' + Date.now().toString(36) + '.jpg';
      if (SH.isNative()) {
        await SH.callRaw('Filesystem', 'writeFile', { path: BASE + '/' + path, data: base64, directory: DIR, recursive: true });
        return path;
      }
      try { localStorage.setItem('shamarti.thumb.' + path, 'data:image/jpeg;base64,' + base64); } catch (e) { console.warn('thumb quota'); return ''; }
      return path;
    },
    async read(path) {
      if (!path) return '';
      if (SH.isNative()) {
        try { const r = await SH.callRaw('Filesystem', 'readFile', { path: BASE + '/' + path, directory: DIR }); return (r && r.data) || ''; } catch (e) { return ''; }
      }
      try { return (localStorage.getItem('shamarti.thumb.' + path) || '').replace(/^data:[^,]*,/, ''); } catch (e) { return ''; }
    },
    async remove(path) {
      if (!path) return;
      if (SH.isNative()) { try { await SH.callRaw('Filesystem', 'deleteFile', { path: BASE + '/' + path, directory: DIR }); } catch (e) { /* already gone */ } return; }
      try { localStorage.removeItem('shamarti.thumb.' + path); } catch (e) { /* ignore */ }
    }
  };

  // Shrinks a picture to at most `max` px on its long side and re-encodes it as JPEG (keeps backups small).
  SH.imageMime = (b64) => {
    const s = String(b64 || '').slice(0, 16);
    if (s.startsWith('/9j/')) return 'image/jpeg';
    if (s.startsWith('iVBOR')) return 'image/png';
    if (s.startsWith('UklGR')) return 'image/webp';
    if (s.startsWith('R0lGOD')) return 'image/gif';
    if (s.startsWith('AAAA')) return 'image/avif';
    return '';
  };
  SH.resizeImage = (src, max, quality) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w0 = img.naturalWidth, h0 = img.naturalHeight;
        if (!w0 || !h0) { reject(new Error('empty image')); return; }
        const k = Math.min(1, (max || 720) / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const data = cv.toDataURL('image/jpeg', quality || 0.82).replace(/^data:[^,]*,/, '');
        resolve({ data, w, h });
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = src;
  });

  // ================= Clipboard, links, sharing =================
  SH.readClipboard = async () => {
    if (SH.isNative()) {
      try { const r = await SH.callRaw('Clipboard', 'read'); return (r && typeof r.value === 'string') ? r.value : ''; } catch (e) { return ''; }
    }
    try { return navigator.clipboard && navigator.clipboard.readText ? await navigator.clipboard.readText() : ''; } catch (e) { return ''; }
  };
  SH.writeClipboard = async (text) => {
    if (SH.isNative()) { try { await SH.callRaw('Clipboard', 'write', { string: text }); return true; } catch (e) { return false; } }
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
  };
  // Opens a link in its own app when installed (TikTok, Instagram, YouTube), otherwise in the browser.
  SH.openExternal = async (url) => {
    if (SH.isNative()) {
      try { await SH.callRaw('AppLauncher', 'openUrl', { url }); return true; } catch (e) { console.warn('openUrl', e && e.message); }
    }
    try { window.open(url, '_blank', 'noopener'); return true; } catch (e) { return false; }
  };
  SH.shareText = async (text, title) => {
    if (SH.isNative()) { try { await SH.callRaw('Share', 'share', { text, title, dialogTitle: title || 'שיתוף' }); return true; } catch (e) { return false; } }
    if (navigator.share) { try { await navigator.share({ text, title }); return true; } catch (e) { return false; } }
    const ok = await SH.writeClipboard(text);
    if (ok && SH.toast) SH.toast('הועתק ללוח');
    return ok;
  };
  // Writes a file to the cache and opens the share menu (Drive, WhatsApp, e-mail…). On the web: download.
  SH.shareFile = async (name, content, mime, title) => {
    if (SH.isNative()) {
      const w = await SH.call('Filesystem', 'writeFile', { path: name, data: content, directory: 'CACHE', encoding: 'utf8' });
      if (w && w.uri) {
        try { await SH.callRaw('Share', 'share', { title, files: [w.uri], dialogTitle: title }); return true; } catch (e) {
          try { await SH.callRaw('Share', 'share', { title, url: w.uri, dialogTitle: title }); return true; } catch (e2) { /* cancelled */ }
        }
      }
      return false;
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  };
})();
