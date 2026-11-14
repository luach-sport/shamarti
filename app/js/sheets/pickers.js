/* Small choice lists: search by category / date / order, and the default category for new saves. */
(function () {
  'use strict';
  const SH = window.SH;
  const { icon } = SH;
  const ui = SH.ui;
  const tile = (c) => '<span class="tile" style="' + SH.colorVars(c.color) + '">' + icon(c.icon) + '</span>';

  SH.SHEETS.pickCat = {
    title: () => 'קטגוריה',
    render: () => {
      const q = ui.search;
      return '<div class="card list pick-list">' + SH.pickRow('set-search-cat', 'all', 'הכל', q.cat === 'all') +
        SH.state.cats.map((c) => SH.pickRow('set-search-cat', c.id, c.name, q.cat === c.id, tile(c))).join('') +
        SH.pickRow('set-search-cat', 'none', 'בלי קטגוריה', q.cat === 'none') + '</div>';
    }
  };
  SH.SHEETS.pickDate = {
    title: () => 'מתי שמרתי',
    render: () => '<div class="card list pick-list">' + Object.keys(SH.DATES).map((k) => SH.pickRow('set-search-date', k, SH.DATES[k], ui.search.date === k)).join('') + '</div>'
  };
  SH.SHEETS.pickSort = {
    title: () => 'סדר התוצאות',
    render: () => '<div class="card list pick-list">' + Object.keys(SH.SORTS).map((k) => SH.pickRow('set-search-sort', k, SH.SORTS[k], ui.search.sort === k)).join('') + '</div>'
  };
  SH.SHEETS.defCat = {
    title: () => 'קטגוריה לשמירה חדשה',
    render: () => {
      const d = SH.state.settings.defCat;
      return '<div class="card list pick-list">' + SH.pickRow('set-defcat', 'last', 'האחרונה שבחרתי', d === 'last') + SH.pickRow('set-defcat', '', 'בלי (בוחרים בכל פעם)', d === '') +
        SH.state.cats.map((c) => SH.pickRow('set-defcat', c.id, c.name, d === c.id, tile(c))).join('') + '</div>';
    }
  };
})();
