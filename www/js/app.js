/* שמרתי app: state, sheets, actions, events, share/clipboard handling and start-up. */
(function () {
  'use strict';
  const SH = window.SH;
  const V = SH.views;
  const { esc, icon } = SH;
  const $ = (sel, root) => (root || document).querySelector(sel);

  // ================= State =================
  const CAT_ICONS = ['play', 'pot', 'book', 'bulb', 'dumbbell', 'mountain', 'music', 'cart', 'heart', 'baby', 'car', 'tool', 'laugh', 'gift', 'globe', 'star', 'image', 'folder'];
  const COLORS = ['red', 'amber', 'purple', 'teal', 'pink', 'blue', 'green', 'gray'];
  function defaultCats() {
    return [
      { id: 'videos', name: 'סרטונים', color: 'red', icon: 'play' },
      { id: 'recipes', name: 'מתכונים', color: 'amber', icon: 'pot' },
      { id: 'lessons', name: 'שיעורים', color: 'purple', icon: 'book' },
      { id: 'tips', name: 'טיפים לבית', color: 'pink', icon: 'bulb' },
      { id: 'fitness', name: 'כושר', color: 'teal', icon: 'dumbbell' },
      { id: 'trips', name: 'טיולים', color: 'blue', icon: 'mountain' }
    ];
  }
  function defaults() {
    return {
      v: 1, createdAt: Date.now(),
      settings: { theme: 'system', clip: true, thumbs: true, defCat: 'last', backupRemind: true, lastBackup: 0, backupSnooze: 0 },
      cats: defaultCats(), sources: [], items: [],
      lastCat: '', clipSeen: '', lastShare: null,
      outbox: [], profile: { name: '', email: '' }, updateSeen: 0
    };
  }
  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  function normalize(raw) {
    const d = defaults();
    if (!isObj(raw)) return d;
    d.createdAt = +raw.createdAt || d.createdAt;
    if (isObj(raw.settings)) {
      const s = raw.settings;
      if (['light', 'dark', 'system'].includes(s.theme)) d.settings.theme = s.theme;
      d.settings.clip = s.clip !== false;
      d.settings.thumbs = s.thumbs !== false;
      d.settings.backupRemind = s.backupRemind !== false;
      if (typeof s.defCat === 'string') d.settings.defCat = s.defCat;
      d.settings.lastBackup = +s.lastBackup || 0;
      d.settings.backupSnooze = +s.backupSnooze || 0;
    }
    if (Array.isArray(raw.cats)) {
      d.cats = raw.cats.filter((c) => isObj(c) && c.id && c.name).map((c) => ({
        id: str(c.id, 40), name: str(c.name, 40), color: SH.PALETTE[c.color] ? c.color : 'gray', icon: SH.ICONS[c.icon] ? c.icon : 'folder'
      }));
    }
    if (Array.isArray(raw.sources)) {
      d.sources = raw.sources.filter((s) => isObj(s) && s.id && s.name).map((s) => ({
        id: str(s.id, 40), name: str(s.name, 30), color: SH.PALETTE[s.color] ? s.color : 'gray', letter: str(s.letter || s.name, 1).toUpperCase(),
        domains: Array.isArray(s.domains) ? s.domains.map((x) => str(x, 80).toLowerCase()).filter(Boolean).slice(0, 5) : [], custom: true
      }));
    }
    const catIds = new Set(d.cats.map((c) => c.id));
    const srcIds = new Set(SH.SOURCES.map((s) => s.id).concat(d.sources.map((s) => s.id)));
    if (Array.isArray(raw.items)) {
      d.items = raw.items.filter((it) => isObj(it) && it.url).map((it) => ({
        id: str(it.id || SH.uid(), 40), url: str(it.url, 2000), title: str(it.title, 400), note: str(it.note, 6000),
        author: str(it.author, 100), site: str(it.site, 80),
        tags: Array.isArray(it.tags) ? it.tags.map((t) => str(t, 40)).filter(Boolean).slice(0, 20) : [],
        cat: catIds.has(it.cat) ? it.cat : '', src: srcIds.has(it.src) ? it.src : 'web', fav: !!it.fav,
        ts: +it.ts || Date.now(), upd: +it.upd || +it.ts || Date.now(),
        thumb: typeof it.thumb === 'string' ? str(it.thumb, 200) : '', tw: +it.tw || 0, th: +it.th || 0,
        key: str(it.key || SH.urlKey(it.url), 600)
      }));
    }
    d.lastCat = catIds.has(raw.lastCat) ? raw.lastCat : '';
    d.clipSeen = str(raw.clipSeen, 2000);
    d.lastShare = isObj(raw.lastShare) ? { u: str(raw.lastShare.u, 3000), at: +raw.lastShare.at || 0 } : null;
    if (Array.isArray(raw.outbox)) d.outbox = raw.outbox.filter(isObj).slice(-30);
    if (isObj(raw.profile)) d.profile = { name: str(raw.profile.name, 60), email: str(raw.profile.email, 100) };
    d.updateSeen = +raw.updateSeen || 0;
    return d;
  }
  const save = (now) => SH.saveState(SH.state, now);
  SH.itemById = (id) => SH.state.items.find((it) => it.id === id) || null;
  SH.backupDue = () => {
    const s = SH.state.settings;
    if (!s.backupRemind || SH.state.items.length < 5) return false;
    const now = Date.now(), week = 7 * 864e5;
    if (s.backupSnooze > now) return false;
    return now - Math.max(s.lastBackup || 0, SH.state.createdAt || 0) > week;
  };

  const ui = (SH.ui = {
    tab: 'home', stack: [], homeCat: 'all', limit: 60, catsEdit: false, clip: null, scroll: {},
    search: { q: '', src: 'all', cat: 'all', date: 'all', sort: 'new', fav: false, limit: 80 },
    sheet: null, form: {}
  });
  const view = () => ui.stack[ui.stack.length - 1] || null;

  // ================= Theme =================
  function resolvedTheme() {
    const t = SH.state.settings.theme;
    if (t === 'system') return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return t;
  }
  function applyTheme() {
    const t = resolvedTheme();
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('shamarti.theme', SH.state.settings.theme); } catch (e) { /* ignore */ }
    const bg = t === 'dark' ? '#111317' : '#F5F6F8';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
    if (SH.isNative()) {
      SH.call('StatusBar', 'setBackgroundColor', { color: bg });
      SH.call('StatusBar', 'setStyle', { style: t === 'dark' ? 'DARK' : 'LIGHT' });
    }
  }

  // ================= Toast / haptics =================
  let toastTimer;
  function toast(msg, ms) {
    const root = $('#toast-root');
    root.innerHTML = '<div class="toast">' + esc(msg) + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { root.innerHTML = ''; }, ms || 2600);
  }
  SH.toast = toast;
  function haptic() { if (SH.isNative()) SH.call('Haptics', 'impact', { style: 'LIGHT' }); }

  // ================= Render =================
  const scrollKey = () => { const v = view(); return v ? v.name + (v.id || '') : 'tab-' + ui.tab; };
  function render(keepScroll) {
    const main = $('#screen');
    const v = view();
    const prevKey = main.dataset.key;
    if (prevKey) ui.scroll[prevKey] = window.scrollY;
    document.body.classList.toggle('no-tabs', !!v);
    main.classList.toggle('pushed', !!v);
    let html;
    if (v && v.name === 'item') html = V.item(SH.itemById(v.id));
    else if (v && v.name === 'search') html = V.search();
    else if (ui.tab === 'cats') html = V.cats();
    else if (ui.tab === 'favs') html = V.favs();
    else if (ui.tab === 'settings') html = V.settings();
    else html = V.home();
    main.innerHTML = html;
    const key = scrollKey();
    main.dataset.key = key;
    $('#fab-root').innerHTML = !v && (ui.tab === 'home' || ui.tab === 'favs') && SH.state.items.length ? V.fab() : '';
    document.querySelectorAll('#tabs button[data-tab]').forEach((b) => {
      if (b.getAttribute('data-tab') === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (keepScroll === true && prevKey === key) window.scrollTo(0, ui.scroll[key] || 0);
    else if (keepScroll === 'restore') window.scrollTo(0, ui.scroll[key] || 0);
    else window.scrollTo(0, 0);
  }
  SH.render = render;
  function rerenderAll() { if (ui.sheet) renderSheet(); render(true); }
  function pushView(v) { ui.scroll[scrollKey()] = window.scrollY; ui.stack.push(v); render(); }
  function popView() { ui.stack.pop(); render('restore'); }

  // ================= Sheets =================
  const SHEETS = {};
  function openSheet(name, data) {
    ui.sheet = { name, data: data || {} };
    if (SHEETS[name].init) SHEETS[name].init(ui.sheet.data);
    renderSheet();
    const first = $('#sheet-root [autofocus]');
    if (first) setTimeout(() => first.focus(), 80);
  }
  function closeSheet() {
    if (!ui.sheet) return;
    if (SHEETS[ui.sheet.name].onClose) SHEETS[ui.sheet.name].onClose();
    ui.sheet = null;
    $('#sheet-root').innerHTML = '';
  }
  function renderSheet() {
    const root = $('#sheet-root');
    if (!ui.sheet) { root.innerHTML = ''; return; }
    const def = SHEETS[ui.sheet.name];
    const body = def.render(ui.sheet.data);
    const prev = root.querySelector('.sheet');
    const st = prev ? prev.scrollTop : 0;
    const title = def.title(ui.sheet.data);
    root.innerHTML = '<div class="sheet-wrap"><div class="sheet-backdrop" data-action="close-sheet"></div>' +
      '<div class="sheet' + (def.full ? ' full' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<div class="grabber" aria-hidden="true"></div>' +
      '<div class="sheet-head"><button type="button" class="icon-btn" aria-label="סגירה" data-action="close-sheet">' + icon('close') + '</button><h2>' + esc(title) + '</h2></div>' +
      body + '</div></div>';
    if (prev) { const s = root.querySelector('.sheet'); if (s) { s.style.animation = 'none'; s.scrollTop = st; const b = root.querySelector('.sheet-backdrop'); if (b) b.style.animation = 'none'; } }
  }
  function part(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }

  // ---------- Save / edit ----------
  let pvSeq = 0;
  function startCat() {
    const d = SH.state.settings.defCat;
    if (d === 'last') return SH.catById(SH.state.lastCat) ? SH.state.lastCat : '';
    return SH.catById(d) ? d : '';
  }
  SHEETS.save = {
    full: true,
    title: () => (ui.form.editId ? 'עריכת שמירה' : 'שמירה חדשה'),
    init: (d) => {
      const it = d.editId ? SH.itemById(d.editId) : null;
      ui.form = it ? {
        editId: it.id, url: it.url, src: it.src, srcManual: true, title: it.title, author: it.author, site: it.site,
        note: it.note, cat: it.cat, tags: it.tags.slice(), fav: it.fav, tagInput: '', newCat: null,
        pv: { state: it.thumb ? 'ok' : 'idle' }, thumbPath: it.thumb, tw: it.tw, th: it.th, thumbData: '', fromShare: false
      } : {
        editId: '', url: d.url || '', src: d.url ? SH.detectSource(d.url) : 'web', srcManual: false, title: '', author: '', site: '',
        note: d.note || '', cat: startCat(), tags: [], fav: false, tagInput: '', newCat: null,
        pv: { state: 'idle' }, thumbPath: '', tw: 0, th: 0, thumbData: '', fromShare: !!d.fromShare
      };
      if (!it && ui.form.url) startPreview();
    },
    onClose: () => { pvSeq++; },
    render: () => {
      const f = ui.form;
      return '<div class="field"><label for="lnk">קישור</label><div class="input-row">' +
        '<input id="lnk" class="input ltr" style="text-align:left" type="url" inputmode="url" autocomplete="off" placeholder="https://" data-f="url" value="' + esc(f.url) + '"' + (f.url ? '' : ' autofocus') + '>' +
        '<button type="button" class="btn secondary small" data-action="paste-link">' + icon('clipboard', 'sm') + 'הדבקה</button></div>' +
        (f.err === 'url' ? '<span class="hint bad">צריך להדביק קישור</span>' : '') + '</div>' +
        '<div id="dup">' + dupNotice() + '</div>' +
        '<div id="pv">' + previewBox() + '</div>' +
        '<div class="field"><label for="note">התיאור שלי</label><textarea id="note" class="input" rows="3" data-f="note" placeholder="מה יש פה? למה שמרת? (למשל: פסטה בשמנת, לנסות בשבת)">' + esc(f.note) + '</textarea><span class="hint">החיפוש ימצא כל מילה שכתבת כאן</span></div>' +
        '<div class="field"><span class="label">קטגוריה</span><div class="chips" id="fcats">' + catChips() + '</div></div>' +
        '<div class="field"><label for="tagin">תגיות (לא חובה)</label><div class="chips" id="ftags">' + tagChips() + '</div></div>' +
        '<div class="card list"><div class="row"><span class="lead" style="color:var(--primary)">' + icon('star', f.fav ? 'fill' : '') + '</span><span class="grow"><span class="t">להוסיף למועדפים</span></span>' +
        '<button type="button" class="switch-hit" role="switch" aria-checked="' + !!f.fav + '" data-action="form-fav" aria-label="להוסיף למועדפים"><span class="switch"></span></button></div></div>' +
        (f.editId ? '' : '<div class="notice accent">' + icon('share', 'sm') + '<span class="grow">אפשר גם בלי להעתיק: בטיקטוק או באינסטגרם לוחצים <b>שיתוף ← שמרתי</b>, והמסך הזה נפתח לבד עם הקישור.</span></div>') +
        '<div class="sheet-foot"><button type="button" class="btn" data-action="save-item">' + icon('check') + (f.editId ? 'שמירת השינויים' : 'שמירה') + '</button></div>';
    }
  };
  function findDup() {
    const f = ui.form;
    const url = SH.findUrl(f.url);
    if (!url) return null;
    const keys = [SH.urlKey(url)];
    if (f.finalUrl) keys.push(SH.urlKey(f.finalUrl));
    return SH.state.items.find((it) => it.id !== f.editId && keys.includes(it.key)) || null;
  }
  function dupNotice() {
    const d = findDup();
    if (!d) return '';
    return '<div class="notice accent">' + icon('info', 'sm') + '<span class="grow">כבר שמרת את זה ' + esc(SH.whenWith('ב', d.ts)) + (d.cat && SH.catById(d.cat) ? ', בקטגוריה ' + esc(SH.catById(d.cat).name) : '') + '. אפשר לשמור שוב בכל זאת.' +
      '<br><button type="button" class="link" style="padding:0;margin-top:4px" data-action="open-dup" data-id="' + esc(d.id) + '">לפתוח את מה ששמרת ←</button></span></div>';
  }
  function previewBox() {
    const f = ui.form;
    const url = SH.findUrl(f.url);
    if (!url) return '<div class="notice gray">' + icon('link', 'sm') + '<span class="grow">מדביקים קישור מטיקטוק, אינסטגרם, יוטיוב, פייסבוק או מכל אתר. התמונה והכותרת יופיעו כאן לבד.</span></div>';
    const fake = { src: f.src, cat: f.cat, url, tw: f.tw, th: f.th, thumb: f.thumbData ? '' : f.thumbPath, fav: false };
    const ratio = SH.ratio(fake);
    let thumb = '<span class="thumb" style="aspect-ratio:1/' + Math.max(0.75, Math.min(ratio, 1.45)).toFixed(3) + ';' + SH.colorVars(SH.itemColor(fake)) + '">';
    const src = f.thumbData ? 'data:image/jpeg;base64,' + f.thumbData : SH.thumbs.src(f.thumbPath);
    thumb += src ? '<img src="' + esc(src) + '" alt="">' : '<span class="ph">' + icon(SH.itemGlyph(fake)) + '</span>';
    if (f.pv.state === 'loading') thumb += '<span class="spin" aria-hidden="true"></span>';
    thumb += '</span>';
    const opts = SH.allSources().map((s) => '<option value="' + esc(s.id) + '"' + (s.id === f.src ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
    const status = f.pv.state === 'loading' ? '<span class="status">מושך תמונה וכותרת…</span>'
      : f.pv.state === 'ok' ? '<span class="status ok">' + icon('check', 'xs') + (f.thumbManual ? 'צילום המסך שלך' : 'זוהה לבד') + '</span>'
      : f.pv.state === 'noimg' ? '<span class="status">נמצאה כותרת, בלי תמונה</span>'
      : f.pv.state === 'fail' ? '<span class="status">' + (SH.online() ? 'לא הצלחתי למשוך תמונה. אפשר לצרף צילום מסך' : 'אין אינטרנט כרגע. התמונה תימשך אחר כך') + '</span>' : '';
    let info = '<label class="src-select"><span class="sr-only">מקור</span><select data-f="src">' + opts + '</select>' + icon('chevD') + '</label>' + status;
    if (f.pv.state === 'loading' && !f.title) info += '<span class="skeleton" style="width:90%"></span><span class="skeleton" style="width:60%"></span>';
    if (f.title) info += '<span class="ttl">' + esc(f.title) + '</span>';
    if (f.author) info += '<span class="by ltr" style="text-align:right">' + esc(f.author) + '</span>';
    info += '<span class="acts"><button type="button" class="chip sm" data-action="pick-image">' + icon('camera', 'xs') + (src ? 'להחליף תמונה' : 'צילום מסך משלך') + '</button>' +
      (f.pv.state !== 'loading' && SH.online() && (f.editId || f.pv.state === 'fail' || f.pv.state === 'noimg') ? '<button type="button" class="chip sm" data-action="refetch">' + icon('refresh', 'xs') + 'למשוך שוב</button>' : '') + '</span>';
    return '<div class="card pv">' + thumb + '<div class="info">' + info + '</div></div>' +
      (SH.state.settings.thumbs ? '' : '<p class="fine">שמירת התמונות כבויה בהגדרות.</p>') +
      (src && SH.state.settings.thumbs ? '<p class="fine" style="display:flex;gap:6px;align-items:center">' + icon('image', 'xs') + 'התמונה נשמרת בטלפון, גם אם הסרטון יימחק</p>' : '');
  }
  function catChips() {
    const f = ui.form;
    let h = SH.state.cats.map((c) => '<button type="button" class="chip accent" data-action="form-cat" data-id="' + esc(c.id) + '" aria-pressed="' + (f.cat === c.id) + '" style="' + SH.colorVars(c.color) + '"><span class="dot"></span>' + esc(c.name) + '</button>').join('');
    if (f.newCat != null) {
      h += '<div class="input-row" style="width:100%"><input id="newcat" class="input" placeholder="שם הקטגוריה" maxlength="40" data-f="newCat" value="' + esc(f.newCat) + '" enterkeyhint="done">' +
        '<button type="button" class="btn small" data-action="add-cat-inline">הוספה</button></div>';
    } else {
      h += '<button type="button" class="chip dashed" data-action="new-cat-inline">' + icon('plus', 'sm') + 'קטגוריה חדשה</button>';
    }
    return h;
  }
  function tagChips() {
    const f = ui.form;
    return f.tags.map((t, i) => '<span class="tagchip">#' + esc(t) + '<button type="button" data-action="remove-tag" data-i="' + i + '" aria-label="הסרת התגית ' + esc(t) + '">' + icon('close', 'xs') + '</button></span>').join('') +
      '<input id="tagin" class="input" style="flex:1;min-width:140px;min-height:44px" placeholder="תגית ואז Enter" data-f="tagInput" value="' + esc(f.tagInput) + '" enterkeyhint="done" autocomplete="off">';
  }
  function refreshPreview() { if (ui.sheet && ui.sheet.name === 'save') { part('pv', previewBox()); part('dup', dupNotice()); } }
  function addTag(raw) {
    const f = ui.form;
    String(raw || '').split(/[,،\n]/).map((t) => t.replace(/^#+/, '').trim()).filter(Boolean).forEach((t) => {
      if (!f.tags.some((x) => x.toLowerCase() === t.toLowerCase()) && f.tags.length < 20) f.tags.push(t.slice(0, 40));
    });
    f.tagInput = '';
  }

  // Pulls title, creator and picture. Results go into the open form; if the item was already saved
  // (the user tapped "save" before it finished), they are written into that item instead.
  function startPreview() {
    const f = ui.form;
    const url = SH.findUrl(f.url);
    const seq = ++pvSeq;
    f.finalUrl = '';
    if (!url) { f.pv = { state: 'idle' }; refreshPreview(); return; }
    if (!f.srcManual) f.src = SH.detectSource(url);
    if (!SH.online()) { f.pv = { state: 'fail' }; refreshPreview(); return; }
    f.pv = { state: 'loading' };
    const src = f.src;
    const job = (async () => {
      const p = await SH.fetchPreview(url, src);
      const img = SH.state.settings.thumbs ? await SH.fetchImage(p.images && p.images.length ? p.images : p.image) : null;
      return { p, img };
    })();
    f.job = job;
    refreshPreview();
    job.then(({ p, img }) => {
      if (seq !== pvSeq || !ui.sheet || ui.sheet.name !== 'save') return;
      f.title = p.title || f.title; f.author = p.author || f.author; f.site = p.site || f.site;
      if (p.url && p.url !== url) f.finalUrl = p.url;
      if (img && !f.thumbManual) { f.thumbData = img.data; f.tw = img.w; f.th = img.h; }
      f.pv = { state: f.thumbData || f.thumbPath ? 'ok' : p.title ? 'noimg' : 'fail' };
      refreshPreview();
    }).catch((e) => {
      console.warn('preview', e && e.message);
      if (seq !== pvSeq || !ui.sheet || ui.sheet.name !== 'save') return;
      f.pv = { state: f.thumbData || f.thumbPath ? 'ok' : 'fail' };
      refreshPreview();
    });
  }
  const debouncedPreview = SH.debounce(() => { if (ui.sheet && ui.sheet.name === 'save') startPreview(); }, 700);

  async function lateApply(id, job) {
    try {
      const { p, img } = await job;
      const it = SH.itemById(id);
      if (!it) return;
      let changed = false;
      if (!it.title && p.title) { it.title = p.title; changed = true; }
      if (!it.author && p.author) { it.author = p.author; changed = true; }
      if (!it.site && p.site) { it.site = p.site; changed = true; }
      if (p.url && SH.findUrl(p.url) && SH.urlKey(p.url) !== it.key && /^(vm|vt)\.|\/t\//.test(new URL(it.url).hostname + new URL(it.url).pathname)) { it.url = SH.cleanUrl(p.url); it.key = SH.urlKey(it.url); changed = true; }
      if (!it.thumb && img) { it.thumb = await SH.thumbs.save(it.id, img.data); it.tw = img.w; it.th = img.h; changed = true; }
      if (changed) { it.upd = Date.now(); save(); if (!ui.sheet) render(true); }
    } catch (e) { console.warn('late preview', e && e.message); }
  }

  async function saveItem() {
    const f = ui.form;
    if (f.tagInput) addTag(f.tagInput);
    const raw = SH.findUrl(f.url);
    if (!raw) { f.err = 'url'; renderSheet(); const l = $('#lnk'); if (l) l.focus(); return; }
    const S = SH.state, now = Date.now();
    const old = f.editId ? SH.itemById(f.editId) : null;
    const id = old ? old.id : SH.uid();
    const finalUrl = f.finalUrl && !old ? f.finalUrl : raw;
    const url = SH.cleanUrl(finalUrl);
    const it = old || { id, ts: now, thumb: '', tw: 0, th: 0 };
    Object.assign(it, {
      url, key: SH.urlKey(url), title: f.title || '', author: f.author || '', site: f.site || '',
      note: String(f.note || '').trim(), tags: f.tags.slice(), cat: SH.catById(f.cat) ? f.cat : '', src: f.src || SH.detectSource(url),
      fav: !!f.fav, upd: now
    });
    if (f.thumbData && SH.state.settings.thumbs) {
      try {
        const path = await SH.thumbs.save(id, f.thumbData);
        if (path) { if (it.thumb && it.thumb !== path) SH.thumbs.remove(it.thumb); it.thumb = path; it.tw = f.tw; it.th = f.th; }
      } catch (e) { console.warn('thumb save', e && e.message); }
    }
    if (!old) S.items.unshift(it);
    if (it.cat) S.lastCat = it.cat;
    S.clipSeen = raw;
    if (ui.clip && SH.urlKey(ui.clip.url) === it.key) ui.clip = null;
    await save(true);
    const pending = f.pv.state === 'loading' && f.job;
    const fromShare = f.fromShare;
    pvSeq++;
    ui.sheet = null; $('#sheet-root').innerHTML = '';
    if (pending) lateApply(id, f.job);
    haptic();
    if (old) { toast('השינויים נשמרו'); render(true); return; }
    toast(fromShare ? 'נשמר בשמרתי ✓' : 'נשמר');
    if (!view()) { ui.tab = 'home'; if (ui.homeCat !== 'all' && ui.homeCat !== it.cat) ui.homeCat = 'all'; }
    render();
    if (fromShare && SH.isNative()) setTimeout(() => SH.call('App', 'minimizeApp'), 1100);
  }

  // ---------- Move / delete ----------
  SHEETS.move = {
    title: () => 'העברה לקטגוריה',
    render: (d) => {
      const it = SH.itemById(d.id);
      if (!it) return '';
      const row = (id, name, color, ic) => '<button type="button" class="row" data-action="do-move" data-id="' + esc(it.id) + '" data-cat="' + esc(id) + '" aria-pressed="' + (it.cat === id) + '"><span class="tile" style="' + SH.colorVars(color) + '">' + icon(ic) + '</span><span class="grow"><span class="t b">' + esc(name) + '</span></span>' + (it.cat === id ? '<span class="check">' + icon('check') + '</span>' : '') + '</button>';
      return '<div class="card list pick-list">' + SH.state.cats.map((c) => row(c.id, c.name, c.color, c.icon)).join('') + row('', 'בלי קטגוריה', 'gray', 'folder') + '</div>' +
        '<button type="button" class="dashed-btn" data-action="new-cat" data-for="' + esc(it.id) + '">' + icon('plus', 'sm') + 'קטגוריה חדשה</button>';
    }
  };
  SHEETS.deleteItem = {
    title: () => 'למחוק את השמירה?',
    render: (d) => {
      const it = SH.itemById(d.id);
      return '<p class="fine" style="font-size:14px">' + (it ? '״' + esc(SH.itemTitle(it)) + '״ תימחק מהאפליקציה, כולל התיאור והתמונה. הסרטון עצמו לא נמחק מ-' + esc(SH.sourceById(it.src).name === 'אתרים' ? 'האתר' : SH.sourceById(it.src).name) + '.' : '') + '</p>' +
        '<button type="button" class="btn danger" data-action="confirm-delete" data-id="' + esc(d.id) + '">' + icon('trash') + 'כן, למחוק</button>' +
        '<button type="button" class="btn secondary" data-action="close-sheet">ביטול</button>';
    }
  };

  // ---------- Category ----------
  SHEETS.cat = {
    title: (d) => (d.id ? 'עריכת קטגוריה' : 'קטגוריה חדשה'),
    init: (d) => {
      const c = d.id ? SH.catById(d.id) : null;
      const used = new Set(SH.state.cats.map((x) => x.color));
      ui.form = c ? { name: c.name, color: c.color, icon: c.icon, confirmDel: false } : { name: '', color: COLORS.find((x) => !used.has(x)) || 'gray', icon: 'folder', confirmDel: false };
    },
    render: (d) => {
      const f = ui.form;
      const n = d.id ? SH.state.items.filter((it) => it.cat === d.id).length : 0;
      let h = '<div class="field"><label for="cname">שם</label><input id="cname" class="input" maxlength="40" data-f="name" value="' + esc(f.name) + '" placeholder="למשל: מתכונים, שיעורים, לקנות"' + (d.id ? '' : ' autofocus') + '>' + (f.err ? '<span class="hint bad">' + esc(f.err) + '</span>' : '') + '</div>' +
        '<div class="field"><span class="label">צבע</span><div class="swatches">' + COLORS.map((c) => '<button type="button" class="swatch" style="' + SH.colorVars(c) + '" data-action="cat-color" data-v="' + c + '" aria-pressed="' + (f.color === c) + '" aria-label="צבע ' + c + '"></button>').join('') + '</div></div>' +
        '<div class="field"><span class="label">סמל</span><div class="icon-grid" style="' + SH.colorVars(f.color) + '">' + CAT_ICONS.map((ic) => '<button type="button" data-action="cat-icon" data-v="' + ic + '" aria-pressed="' + (f.icon === ic) + '" aria-label="סמל ' + ic + '">' + icon(ic) + '</button>').join('') + '</div></div>' +
        '<button type="button" class="btn" data-action="save-cat">' + icon('check') + (d.id ? 'שמירה' : 'הוספת הקטגוריה') + '</button>';
      if (d.id) {
        h += f.confirmDel
          ? '<div class="notice accent">' + icon('alert', 'sm') + '<span class="grow">' + (n === 1 ? 'השמירה שבה תישאר באפליקציה, בלי קטגוריה.' : n ? 'ה-' + SH.fmt(n) + ' שמירות שבה יישארו באפליקציה, בלי קטגוריה.' : 'הקטגוריה ריקה.') + '</span></div><button type="button" class="btn danger" data-action="delete-cat">' + icon('trash') + 'כן, למחוק את הקטגוריה</button>'
          : '<button type="button" class="btn ghost" style="color:var(--red-text)" data-action="ask-delete-cat">' + icon('trash') + 'מחיקת הקטגוריה</button>';
      }
      return h;
    }
  };

  // ---------- Source ----------
  SHEETS.source = {
    title: (d) => (d.id ? 'עריכת מקור' : 'מקור חדש'),
    init: (d) => {
      const s = d.id ? SH.state.sources.find((x) => x.id === d.id) : null;
      ui.form = s ? { name: s.name, domain: (s.domains || []).join(', '), color: s.color } : { name: '', domain: '', color: 'teal' };
    },
    render: (d) => {
      const f = ui.form;
      return '<p class="fine" style="font-size:14px">מקור הוא האפליקציה או האתר שממנו שמרת. כשתכתוב את הכתובת שלו, כל קישור משם יזוהה לבד.</p>' +
        '<div class="field"><label for="sname">שם</label><input id="sname" class="input" maxlength="30" data-f="name" value="' + esc(f.name) + '" placeholder="למשל: וואטסאפ, ynet, Spotify"' + (d.id ? '' : ' autofocus') + '>' + (f.err ? '<span class="hint bad">' + esc(f.err) + '</span>' : '') + '</div>' +
        '<div class="field"><label for="sdom">כתובת האתר (לא חובה)</label><input id="sdom" class="input ltr" style="text-align:left" inputmode="url" data-f="domain" value="' + esc(f.domain) + '" placeholder="ynet.co.il"><span class="hint">אפשר כמה, עם פסיק ביניהן</span></div>' +
        '<div class="field"><span class="label">צבע</span><div class="swatches">' + COLORS.concat('ink').map((c) => '<button type="button" class="swatch" style="' + SH.colorVars(c) + '" data-action="src-color" data-v="' + c + '" aria-pressed="' + (f.color === c) + '" aria-label="צבע ' + c + '"></button>').join('') + '</div></div>' +
        '<button type="button" class="btn" data-action="save-source">' + icon('check') + (d.id ? 'שמירה' : 'הוספת המקור') + '</button>' +
        (d.id ? '<button type="button" class="btn ghost" style="color:var(--red-text)" data-action="delete-source">' + icon('trash') + 'מחיקת המקור</button>' : '');
    }
  };

  // ---------- Pickers ----------
  const pickRow = (action, v, label, on, extra) => '<button type="button" class="row" data-action="' + action + '" data-v="' + esc(v) + '" aria-pressed="' + on + '">' + (extra || '') + '<span class="grow"><span class="t">' + esc(label) + '</span></span>' + (on ? '<span class="check">' + icon('check') + '</span>' : '') + '</button>';
  SHEETS.pickCat = {
    title: () => 'קטגוריה',
    render: () => {
      const q = ui.search;
      return '<div class="card list pick-list">' + pickRow('set-search-cat', 'all', 'הכל', q.cat === 'all') +
        SH.state.cats.map((c) => pickRow('set-search-cat', c.id, c.name, q.cat === c.id, '<span class="tile" style="' + SH.colorVars(c.color) + '">' + icon(c.icon) + '</span>')).join('') +
        pickRow('set-search-cat', 'none', 'בלי קטגוריה', q.cat === 'none') + '</div>';
    }
  };
  SHEETS.pickDate = {
    title: () => 'מתי שמרתי',
    render: () => '<div class="card list pick-list">' + Object.keys(SH.DATES).map((k) => pickRow('set-search-date', k, SH.DATES[k], ui.search.date === k)).join('') + '</div>'
  };
  SHEETS.pickSort = {
    title: () => 'סדר התוצאות',
    render: () => '<div class="card list pick-list">' + Object.keys(SH.SORTS).map((k) => pickRow('set-search-sort', k, SH.SORTS[k], ui.search.sort === k)).join('') + '</div>'
  };
  SHEETS.defCat = {
    title: () => 'קטגוריה לשמירה חדשה',
    render: () => {
      const d = SH.state.settings.defCat;
      return '<div class="card list pick-list">' + pickRow('set-defcat', 'last', 'האחרונה שבחרתי', d === 'last') + pickRow('set-defcat', '', 'בלי (בוחרים בכל פעם)', d === '') +
        SH.state.cats.map((c) => pickRow('set-defcat', c.id, c.name, d === c.id, '<span class="tile" style="' + SH.colorVars(c.color) + '">' + icon(c.icon) + '</span>')).join('') + '</div>';
    }
  };

  // ---------- Backup ----------
  SHEETS.importConfirm = {
    title: () => 'שחזור מגיבוי',
    render: (d) => '<div class="notice gray">' + icon('info', 'sm') + '<span class="grow">בגיבוי: ' + SH.plural(d.items, 'שמירה אחת', 'שמירות') + ', ' + SH.plural(d.thumbs, 'תמונה אחת', 'תמונות') + (d.at ? ', ' + esc(SH.whenWith('מ', d.at)) : '') + '. כרגע באפליקציה: ' + SH.plural(SH.state.items.length, 'שמירה אחת', 'שמירות') + '.</span></div>' +
      '<button type="button" class="btn" data-action="confirm-import" data-mode="merge">' + icon('plus') + 'להוסיף למה שיש</button>' +
      '<p class="fine" style="margin-top:-8px;text-align:center">שמירות שכבר קיימות לא יוכפלו.</p>' +
      '<button type="button" class="btn secondary" data-action="confirm-import" data-mode="replace">' + icon('refresh') + 'להחליף הכל בגיבוי</button>' +
      '<button type="button" class="btn ghost" data-action="close-sheet">ביטול</button>'
  };

  // ---------- Feedback (same form as MyCar; the e-mail says it came from שמרתי) ----------
  SHEETS.feedback = {
    full: true,
    title: () => 'פנייה / הצעת ייעול',
    init: () => { const p = SH.state.profile; ui.form = { type: 'idea', name: p.name, email: p.email, message: '', err: {} }; },
    render: () => {
      const f = ui.form, e = f.err || {};
      const box = SH.state.outbox.slice().reverse();
      const types = [{ v: 'idea', label: 'הצעת ייעול' }, { v: 'bug', label: 'תקלה' }, { v: 'other', label: 'אחר' }];
      let h = '<p class="fine" style="font-size:14px">יש לך רעיון מה להוסיף? משהו לא עובד? כתוב כאן והפנייה תגיע ישירות למפתח.</p>' +
        '<div class="seg" role="group" aria-label="סוג הפנייה">' + types.map((t) => '<button type="button" data-action="fb-type" data-v="' + t.v + '" aria-pressed="' + (f.type === t.v) + '">' + t.label + '</button>').join('') + '</div>' +
        '<div class="field"><label for="fbn">שם מלא *</label><input id="fbn" class="input" autocomplete="name" data-f="name" value="' + esc(f.name) + '" aria-required="true">' + (e.name ? '<span class="hint bad">' + e.name + '</span>' : '') + '</div>' +
        '<div class="field"><label for="fbe">אימייל *</label><input id="fbe" class="input ltr" style="text-align:left" type="email" inputmode="email" autocomplete="email" data-f="email" value="' + esc(f.email) + '" aria-required="true">' + (e.email ? '<span class="hint bad">' + e.email + '</span>' : '<span class="hint">כדי שנוכל לחזור אליך</span>') + '</div>' +
        '<div class="field"><label for="fbm">מה תרצה להגיד? *</label><textarea id="fbm" class="input" data-f="message" aria-required="true" placeholder="למשל: הייתי רוצה שאפשר יהיה לשמור גם תמונות מהגלריה">' + esc(f.message) + '</textarea>' + (e.message ? '<span class="hint bad">' + e.message + '</span>' : '') + '</div>' +
        '<button type="button" class="btn" data-action="send-feedback"' + (flushing ? ' aria-disabled="true"' : '') + '>' + icon('message') + (flushing ? 'שולח…' : 'שליחת הפנייה') + '</button>' +
        (SH.online() ? '' : '<p class="fine" style="text-align:center">אין חיבור כרגע. הפנייה תישמר ותישלח לבד כשיחזור האינטרנט.</p>');
      if (box.length) {
        h += '<span class="section-label">הפניות שלי</span><div class="card list">';
        box.slice(0, 6).forEach((m) => {
          const st = m.status === 'sent' ? { i: 'check', t: 'נשלחה ' + SH.time(m.sentAt || m.ts) }
            : m.status === 'failed' ? { i: 'alert', t: 'עוד לא נשלחה' + (m.error ? ': ' + m.error : '') }
            : SH.online() ? { i: 'clock', t: 'בשליחה…' } : { i: 'clock', t: 'תישלח כשיחזור האינטרנט' };
          h += '<div class="row"><span class="tile" style="' + SH.colorVars(m.status === 'sent' ? 'green' : 'amber') + '">' + icon(st.i) + '</span><span class="grow"><span class="t">' + esc(String(m.message).slice(0, 60)) + (m.message.length > 60 ? '…' : '') + '</span><span class="s">' + esc(SH.dayLabel(m.ts)) + ' · ' + esc(st.t) + '</span></span></div>';
        });
        h += '</div>';
        if (box.some((m) => m.status !== 'sent') && SH.online() && !flushing) h += '<button type="button" class="btn secondary" data-action="feedback-retry">' + icon('refresh') + 'לנסות לשלוח שוב</button>';
      }
      return h;
    }
  };

  // ---------- New version ----------
  SHEETS.update = {
    title: () => 'גרסה חדשה',
    render: () => {
      const U = SH.update, i = U.info;
      const mine = 'אצלך: ' + esc(SH.VERSION.version) + ' (בנייה ' + esc(SH.VERSION.build) + ')';
      if (!i) {
        return '<div class="about-head">' + SH.logo(72) + '<h2>שמרתי</h2><span class="ver">' + mine + '</span></div>' +
          '<div class="notice green">' + icon('check', 'sm') + '<span class="grow">יש לך את הגרסה האחרונה.</span></div>' +
          '<button type="button" class="btn secondary" data-action="close-sheet">סגירה</button>';
      }
      let h = '<div class="about-head">' + SH.logo(72) + '<h2>שמרתי ' + esc(i.version) + '</h2><span class="ver">בנייה ' + i.build + ' · ' + mine + '</span></div>';
      if (i.notes.length) h += '<div class="card pad"><span class="section-label" style="display:block;margin:0 0 8px">מה חדש</span><ul class="note-list">' + i.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul></div>';
      if (U.state === 'downloading' || U.state === 'applying') {
        h += '<div class="field"><span class="label">' + (U.state === 'applying' ? 'מתקין… האפליקציה תיפתח מחדש' : 'מוריד את העדכון… ' + Math.round(U.progress) + '%') + '</span><div class="progress"><span style="width:' + (U.state === 'applying' ? 100 : Math.max(4, U.progress)) + '%"></span></div></div>';
      } else if (i.inApp) {
        h += '<button type="button" class="btn" data-action="update-now">' + icon('download') + 'עדכון עכשיו</button>' +
          '<p class="fine" style="text-align:center">העדכון נכנס בתוך האפליקציה, בלי להתקין קובץ. כל השמירות נשארות.</p>';
      } else {
        h += '<button type="button" class="btn" data-action="open-url" data-url="' + esc(SH.APK_URL) + '">' + icon('download') + 'הורדת הגרסה החדשה</button>' +
          '<p class="fine" style="text-align:center">הגרסה הזו כוללת שינוי במנוע של האפליקציה, ולכן מתקינים אותה פעם אחת מעל הקיימת. כל השמירות נשארות.</p>';
      }
      if (U.error) h += '<div class="notice accent">' + icon('alert', 'sm') + '<span class="grow">' + esc(U.error) + '</span></div>';
      if (U.state !== 'applying') h += '<button type="button" class="btn secondary" data-action="update-later">אחר כך</button>';
      return h;
    }
  };

  // ================= Feedback sending =================
  let flushing = false;
  const FEEDBACK_ERRORS = { 'rate-limit': 'יותר מדי פניות כרגע, ננסה שוב מאוחר יותר', invalid: 'חסר שם, מייל או תוכן', 'bad-key': 'השרת דחה את הפנייה', server: 'תקלה זמנית בשרת' };
  async function flushOutbox() {
    if (flushing || !SH.online() || !SH.FEEDBACK_URL) return 0;
    const pending = SH.state.outbox.filter((m) => m.status !== 'sent');
    if (!pending.length) return 0;
    flushing = true;
    if (ui.sheet && ui.sheet.name === 'feedback') renderSheet();
    let sent = 0;
    try {
      for (const m of pending) {
        const body = {
          key: SH.FEEDBACK_KEY, app: SH.FEEDBACK_APP, name: m.name, email: m.email, type: m.type, message: m.message,
          when: SH.dateFull(m.ts) + ' ' + SH.time(m.ts),
          version: 'שמרתי ' + SH.VERSION.version + ' (בנייה ' + SH.VERSION.build + ')',
          device: SH.isNative() ? 'אנדרואיד' : 'דפדפן'
        };
        m.tries = (m.tries || 0) + 1;
        try {
          const r = await SH.http(SH.FEEDBACK_URL, { method: 'POST', data: body, plain: true, timeout: 30000 });
          let d = r.data;
          if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }
          d = d && typeof d === 'object' ? d : {};
          if ((r.ok && d.ok === true) || r.status === 302 || r.status === 303) {
            m.status = 'sent'; m.sentAt = Date.now(); delete m.error; delete m.detail; sent++;
          } else {
            m.status = 'failed';
            m.error = FEEDBACK_ERRORS[d.error] || 'השרת לא קיבל אותה' + (r.status && !r.ok ? ' (' + r.status + ')' : '');
            m.detail = String(d.error || r.status || '').slice(0, 100);
            if (d.error === 'rate-limit') break;
          }
        } catch (e) {
          m.status = 'failed'; m.error = 'אין תשובה מהשרת'; m.detail = String(e && e.message || e).slice(0, 200);
          break;
        }
      }
    } finally {
      flushing = false;
      save();
      if (ui.sheet && ui.sheet.name === 'feedback') renderSheet();
    }
    return sent;
  }
  function feedbackErrors(f) {
    const err = {};
    if (String(f.name || '').trim().length < 2) err.name = 'צריך לכתוב שם';
    if (!SH.isEmail(f.email)) err.email = 'צריך אימייל תקין';
    if (String(f.message || '').trim().length < 5) err.message = 'כתוב לפחות כמה מילים';
    return err;
  }

  // ================= Backup, restore, Excel =================
  async function exportBackup() {
    const S = SH.state;
    toast('מכין גיבוי…', 20000);
    const thumbs = {};
    for (const it of S.items) {
      if (!it.thumb) continue;
      const data = await SH.thumbs.read(it.thumb);
      if (data) thumbs[it.thumb] = data;
    }
    const doc = { app: 'shamarti', v: 1, exportedAt: new Date().toISOString(), version: SH.VERSION.version, count: S.items.length, state: S, thumbs };
    const json = JSON.stringify(doc);
    $('#toast-root').innerHTML = '';
    const ok = await SH.shareFile('שמרתי-גיבוי-' + SH.dateInput(Date.now()) + '.json', json, 'application/json', 'גיבוי שמרתי');
    if (ok) { S.settings.lastBackup = Date.now(); S.settings.backupSnooze = 0; save(); render(true); }
  }
  async function importBackup(doc, mode) {
    const S = SH.state;
    const incoming = normalize(doc.state);
    const thumbs = isObj(doc.thumbs) ? doc.thumbs : {};
    const writeThumb = async (it) => {
      const data = it.thumb && thumbs[it.thumb];
      if (!data) { it.thumb = ''; return; }
      try { it.thumb = await SH.thumbs.save(it.id, data); } catch (e) { it.thumb = ''; }
    };
    toast('משחזר…', 30000);
    if (mode === 'replace') {
      const old = S.items.map((it) => it.thumb).filter(Boolean);
      for (const it of incoming.items) await writeThumb(it);
      incoming.outbox = S.outbox; incoming.updateSeen = S.updateSeen;
      SH.state = incoming;
      old.forEach((p) => SH.thumbs.remove(p));
    } else {
      // categories with the same name are joined; new ones are added
      const catMap = {};
      incoming.cats.forEach((c) => {
        const same = S.cats.find((x) => x.id === c.id) || S.cats.find((x) => x.name.trim() === c.name.trim());
        if (same) catMap[c.id] = same.id; else { S.cats.push(c); catMap[c.id] = c.id; }
      });
      incoming.sources.forEach((s) => { if (!S.sources.some((x) => x.id === s.id)) S.sources.push(s); });
      const ids = new Set(S.items.map((it) => it.id)), keys = new Set(S.items.map((it) => it.key));
      let added = 0;
      for (const it of incoming.items) {
        if (ids.has(it.id) || keys.has(it.key)) continue;
        it.cat = it.cat ? catMap[it.cat] || '' : '';
        await writeThumb(it);
        S.items.push(it); added++;
      }
      S.items.sort((a, b) => b.ts - a.ts);
      ui.importAdded = added;
    }
    await save(true);
    applyTheme(); closeSheet();
    toast(mode === 'replace' ? 'השמירות שוחזרו' : (ui.importAdded ? 'נוספו ' + SH.plural(ui.importAdded, 'שמירה אחת', 'שמירות') : 'הכל כבר היה באפליקציה'));
    ui.stack = []; ui.tab = 'home'; ui.homeCat = 'all';
    render();
  }
  const csvCell = (v) => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  async function exportCsv() {
    const rows = [['תאריך שמירה', 'שעה', 'התיאור שלי', 'כותרת מקורית', 'יוצר', 'קטגוריה', 'מקור', 'תגיות', 'מועדף', 'קישור']]
      .concat(SH.state.items.slice().sort((a, b) => b.ts - a.ts).map((it) => [SH.dateFull(it.ts), SH.time(it.ts), it.note, it.title, it.author, (SH.catById(it.cat) || {}).name || '', SH.sourceById(it.src).name, (it.tags || []).join(', '), it.fav ? 'כן' : '', it.url]));
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    await SH.shareFile('שמרתי-' + SH.dateInput(Date.now()) + '.csv', csv, 'text/csv', 'ייצוא שמרתי');
  }

  // ================= Shared links & clipboard =================
  let lastHandled = { u: '', at: 0 };
  function handleShareUrl(u, isLaunch) {
    if (!u || u.indexOf('shamarti://share') !== 0) return;
    const now = Date.now();
    if (lastHandled.u === u && now - lastHandled.at < 5000) return;
    // the launch link stays on the activity; don't reopen it after a reload of the app
    const ls = SH.state.lastShare;
    if (isLaunch && ls && ls.u === u) return;
    lastHandled = { u, at: now };
    SH.state.lastShare = { u, at: now }; save();
    let text = '', subject = '';
    try { const x = new URL(u.replace('shamarti://', 'https://shamarti.local/')); text = x.searchParams.get('text') || ''; subject = x.searchParams.get('subject') || ''; } catch (e) { return; }
    const url = SH.findUrl(text) || SH.findUrl(subject);
    if (!url) { toast('לא מצאתי קישור במה ששותף'); return; }
    if (ui.sheet) closeSheet();
    SH.state.clipSeen = url; ui.clip = null;
    openSheet('save', { url, fromShare: true });
  }
  let clipBusy = false, clipAt = 0;
  async function checkClipboard() {
    if (!SH.state.settings.clip || clipBusy || Date.now() - clipAt < 1500) return;
    clipBusy = true; clipAt = Date.now();
    try {
      await SH.sleep(350);
      const text = await SH.readClipboard();
      const url = SH.findUrl(text);
      if (!url || url === SH.state.clipSeen) { if (ui.clip && ui.clip.url !== url) { ui.clip = null; if (!ui.sheet && !view() && ui.tab === 'home') render(true); } return; }
      const key = SH.urlKey(url);
      if (SH.state.items.some((it) => it.key === key)) return;
      if (ui.clip && ui.clip.url === url) return;
      ui.clip = { url, src: SH.detectSource(url) };
      if (!view() && ui.tab === 'home' && !ui.sheet) render(true);
    } finally { clipBusy = false; }
  }

  // ================= Actions =================
  const A = {};
  A.tab = (el) => { closeSheet(); ui.stack = []; const t = el.dataset.tab; if (t === ui.tab && t === 'home') ui.homeCat = 'all'; ui.tab = t; ui.catsEdit = false; render(); };
  A.back = () => onBack();
  A['open-sheet'] = (el) => openSheet(el.dataset.sheet);
  A['close-sheet'] = () => closeSheet();
  A['new-save'] = () => openSheet('save', {});
  A['save-clip'] = () => { const c = ui.clip; if (!c) return; ui.clip = null; SH.state.clipSeen = c.url; save(); openSheet('save', { url: c.url }); render(true); };
  A['dismiss-clip'] = () => { if (ui.clip) SH.state.clipSeen = ui.clip.url; ui.clip = null; save(); render(true); };
  A['snooze-backup'] = () => { SH.state.settings.backupSnooze = Date.now() + 3 * 864e5; save(); render(true); };
  A['home-cat'] = (el) => { ui.homeCat = el.dataset.id; ui.limit = 60; render(); };
  A.more = () => { ui.limit += 60; render(true); };
  A['open-item'] = (el) => { closeSheet(); pushView({ name: 'item', id: el.dataset.id }); };
  A['open-dup'] = (el) => { pvSeq++; ui.sheet = null; $('#sheet-root').innerHTML = ''; pushView({ name: 'item', id: el.dataset.id }); };
  A['open-search'] = (el) => {
    Object.assign(ui.search, { q: '', src: 'all', cat: ui.tab === 'home' && ui.homeCat !== 'all' ? ui.homeCat : 'all', date: 'all', sort: 'new', fav: false, limit: 80 });
    pushView({ name: 'search' });
    if (el.dataset.focus !== 'filters') setTimeout(() => { const q = $('#q'); if (q) q.focus(); }, 60);
  };
  A['open-cat'] = (el) => { ui.stack = []; ui.tab = 'home'; ui.homeCat = el.dataset.id; ui.limit = 60; render(); };
  A['open-source'] = (el) => { Object.assign(ui.search, { q: '', src: el.dataset.id, cat: 'all', date: 'all', sort: 'new', fav: false, limit: 80 }); pushView({ name: 'search' }); };
  A['toggle-cats-edit'] = () => { ui.catsEdit = !ui.catsEdit; render(true); };

  // search
  function refreshSearch() { part('s-src', V.searchChips()); part('s-res', V.searchResults()); }
  A['search-src'] = (el) => { ui.search.src = el.dataset.id; ui.search.limit = 80; refreshSearch(); };
  A['search-clear'] = () => { ui.search.q = ''; const q = $('#q'); if (q) { q.value = ''; q.focus(); } const w = $('#qwrap'); if (w) w.classList.remove('has-q'); refreshSearch(); };
  A['search-more'] = () => { ui.search.limit += 80; part('s-res', V.searchResults()); };
  A['search-fav'] = () => { ui.search.fav = !ui.search.fav; render(true); };
  A['search-tag'] = (el) => { Object.assign(ui.search, { q: el.dataset.tag, src: 'all', cat: 'all', date: 'all', sort: 'new', fav: false, limit: 80 }); pushView({ name: 'search' }); };
  A['set-search-cat'] = (el) => { ui.search.cat = el.dataset.v; closeSheet(); render(true); };
  A['set-search-date'] = (el) => { ui.search.date = el.dataset.v; closeSheet(); render(true); };
  A['set-search-sort'] = (el) => { ui.search.sort = el.dataset.v; closeSheet(); render(true); };

  // item
  const itemOf = (el) => SH.itemById(el.dataset.id);
  A['open-link'] = (el) => { const it = itemOf(el); if (it) SH.openExternal(it.url); };
  A['open-url'] = (el) => SH.openExternal(el.dataset.url);
  A['toggle-fav'] = (el) => { const it = itemOf(el); if (!it) return; it.fav = !it.fav; it.upd = Date.now(); save(); haptic(); toast(it.fav ? 'נוסף למועדפים' : 'הוסר מהמועדפים'); render(true); };
  A['edit-item'] = (el) => openSheet('save', { editId: el.dataset.id });
  A['copy-link'] = async (el) => { const it = itemOf(el); if (!it) return; const ok = await SH.writeClipboard(it.url); if (ok) SH.state.clipSeen = it.url; save(); toast(ok ? 'הקישור הועתק' : 'לא הצלחתי להעתיק'); };
  A['share-item'] = (el) => {
    const it = itemOf(el); if (!it) return;
    const title = SH.itemTitle(it);
    SH.shareText((title && title !== SH.hostOf(it.url) ? title + '\n' : '') + it.url, 'שיתוף');
  };
  A['move-item'] = (el) => openSheet('move', { id: el.dataset.id });
  A['do-move'] = (el) => {
    const it = SH.itemById(el.dataset.id); if (!it) return;
    it.cat = el.dataset.cat; it.upd = Date.now(); if (it.cat) SH.state.lastCat = it.cat;
    save(); closeSheet(); toast(it.cat ? 'הועבר ל' + SH.catById(it.cat).name : 'הוסר מהקטגוריה'); render(true);
  };
  A['delete-item'] = (el) => openSheet('deleteItem', { id: el.dataset.id });
  A['confirm-delete'] = (el) => {
    const it = SH.itemById(el.dataset.id); if (!it) { closeSheet(); return; }
    SH.state.items = SH.state.items.filter((x) => x.id !== it.id);
    if (it.thumb) SH.thumbs.remove(it.thumb);
    save(); closeSheet(); toast('נמחק');
    const v = view(); if (v && v.name === 'item' && v.id === it.id) popView(); else render(true);
  };

  // save form
  A['paste-link'] = async () => {
    const text = await SH.readClipboard();
    const url = SH.findUrl(text);
    if (!url) { toast(text ? 'אין קישור במה שהעתקת' : 'הלוח ריק. קודם מעתיקים קישור'); return; }
    ui.form.url = url; ui.form.err = ''; ui.form.srcManual = false; ui.form.thumbData = ''; ui.form.thumbManual = false; ui.form.title = ''; ui.form.author = '';
    SH.state.clipSeen = url; ui.clip = null;
    const l = $('#lnk'); if (l) l.value = url;
    startPreview();
  };
  A.refetch = () => { ui.form.thumbManual = false; ui.form.thumbData = ''; startPreview(); };
  A['pick-image'] = () => { const i = $('#image-file'); i.value = ''; i.click(); };
  A['form-fav'] = (el) => { ui.form.fav = !ui.form.fav; el.setAttribute('aria-checked', String(ui.form.fav)); const star = el.parentElement.querySelector('.lead svg'); if (star) star.classList.toggle('fill', ui.form.fav); };
  A['form-cat'] = (el) => { ui.form.cat = ui.form.cat === el.dataset.id ? '' : el.dataset.id; part('fcats', catChips()); if (ui.form.pv.state !== 'loading') part('pv', previewBox()); };
  A['new-cat-inline'] = () => { ui.form.newCat = ''; part('fcats', catChips()); const i = $('#newcat'); if (i) i.focus(); };
  A['add-cat-inline'] = () => {
    const name = String(ui.form.newCat || '').trim();
    if (!name) { ui.form.newCat = null; part('fcats', catChips()); return; }
    let c = SH.state.cats.find((x) => x.name.trim() === name);
    if (!c) { const used = new Set(SH.state.cats.map((x) => x.color)); c = { id: SH.uid(), name: name.slice(0, 40), color: COLORS.find((x) => !used.has(x)) || COLORS[SH.state.cats.length % COLORS.length], icon: 'folder' }; SH.state.cats.push(c); save(); }
    ui.form.cat = c.id; ui.form.newCat = null; part('fcats', catChips());
  };
  A['remove-tag'] = (el) => { ui.form.tags.splice(+el.dataset.i, 1); part('ftags', tagChips()); };
  A['save-item'] = () => saveItem();

  // categories
  A['new-cat'] = (el) => openSheet('cat', { forItem: el.dataset.for || '' });
  A['edit-cat'] = (el) => openSheet('cat', { id: el.dataset.id });
  A['cat-color'] = (el) => { ui.form.color = el.dataset.v; renderSheet(); };
  A['cat-icon'] = (el) => { ui.form.icon = el.dataset.v; renderSheet(); };
  A['ask-delete-cat'] = () => { ui.form.confirmDel = true; renderSheet(); };
  A['save-cat'] = () => {
    const d = ui.sheet.data, f = ui.form, name = String(f.name || '').trim();
    if (!name) { f.err = 'צריך לתת שם'; renderSheet(); return; }
    if (SH.state.cats.some((c) => c.id !== d.id && c.name.trim() === name)) { f.err = 'כבר יש קטגוריה בשם הזה'; renderSheet(); return; }
    let c = d.id ? SH.catById(d.id) : null;
    if (c) Object.assign(c, { name, color: f.color, icon: f.icon });
    else { c = { id: SH.uid(), name, color: f.color, icon: f.icon }; SH.state.cats.push(c); }
    SH.state.items.forEach((it) => { if (it.cat === c.id) it.upd = Date.now(); });
    if (d.forItem) { const it = SH.itemById(d.forItem); if (it) { it.cat = c.id; it.upd = Date.now(); SH.state.lastCat = c.id; } }
    save(); closeSheet(); toast(d.id ? 'נשמר' : 'הקטגוריה נוספה'); render(true);
  };
  A['delete-cat'] = () => {
    const id = ui.sheet.data.id;
    SH.state.cats = SH.state.cats.filter((c) => c.id !== id);
    SH.state.items.forEach((it) => { if (it.cat === id) { it.cat = ''; it.upd = Date.now(); } });
    if (SH.state.settings.defCat === id) SH.state.settings.defCat = 'last';
    if (ui.homeCat === id) ui.homeCat = 'all';
    save(); closeSheet(); toast('הקטגוריה נמחקה'); render(true);
  };
  function moveCat(id, delta) {
    const a = SH.state.cats, i = a.findIndex((c) => c.id === id), j = i + delta;
    if (i < 0 || j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; save(); render(true);
  }
  A['cat-up'] = (el) => moveCat(el.dataset.id, -1);
  A['cat-down'] = (el) => moveCat(el.dataset.id, 1);

  // sources
  A['new-source'] = () => openSheet('source', {});
  A['edit-source'] = (el) => openSheet('source', { id: el.dataset.id });
  A['src-color'] = (el) => { ui.form.color = el.dataset.v; renderSheet(); };
  A['save-source'] = () => {
    const d = ui.sheet.data, f = ui.form, name = String(f.name || '').trim();
    if (!name) { f.err = 'צריך לתת שם'; renderSheet(); return; }
    const domains = String(f.domain || '').split(/[,\s]+/).map((x) => x.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')).filter((x) => /\./.test(x)).slice(0, 5);
    let s = d.id ? SH.state.sources.find((x) => x.id === d.id) : null;
    if (s) Object.assign(s, { name: name.slice(0, 30), domains, color: f.color, letter: name.slice(0, 1).toUpperCase() });
    else { s = { id: 'c' + SH.uid(), name: name.slice(0, 30), domains, color: f.color, letter: name.slice(0, 1).toUpperCase(), custom: true }; SH.state.sources.push(s); }
    // links already saved from this site now belong to it
    let moved = 0;
    if (domains.length) SH.state.items.forEach((it) => { if (it.src === 'web' && SH.detectSource(it.url) === s.id) { it.src = s.id; it.upd = Date.now(); moved++; } });
    save(); closeSheet(); toast(moved ? (d.id ? 'נשמר. ' : 'המקור נוסף. ') + (moved === 1 ? 'שמירה אחת עברה אליו' : SH.fmt(moved) + ' שמירות עברו אליו') : d.id ? 'נשמר' : 'המקור נוסף'); render(true);
  };
  A['delete-source'] = () => {
    const id = ui.sheet.data.id;
    SH.state.sources = SH.state.sources.filter((s) => s.id !== id);
    SH.state.items.forEach((it) => { if (it.src === id) { it.src = SH.detectSource(it.url); it.upd = Date.now(); } });
    save(); closeSheet(); toast('המקור נמחק'); render(true);
  };

  // settings
  A['set-theme'] = (el) => { SH.state.settings.theme = el.dataset.v; save(); applyTheme(); render(true); };
  A['toggle-setting'] = (el) => {
    const k = el.dataset.k; SH.state.settings[k] = !SH.state.settings[k];
    if (k === 'clip' && !SH.state.settings.clip) ui.clip = null;
    save(); render(true);
    if (k === 'clip' && SH.state.settings.clip) checkClipboard();
  };
  A['set-defcat'] = (el) => { SH.state.settings.defCat = el.dataset.v; save(); closeSheet(); render(true); };
  A['export-backup'] = () => exportBackup();
  A['import-backup'] = () => { const i = $('#import-file'); i.value = ''; i.click(); };
  A['confirm-import'] = (el) => importBackup(ui.sheet.data.doc, el.dataset.mode);
  A['export-csv'] = () => exportCsv();
  A['share-app'] = () => SH.shareText('שמרתי – שומרים סרטונים מטיקטוק, אינסטגרם ויוטיוב וכל קישור, עם תיאור וקטגוריה. להורדה:\n' + SH.APK_URL, 'שיתוף שמרתי');
  A['check-update'] = async () => { const i = await SH.update.check(true); if (i) openSheet('update'); else toast(SH.update.error || 'יש לך את הגרסה האחרונה'); render(true); };
  A['update-now'] = () => SH.update.apply();
  A['update-later'] = () => { if (SH.update.info) SH.state.updateSeen = SH.update.info.build; save(); closeSheet(); };

  // feedback
  A['fb-type'] = (el) => { ui.form.type = el.dataset.v; renderSheet(); };
  A['feedback-retry'] = async () => { if (!SH.online()) { toast('אין חיבור כרגע'); return; } const n = await flushOutbox(); toast(n ? 'נשלח. תודה!' : 'עדיין לא הצלחתי לשלוח. ננסה שוב לבד.'); };
  A['send-feedback'] = async () => {
    if (flushing) return;
    const f = ui.form, err = feedbackErrors(f);
    f.err = err;
    if (Object.keys(err).length) { renderSheet(); return; }
    SH.state.profile = { name: f.name.trim(), email: f.email.trim() };
    SH.state.outbox.push({ id: SH.uid(), ts: Date.now(), type: f.type, name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), status: 'pending' });
    SH.state.outbox = SH.state.outbox.slice(-30);
    save();
    f.message = ''; f.err = {};
    renderSheet();
    if (SH.online()) { toast('שולח…', 8000); const n = await flushOutbox(); toast(n ? 'תודה! הפנייה נשלחה' : 'לא הצלחתי לשלוח כרגע. ננסה שוב לבד.'); }
    else toast('נשמר. הפנייה תישלח כשיחזור האינטרנט');
  };

  // ================= Events =================
  function onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = A[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    if (el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
    fn(el, e);
  }
  function onInput(e) {
    const el = e.target;
    if (el.dataset.search) {
      ui.search.q = el.value; ui.search.limit = 80;
      const w = $('#qwrap'); if (w) w.classList.toggle('has-q', !!el.value);
      debouncedSearch();
      return;
    }
    if (el.dataset.f && ui.sheet) {
      const k = el.dataset.f;
      if (k === 'tagInput' && /[,،]/.test(el.value)) { addTag(el.value); part('ftags', tagChips()); const t = $('#tagin'); if (t) t.focus(); return; }
      ui.form[k] = el.value;
      if (ui.sheet.name === 'save' && k === 'url') {
        ui.form.err = ''; ui.form.srcManual = false; ui.form.title = ''; ui.form.author = ''; ui.form.site = '';
        if (!ui.form.thumbManual) ui.form.thumbData = '';
        if (ui.form.editId) ui.form.thumbPath = SH.itemById(ui.form.editId) && SH.urlKey(el.value) === SH.itemById(ui.form.editId).key ? SH.itemById(ui.form.editId).thumb : '';
        debouncedPreview();
      }
    }
  }
  const debouncedSearch = SH.debounce(refreshSearch, 160);
  function onChange(e) {
    const el = e.target;
    if (el.dataset.f === 'src' && ui.sheet && ui.sheet.name === 'save') { ui.form.src = el.value; ui.form.srcManual = true; refreshPreview(); return; }
    if (el.id === 'image-file') {
      const file = el.files && el.files[0]; if (!file || !ui.sheet || ui.sheet.name !== 'save') return;
      const url = URL.createObjectURL(file);
      SH.resizeImage(url, 900, 0.82).then((img) => {
        Object.assign(ui.form, { thumbData: img.data, tw: img.w, th: img.h, thumbManual: true, pv: { state: 'ok' } });
        refreshPreview();
      }).catch(() => toast('לא הצלחתי לפתוח את התמונה')).finally(() => URL.revokeObjectURL(url));
      return;
    }
    if (el.id === 'import-file') {
      const file = el.files && el.files[0]; if (!file) return;
      toast('קורא את הגיבוי…', 20000);
      const reader = new FileReader();
      reader.onload = () => {
        $('#toast-root').innerHTML = '';
        try {
          const d = JSON.parse(String(reader.result));
          if (!d || d.app !== 'shamarti' || !d.state) throw new Error('bad');
          openSheet('importConfirm', { doc: d, items: (d.state.items || []).length, thumbs: Object.keys(d.thumbs || {}).length, at: Date.parse(d.exportedAt) || 0 });
        } catch (err) { toast('הקובץ הזה אינו גיבוי של שמרתי'); }
      };
      reader.onerror = () => toast('לא הצלחתי לקרוא את הקובץ');
      reader.readAsText(file);
    }
  }
  function onKey(e) {
    if (e.key === 'Escape' && ui.sheet) { closeSheet(); return; }
    const el = e.target;
    if (e.key === 'Enter' && el && el.id === 'tagin') { e.preventDefault(); if (el.value.trim()) { addTag(el.value); part('ftags', tagChips()); const t = $('#tagin'); if (t) t.focus(); } return; }
    if (e.key === 'Enter' && el && el.id === 'newcat') { e.preventDefault(); A['add-cat-inline'](); return; }
    if (e.key === 'Enter' && el && el.dataset && el.dataset.search) { e.preventDefault(); el.blur(); }
  }
  function onBack() {
    if (ui.sheet) { closeSheet(); return; }
    if (ui.stack.length) { popView(); return; }
    if (ui.tab !== 'home') { ui.tab = 'home'; render(); return; }
    if (ui.homeCat !== 'all') { ui.homeCat = 'all'; render(); return; }
    SH.call('App', 'exitApp');
  }

  // ================= Start =================
  async function init() {
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey);
    await SH.initNetwork();
    await SH.thumbs.init();
    SH.state = normalize(await SH.loadState());
    applyTheme();
    if (window.matchMedia) { try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (SH.state.settings.theme === 'system') applyTheme(); }); } catch (e) { /* old webview */ } }
    render();
    if (SH.isNative()) {
      SH.listen('App', 'backButton', onBack);
      SH.listen('App', 'appUrlOpen', (d) => handleShareUrl(d && d.url, false));
      SH.listen('App', 'appStateChange', (st) => {
        if (st && st.isActive) { checkClipboard(); flushOutbox(); autoUpdateCheck(); }
        else SH.flushSave();
      });
      SH.listen('App', 'pause', () => SH.flushSave());
      const launch = await SH.call('App', 'getLaunchUrl');
      if (launch && launch.url) handleShareUrl(launch.url, true);
    }
    window.addEventListener('focus', () => checkClipboard());
    SH.onUpdate(() => {
      if (ui.sheet && ui.sheet.name === 'update') renderSheet();
      else if (!ui.sheet && ui.tab === 'settings' && !view()) render(true);
    });
    SH.onNetwork((on) => {
      if (ui.sheet && (ui.sheet.name === 'feedback' || ui.sheet.name === 'save')) { if (ui.sheet.name === 'save') refreshPreview(); else renderSheet(); }
      if (on) { flushOutbox(); autoUpdateCheck(); }
    });
    if (!ui.sheet) checkClipboard();
    flushOutbox();
    autoUpdateCheck();
  }
  // Looks for a new version when the app opens; shows it once per version.
  async function autoUpdateCheck() {
    const info = await SH.update.check(false);
    if (info && info.build > (SH.state.updateSeen || 0) && !ui.sheet && !view()) openSheet('update');
  }

  // Small test surface for automated checks.
  window.__shamarti = { normalize, A, get ui() { return ui; }, render, openSheet, closeSheet, handleShareUrl, saveItem, importBackup, flushOutbox };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
