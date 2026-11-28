/* Categories tab: the categories (sort and edit) and where items came from. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;

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
})();
