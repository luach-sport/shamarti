/* The two-column grid of saved items (each card: picture, title, category, date). */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;

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
})();
