/* שמרתי screens: home, categories, favourites, settings, search and the item page (HTML strings). */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = (SH.views = {});

  // ================= Item helpers =================
  SH.catById = (id) => (id ? SH.state.cats.find((c) => c.id === id) || null : null);
  SH.itemTitle = (it) => {
    const first = String(it.note || '').split('\n').map((s) => s.trim()).find(Boolean);
    return first || it.title || SH.hostOf(it.url) || 'קישור';
  };
  SH.itemRest = (it) => {
    const lines = String(it.note || '').split('\n');
    const i = lines.findIndex((s) => s.trim());
    return i < 0 ? '' : lines.slice(i + 1).join('\n').trim();
  };
  SH.itemColor = (it) => { const c = SH.catById(it.cat); return c ? c.color : (SH.sourceById(it.src).color === 'ink' ? 'gray' : SH.sourceById(it.src).color); };
  SH.itemGlyph = (it) => { const c = SH.catById(it.cat); if (c) return c.icon; const s = SH.sourceById(it.src); return s.video ? 'play' : s.icon || 'link'; };
  SH.isVideo = (it) => !!SH.sourceById(it.src).video;
  SH.ratio = (it) => {
    if (it.tw && it.th) return SH.clamp(it.th / it.tw, 0.56, 1.5);
    return SH.isTall(it) ? 1.33 : 0.62;
  };

  function thumbInner(it, opts) {
    const src = SH.thumbs.src(it.thumb);
    let h = src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' : '<span class="ph">' + icon(SH.itemGlyph(it)) + '</span>';
    if (opts.badges !== false) {
      h += '<span class="badge src">' + esc(SH.sourceLabel(SH.sourceById(it.src))) + '</span>';
      if (SH.isVideo(it) && opts.play !== false) h += '<span class="badge play">' + icon('play') + '</span>';
      if (it.fav && opts.fav !== false) h += '<span class="fav" role="img" aria-label="מועדף">' + icon('star') + '</span>';
    }
    return h;
  }
  SH.thumbHTML = (it, cls, style, opts) => '<span class="thumb' + (cls ? ' ' + cls : '') + '" style="' + SH.colorVars(SH.itemColor(it)) + (style ? ';' + style : '') + '">' + thumbInner(it, opts || {}) + '</span>';

  function card(it) {
    const c = SH.catById(it.cat);
    const meta = (c ? '<span class="dot" style="' + SH.colorVars(c.color) + '"></span><span>' + esc(c.name) + ' · ' + SH.dateShort(it.ts) + '</span>' : '<span>' + SH.dateShort(it.ts) + '</span>');
    return '<button type="button" class="card-item" data-action="open-item" data-id="' + esc(it.id) + '">' +
      SH.thumbHTML(it, '', 'aspect-ratio:1/' + SH.ratio(it).toFixed(3)) +
      '<span class="card-title">' + esc(SH.itemTitle(it)) + '</span>' +
      '<span class="card-meta">' + meta + '</span></button>';
  }
  // Two columns; each card goes to the shorter column so the grid stays even (masonry).
  V.masonry = (items) => {
    const cols = [[], []], hgt = [0, 0];
    items.forEach((it) => {
      const k = hgt[0] <= hgt[1] ? 0 : 1;
      cols[k].push(card(it));
      hgt[k] += SH.ratio(it) + 0.32;
    });
    return '<div class="masonry"><div class="col">' + cols[0].join('') + '</div><div class="col">' + cols[1].join('') + '</div></div>';
  };

  const sortNew = (a, b) => b.ts - a.ts;
  SH.countByCat = () => { const m = {}; SH.state.items.forEach((it) => { m[it.cat || ''] = (m[it.cat || ''] || 0) + 1; }); return m; };
  SH.countBySrc = (items) => { const m = {}; (items || SH.state.items).forEach((it) => { m[it.src] = (m[it.src] || 0) + 1; }); return m; };

  // ================= Home =================
  V.home = () => {
    const S = SH.state, ui = SH.ui;
    const total = S.items.length;
    let h = '<header class="top"><div class="brand">' + SH.logo(34) + '<h1 class="h1">שמרתי</h1></div>' + (total ? '<span class="count">' + SH.plural(total, 'שמירה אחת', 'שמירות') + '</span>' : '') + '</header>';
    if (total) {
      h += '<div class="searchrow"><button type="button" class="searchbar" data-action="open-search">' + icon('search', 'sm') + '<span>חיפוש בתיאורים, כותרות וקישורים</span></button>' +
        '<button type="button" class="icon-btn boxed" data-action="open-search" data-focus="filters" aria-label="סינון לפי מקור, קטגוריה ותאריך">' + icon('sliders', 'sm') + '</button></div>';
    }
    if (ui.clip) {
      const s = SH.sourceById(ui.clip.src);
      h += '<div class="banner"><span class="ic">' + icon('link', 'sm') + '</span><div class="txt"><div class="t">יש קישור' + (ui.clip.src !== 'web' ? ' מ-' + esc(s.name) : '') + ' בהעתקה</div><div class="s ltr" style="text-align:right">' + esc(ui.clip.url.replace(/^https?:\/\//, '')) + '</div></div>' +
        '<button type="button" class="go" data-action="save-clip">שמירה</button><button type="button" class="x" data-action="dismiss-clip" aria-label="לא עכשיו">' + icon('close', 'sm') + '</button></div>';
    }
    if (SH.backupDue()) {
      h += '<div class="banner gray"><span class="ic">' + icon('shield', 'sm') + '</span><div class="txt"><div class="t">כדאי לגבות את השמירות</div><div class="s">' + (S.settings.lastBackup ? 'הגיבוי האחרון: ' + SH.dayLabel(S.settings.lastBackup) : 'עוד לא עשית גיבוי') + '</div></div>' +
        '<button type="button" class="go" data-action="export-backup">גיבוי</button><button type="button" class="x" data-action="snooze-backup" aria-label="אחר כך">' + icon('close', 'sm') + '</button></div>';
    }
    if (!total) return h + V.welcome();

    const counts = SH.countByCat();
    const cat = ui.homeCat;
    const chip = (id, label, n, color) => '<button type="button" class="chip" data-action="home-cat" data-id="' + esc(id) + '" aria-pressed="' + (cat === id) + '"' + (color ? ' style="' + SH.colorVars(color) + '"' : '') + '>' + esc(label) + '<span class="n">' + SH.fmt(n) + '</span></button>';
    h += '<div class="chips scroll" role="group" aria-label="קטגוריות">' + chip('all', 'הכל', total);
    S.cats.forEach((c) => { if (counts[c.id]) h += chip(c.id, c.name, counts[c.id]); });
    if (counts['']) h += chip('none', 'בלי קטגוריה', counts['']);
    h += '</div>';

    let list = S.items.slice().sort(sortNew);
    if (cat === 'none') list = list.filter((it) => !it.cat);
    else if (cat !== 'all') list = list.filter((it) => it.cat === cat);
    const c = SH.catById(cat);
    h += '<div class="sec-head"><h2>' + (c ? esc(c.name) : cat === 'none' ? 'בלי קטגוריה' : 'נשמרו לאחרונה') + '</h2><span>' + (c || cat === 'none' ? SH.plural(list.length, 'שמירה אחת', 'שמירות') : 'לפי תאריך שמירה') + '</span></div>';
    if (!list.length) return h + '<div class="empty boxed">' + icon('folder', 'lg') + '<span>אין עדיין שמירות בקטגוריה הזו</span></div>';
    h += V.masonry(list.slice(0, ui.limit));
    if (list.length > ui.limit) h += '<button type="button" class="btn secondary small more" data-action="more">עוד ' + SH.fmt(Math.min(60, list.length - ui.limit)) + ' שמירות</button>';
    return h;
  };
  V.welcome = () => '<div class="card welcome">' + SH.logo(64) + '<h2>כאן יישמר כל מה ששווה לזכור</h2>' +
    '<p>סרטונים מטיקטוק ואינסטגרם, יוטיוב, אתרים וכל קישור. עם תמונה, תיאור שלך וקטגוריה, כדי שתמצא את זה גם בעוד שנים.</p>' +
    '<div class="ways">' +
    '<div class="way"><span class="tile">' + icon('share') + '</span><div><b>שיתוף ← שמרתי</b><span>בטיקטוק, באינסטגרם או ביוטיוב לוחצים "שיתוף" ובוחרים בשמרתי.</span></div></div>' +
    '<div class="way"><span class="tile">' + icon('clipboard') + '</span><div><b>העתקה והדבקה</b><span>מעתיקים קישור ונכנסים לכאן. האפליקציה תציע לשמור אותו.</span></div></div>' +
    '</div><button type="button" class="btn" data-action="new-save">' + icon('plus') + 'שמירה ראשונה</button></div>';
  V.fab = () => '<button type="button" class="fab" data-action="new-save">' + icon('plus') + 'שמירה</button>';

  // ================= Favourites =================
  V.favs = () => {
    const list = SH.state.items.filter((it) => it.fav).sort(sortNew);
    let h = '<header class="top"><h1 class="h1">מועדפים</h1>' + (list.length ? '<span class="count">' + SH.plural(list.length, 'שמירה אחת', 'שמירות') + '</span>' : '') + '</header>';
    if (!list.length) return h + '<div class="empty boxed">' + icon('star', 'lg') + '<b>עוד אין מועדפים</b><span>בכל שמירה אפשר ללחוץ על הכוכב, והיא תופיע כאן.</span></div>';
    return h + V.masonry(list);
  };

  // ================= Categories & sources =================
  V.cats = () => {
    const S = SH.state, ui = SH.ui, edit = ui.catsEdit;
    const counts = SH.countByCat();
    let h = '<header class="top"><h1 class="h1">קטגוריות</h1><button type="button" class="text-btn" data-action="toggle-cats-edit">' + (edit ? 'סיום' : 'סידור ועריכה') + '</button></header>';
    h += '<div class="card list">';
    S.cats.forEach((c, i) => {
      const n = counts[c.id] || 0;
      const inner = '<span class="tile" style="' + SH.colorVars(c.color) + '">' + icon(c.icon) + '</span><span class="grow"><span class="t b">' + esc(c.name) + '</span><span class="s">' + SH.plural(n, 'שמירה אחת', 'שמירות') + '</span></span>';
      if (edit) {
        h += '<div class="row">' + inner + '<span class="mini-btns">' +
          '<button type="button" class="icon-btn" data-action="cat-up" data-id="' + esc(c.id) + '" aria-label="להזיז למעלה"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button>' +
          '<button type="button" class="icon-btn" data-action="cat-down" data-id="' + esc(c.id) + '" aria-label="להזיז למטה"' + (i === S.cats.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
          '<button type="button" class="icon-btn" data-action="edit-cat" data-id="' + esc(c.id) + '" aria-label="עריכת ' + esc(c.name) + '">' + icon('edit') + '</button></span></div>';
      } else {
        h += '<button type="button" class="row" data-action="open-cat" data-id="' + esc(c.id) + '">' + inner + '<span class="chev">' + icon('chevL') + '</span></button>';
      }
    });
    if (counts['']) h += '<button type="button" class="row" data-action="open-cat" data-id="none"><span class="tile" style="' + SH.colorVars('gray') + '">' + icon('folder') + '</span><span class="grow"><span class="t b">בלי קטגוריה</span><span class="s">' + SH.plural(counts[''], 'שמירה אחת', 'שמירות') + '</span></span><span class="chev">' + icon('chevL') + '</span></button>';
    if (!S.cats.length && !counts['']) h += '<div class="empty">עוד אין קטגוריות</div>';
    h += '</div><button type="button" class="dashed-btn" data-action="new-cat">' + icon('plus', 'sm') + 'קטגוריה חדשה</button>';

    const sc = SH.countBySrc();
    h += '<div class="sub-h"><h2>מאיפה שמרתי</h2><p>המקור מזוהה לבד לפי הקישור. אפשר להוסיף מקורות משלך, למשל אתר שאתה שומר ממנו הרבה.</p></div><div class="grid2">';
    SH.allSources().forEach((s) => {
      const n = sc[s.id] || 0;
      if (!n && !s.custom) return;
      const av = '<span class="avatar" style="' + SH.colorVars(s.color) + '">' + (s.icon ? icon(s.icon) : esc(s.letter || s.name.slice(0, 1))) + '</span>';
      const body = av + '<span class="grow"><span class="t">' + esc(s.name) + '</span><span class="s">' + SH.plural(n, 'שמירה אחת', 'שמירות') + '</span></span>';
      if (edit && s.custom) h += '<button type="button" class="src-tile" data-action="edit-source" data-id="' + esc(s.id) + '">' + body + icon('edit', 'sm') + '</button>';
      else h += '<button type="button" class="src-tile" data-action="open-source" data-id="' + esc(s.id) + '">' + body + '</button>';
    });
    h += '<button type="button" class="src-tile dashed-btn" data-action="new-source">' + icon('plus', 'sm') + 'מקור חדש</button></div>';
    return h;
  };

  // ================= Settings =================
  const sw = (key, label, sub, on, ic) => '<div class="row">' + (ic ? '<span class="lead">' + icon(ic) + '</span>' : '') + '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' +
    '<button type="button" class="switch-hit" role="switch" aria-checked="' + !!on + '" data-action="toggle-setting" data-k="' + key + '" aria-label="' + esc(label) + '"><span class="switch"></span></button></div>';
  const navRow = (action, ic, label, sub, value, extra) => '<button type="button" class="row" data-action="' + action + '"' + (extra || '') + '>' + (ic ? '<span class="lead' + (ic === 'upload' ? ' accent' : '') + '">' + icon(ic) + '</span>' : '') + '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' + (value ? '<span class="v">' + esc(value) + '</span>' : '') + '<span class="chev">' + icon('chevL', 'sm') + '</span></button>';
  V.settings = () => {
    const S = SH.state, st = S.settings;
    const themes = [{ v: 'light', l: 'בהיר' }, { v: 'dark', l: 'כהה' }, { v: 'system', l: 'לפי הטלפון' }];
    let h = '<header class="top"><h1 class="h1">הגדרות</h1></header>';
    h += '<span class="section-label">מראה</span><div class="seg" role="group" aria-label="מראה">' + themes.map((t) => '<button type="button" data-action="set-theme" data-v="' + t.v + '" aria-pressed="' + (st.theme === t.v) + '">' + t.l + '</button>').join('') + '</div>';
    h += '<span class="section-label">שמירה</span><div class="card list">' +
      sw('clip', 'זיהוי קישור שהעתקתי', 'כשנכנסים לאפליקציה עם קישור מועתק, היא מציעה לשמור אותו', st.clip) +
      sw('thumbs', 'שמירת תמונת הסרטון בטלפון', 'התמונה נשארת גם אם הסרטון יימחק מהרשת', st.thumbs) +
      navRow('open-sheet', '', 'קטגוריה לשמירה חדשה', '', st.defCat === 'last' ? 'האחרונה שבחרתי' : st.defCat === '' ? 'בלי' : ((SH.catById(st.defCat) || {}).name || 'בלי'), ' data-sheet="defCat"') +
      '</div>';
    h += '<span class="section-label">גיבוי ונתונים</span><div class="card list">' +
      navRow('export-backup', 'upload', 'גיבוי לקובץ', SH.plural(S.items.length, 'שמירה אחת', 'שמירות') + ' והתמונות. לשמור בדרייב, בוואטסאפ או במחשב' + (st.lastBackup ? ' · גיבוי אחרון: ' + SH.dayLabel(st.lastBackup) : '')) +
      navRow('import-backup', 'download', 'שחזור מגיבוי', 'בטלפון חדש, או כדי להחזיר שמירות') +
      sw('backupRemind', 'תזכורת לגבות כל שבוע', 'הודעה קטנה במסך הבית אם עבר שבוע בלי גיבוי', st.backupRemind, 'clock') +
      navRow('export-csv', 'table', 'ייצוא לאקסל', 'כל השמירות בטבלה') +
      '</div>';
    h += '<span class="section-label">כללי</span><div class="card list">' +
      navRow('open-sheet', 'message', 'פנייה / הצעת ייעול', 'מה להוסיף? מה לשפר? הפנייה מגיעה ישירות למפתח', '', ' data-sheet="feedback"') +
      V.updateRow() +
      navRow('share-app', 'share', 'שיתוף האפליקציה', 'לשלוח לחברים קישור להורדה') +
      '</div>';
    h += '<div class="credit">' + SH.logo(44) + '<span class="n">שמרתי · גרסה ' + esc(SH.VERSION.version) + (SH.VERSION.build && SH.VERSION.build !== 'dev' ? ' (בנייה ' + esc(SH.VERSION.build) + ')' : '') + '</span><span class="by">פותח על ידי <b>Itzko</b></span></div>';
    return h;
  };
  V.updateRow = () => {
    const U = SH.update;
    if (!SH.canSelfUpdate()) return '';
    if (U.info) return navRow('open-sheet', 'sparkle', 'יש גרסה חדשה: ' + U.info.version + ' (בנייה ' + U.info.build + ')', 'לחיצה לעדכון', '', ' data-sheet="update"');
    return navRow('check-update', 'refresh', U.state === 'checking' ? 'בודק…' : 'בדיקת עדכונים', 'אצלך גרסה ' + SH.VERSION.version + ' (בנייה ' + SH.VERSION.build + ')');
  };

  // ================= Search =================
  const DATES = { all: 'כל הזמנים', week: 'השבוע האחרון', month: 'החודש האחרון', year: 'השנה האחרונה', older: 'לפני יותר משנה' };
  const SORTS = { new: 'החדשים קודם', old: 'הישנים קודם', az: 'לפי א-ב' };
  SH.DATES = DATES; SH.SORTS = SORTS;
  function searchText(it) {
    if (it._sv !== it.upd) {
      const c = SH.catById(it.cat), s = SH.sourceById(it.src);
      it._s = SH.norm([it.note, it.title, it.author, (it.tags || []).join(' '), it.url, it.site, c ? c.name : '', s ? s.name : ''].join(' '));
      it._sv = it.upd;
    }
    return it._s;
  }
  // All search filters except the source, so the source chips can show their own counts.
  function baseResults() {
    const q = SH.ui.search;
    const words = SH.norm(q.q).split(' ').filter(Boolean);
    const now = Date.now(), day = 864e5;
    return SH.state.items.filter((it) => {
      if (q.cat === 'none' ? it.cat : q.cat !== 'all' && it.cat !== q.cat) return false;
      if (q.date === 'week' && it.ts < now - 7 * day) return false;
      if (q.date === 'month' && it.ts < now - 30 * day) return false;
      if (q.date === 'year' && it.ts < now - 365 * day) return false;
      if (q.date === 'older' && it.ts >= now - 365 * day) return false;
      if (q.fav && !it.fav) return false;
      if (words.length) { const t = searchText(it); if (!words.every((w) => t.includes(w))) return false; }
      return true;
    });
  }
  V.searchChips = () => {
    const q = SH.ui.search, base = baseResults(), counts = SH.countBySrc(base);
    const chip = (id, label, n) => '<button type="button" class="chip" data-action="search-src" data-id="' + esc(id) + '" aria-pressed="' + (q.src === id) + '">' + esc(label) + '<span class="n">' + SH.fmt(n) + '</span></button>';
    let h = chip('all', 'הכל', base.length);
    const all = SH.countBySrc();
    SH.allSources().forEach((s) => { if (all[s.id] || q.src === s.id) h += chip(s.id, s.name, counts[s.id] || 0); });
    return h;
  };
  V.searchResults = () => {
    const q = SH.ui.search;
    let list = baseResults();
    if (q.src !== 'all') list = list.filter((it) => it.src === q.src);
    if (q.sort === 'old') list.sort((a, b) => a.ts - b.ts);
    else if (q.sort === 'az') list.sort((a, b) => SH.itemTitle(a).localeCompare(SH.itemTitle(b), 'he'));
    else list.sort(sortNew);
    const n = list.length;
    const has = q.q.trim();
    let h = '<div class="section-label" style="margin:0 2px">' + (n === 0 ? 'אין תוצאות' : n === 1 ? 'תוצאה אחת' : SH.fmt(n) + ' תוצאות') + (has ? ' ל״' + esc(q.q.trim()) + '״' : '') + '</div>';
    if (!n) {
      const src = q.src !== 'all' ? SH.sourceById(q.src) : null;
      return h + '<div class="empty boxed">' + icon('search', 'lg') + '<span>' + (src ? 'לא נמצא משהו מ-' + esc(src.name) + (has ? ' עם המילה הזו' : '') : has ? 'לא מצאתי שמירה עם המילים האלה' : 'אין שמירות שמתאימות לסינון') + '</span></div>';
    }
    h += '<div class="res-list">';
    list.slice(0, q.limit).forEach((it) => {
      const c = SH.catById(it.cat), s = SH.sourceById(it.src);
      const rest = SH.itemRest(it) || (it.note && it.title ? it.title : '') || it.author || SH.hostOf(it.url);
      h += '<button type="button" class="res" data-action="open-item" data-id="' + esc(it.id) + '">' + SH.thumbHTML(it, '', '', { badges: false }) +
        '<span class="grow"><span class="t">' + SH.highlight(SH.itemTitle(it), q.q) + '</span>' +
        (rest ? '<span class="s">' + SH.highlight(rest.split('\n')[0], q.q) + '</span>' : '') +
        '<span class="m"><span class="pill">' + esc(SH.sourceLabel(s)) + '</span><span>' + (c ? esc(c.name) + ' · ' : '') + SH.dateShort(it.ts) + '</span></span></span></button>';
    });
    h += '</div>';
    if (n > q.limit) h += '<button type="button" class="btn secondary small more" data-action="search-more">עוד תוצאות</button>';
    h += '<p class="fine">החיפוש בודק את התיאור שכתבת, הכותרת המקורית, התגיות, היוצר והקישור עצמו.</p>';
    return h;
  };
  V.search = () => {
    const q = SH.ui.search;
    const cat = q.cat === 'all' ? 'קטגוריה: הכל' : q.cat === 'none' ? 'בלי קטגוריה' : (SH.catById(q.cat) || {}).name || 'קטגוריה';
    const btn = (sheet, label, on) => '<button type="button" class="chip sm' + (on ? ' on' : '') + '" data-action="open-sheet" data-sheet="' + sheet + '">' + esc(label) + icon('chevD', 'xs') + '</button>';
    return '<div class="bar-top"><button type="button" class="icon-btn" data-action="back" aria-label="חזרה">' + icon('back') + '</button>' +
      '<div class="input-wrap' + (q.q ? ' has-q' : '') + '" id="qwrap"><span class="lead">' + icon('search', 'sm') + '</span><label for="q" class="sr-only">חיפוש</label>' +
      '<input id="q" class="input" type="search" enterkeyhint="search" autocomplete="off" placeholder="מה לחפש?" data-search="q" value="' + esc(q.q) + '">' +
      '<button type="button" class="clear" data-action="search-clear" aria-label="ניקוי החיפוש">' + icon('close', 'sm') + '</button></div></div>' +
      '<span class="section-label">מאיפה</span><div class="chips scroll" id="s-src" role="group" aria-label="מקור">' + V.searchChips() + '</div>' +
      '<div class="chips scroll" id="s-filters">' + btn('pickCat', cat, q.cat !== 'all') + btn('pickDate', q.date === 'all' ? 'תאריך: כל הזמנים' : DATES[q.date], q.date !== 'all') + btn('pickSort', SORTS[q.sort], q.sort !== 'new') +
      '<button type="button" class="chip sm' + (q.fav ? ' on' : '') + '" data-action="search-fav" aria-pressed="' + q.fav + '">' + icon('star', 'xs') + 'מועדפים</button></div>' +
      '<div id="s-res" style="display:flex;flex-direction:column;gap:12px">' + V.searchResults() + '</div>';
  };

  // ================= Item page =================
  V.item = (it) => {
    if (!it) return '<div class="bar-top"><button type="button" class="icon-btn" data-action="back" aria-label="חזרה">' + icon('back') + '</button></div><div class="empty">השמירה הזו כבר לא קיימת</div>';
    const s = SH.sourceById(it.src), c = SH.catById(it.cat);
    const rest = SH.itemRest(it);
    const openLabel = it.src === 'web' ? 'פתיחת האתר' : s.custom ? 'פתיחת הקישור' : 'פתיחה ב-' + s.name;
    const ratio = Math.min(SH.ratio(it), 1.25);
    const src = SH.thumbs.src(it.thumb);
    let h = '<div class="bar-top"><button type="button" class="icon-btn" data-action="back" aria-label="חזרה">' + icon('back') + '</button><span class="grow"></span>' +
      '<button type="button" class="icon-btn' + (it.fav ? ' on' : '') + '" data-action="toggle-fav" data-id="' + esc(it.id) + '" aria-pressed="' + !!it.fav + '" aria-label="' + (it.fav ? 'הסרה מהמועדפים' : 'הוספה למועדפים') + '">' + icon('star', it.fav ? 'fill' : '') + '</button>' +
      '<button type="button" class="icon-btn" data-action="edit-item" data-id="' + esc(it.id) + '" aria-label="עריכה">' + icon('edit') + '</button></div>';
    h += '<button type="button" class="hero" data-action="open-link" data-id="' + esc(it.id) + '" aria-label="' + esc(openLabel) + '" style="aspect-ratio:1/' + ratio.toFixed(3) + ';' + SH.colorVars(SH.itemColor(it)) + '">' +
      (src ? '<img src="' + esc(src) + '" alt="">' : SH.isVideo(it) ? '' : '<span class="ph">' + icon(SH.itemGlyph(it)) + '</span>') +
      (SH.isVideo(it) ? '<span class="playbig">' + icon('play') + '</span>' : '') +
      '<span class="badge">' + esc(SH.sourceLabel(s)) + '</span></button>';
    h += '<h1 class="item-h1">' + esc(SH.itemTitle(it)) + '</h1>' + (rest ? '<p class="item-note">' + esc(rest) + '</p>' : '');
    const chips = (c ? '<button type="button" class="catchip" data-action="move-item" data-id="' + esc(it.id) + '" style="' + SH.colorVars(c.color) + '"><span class="dot"></span>' + esc(c.name) + '</button>' : '<button type="button" class="catchip" data-action="move-item" data-id="' + esc(it.id) + '" style="' + SH.colorVars('gray') + '">' + icon('folder', 'xs') + 'בלי קטגוריה</button>') +
      (it.tags || []).map((t) => '<button type="button" class="tagchip plain" data-action="search-tag" data-tag="' + esc(t) + '">#' + esc(t) + '</button>').join('');
    h += '<div class="chips">' + chips + '</div>';
    h += '<button type="button" class="btn" data-action="open-link" data-id="' + esc(it.id) + '">' + icon('external') + esc(openLabel) + '</button>';
    const r = (k, v, cls) => '<div class="r"><span class="k">' + k + '</span><span class="val' + (cls ? ' ' + cls : '') + '">' + v + '</span></div>';
    h += '<div class="card info">' +
      r('מקור', esc(s.name === 'אתרים' ? (it.site || SH.hostOf(it.url) || 'אתר') : s.name)) +
      r('נשמר', SH.dateLong(it.ts) + ' · ' + SH.time(it.ts)) +
      (it.title && it.title !== SH.itemTitle(it) ? r('כותרת מקורית', esc(it.title)) : '') +
      (it.author ? r('יוצר', '<span class="ltr">' + esc(it.author) + '</span>') : '') +
      '<div class="r"><span class="k">קישור</span><span class="val url ltr">' + esc(String(it.url).replace(/^https?:\/\/(www\.)?/, '')) + '</span><button type="button" class="icon-btn" data-action="copy-link" data-id="' + esc(it.id) + '" aria-label="העתקת הקישור">' + icon('copy', 'sm') + '</button></div>' +
      '</div>';
    h += '<div class="actions4">' +
      '<button type="button" data-action="edit-item" data-id="' + esc(it.id) + '">' + icon('edit') + 'עריכה</button>' +
      '<button type="button" data-action="share-item" data-id="' + esc(it.id) + '">' + icon('share') + 'שיתוף</button>' +
      '<button type="button" data-action="move-item" data-id="' + esc(it.id) + '">' + icon('move') + 'העברה</button>' +
      '<button type="button" class="danger" data-action="delete-item" data-id="' + esc(it.id) + '">' + icon('trash') + 'מחיקה</button></div>';
    return h;
  };
})();
