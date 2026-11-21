/* Search: matching words (Hebrew-aware) and the filters (category, date, favourites). */
(function () {
  'use strict';
  const SH = window.SH;

  const DATES = { all: 'כל הזמנים', week: 'השבוע האחרון', month: 'החודש האחרון', year: 'השנה האחרונה', older: 'לפני יותר משנה' };
  const SORTS = { new: 'החדשים קודם', old: 'הישנים קודם', az: 'לפי א-ב' };
  SH.DATES = DATES; SH.SORTS = SORTS;
  SH.searchText = (it) => {
    if (it._sv !== it.upd) {
      const c = SH.catById(it.cat), s = SH.sourceById(it.src);
      it._s = SH.norm([it.note, it.title, it.author, (it.tags || []).join(' '), it.url, it.site, c ? c.name : '', s ? s.name : ''].join(' '));
      it._sv = it.upd;
    }
    return it._s;
  };
  // All search filters except the source, so the source chips can show their own counts.
  SH.searchBase = () => {
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
      if (words.length) { const t = SH.searchText(it); if (!words.every((w) => t.includes(w))) return false; }
      return true;
    });
  };
})();
