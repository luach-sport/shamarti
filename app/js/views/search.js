/* Search page: search box, source chips, filter buttons and the results list. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;
  const sortNew = (a, b) => b.ts - a.ts;

  V.searchChips = () => {
    const q = SH.ui.search, base = SH.searchBase(), counts = SH.countBySrc(base);
    const chip = (id, label, n) => '<button type="button" class="chip" data-action="search-src" data-id="' + esc(id) + '" aria-pressed="' + (q.src === id) + '">' + esc(label) + '<span class="n">' + SH.fmt(n) + '</span></button>';
    let h = chip('all', 'הכל', base.length);
    const all = SH.countBySrc();
    SH.allSources().forEach((s) => { if (all[s.id] || q.src === s.id) h += chip(s.id, s.name, counts[s.id] || 0); });
    return h;
  };
  V.searchResults = () => {
    const q = SH.ui.search;
    let list = SH.searchBase();
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
      '<div class="chips scroll" id="s-filters">' + btn('pickCat', cat, q.cat !== 'all') + btn('pickDate', q.date === 'all' ? 'תאריך: כל הזמנים' : SH.DATES[q.date], q.date !== 'all') + btn('pickSort', SH.SORTS[q.sort], q.sort !== 'new') +
      '<button type="button" class="chip sm' + (q.fav ? ' on' : '') + '" data-action="search-fav" aria-pressed="' + q.fav + '">' + icon('star', 'xs') + 'מועדפים</button></div>' +
      '<div id="s-res" style="display:flex;flex-direction:column;gap:12px">' + V.searchResults() + '</div>';
  };
})();
