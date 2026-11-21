/* Favourites tab. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;
  const sortNew = (a, b) => b.ts - a.ts;

  V.favs = () => {
    const list = SH.state.items.filter((it) => it.fav).sort(sortNew);
    let h = '<header class="top"><h1 class="h1">מועדפים</h1>' + (list.length ? '<span class="count">' + SH.plural(list.length, 'שמירה אחת', 'שמירות') + '</span>' : '') + '</header>';
    if (!list.length) return h + '<div class="empty boxed">' + icon('star', 'lg') + '<b>עוד אין מועדפים</b><span>בכל שמירה אפשר ללחוץ על הכוכב, והיא תופיע כאן.</span></div>';
    return h + V.masonry(list);
  };
})();
