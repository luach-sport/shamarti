/* Sheets for one item: move to another category, and "delete?" confirmation. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;

  SH.SHEETS.move = {
    title: () => 'העברה לקטגוריה',
    render: (d) => {
      const it = SH.itemById(d.id);
      if (!it) return '';
      const row = (id, name, color, ic) => '<button type="button" class="row" data-action="do-move" data-id="' + esc(it.id) + '" data-cat="' + esc(id) + '" aria-pressed="' + (it.cat === id) + '">' +
        '<span class="tile" style="' + SH.colorVars(color) + '">' + icon(ic) + '</span><span class="grow"><span class="t b">' + esc(name) + '</span></span>' +
        (it.cat === id ? '<span class="check">' + icon('check') + '</span>' : '') + '</button>';
      return '<div class="card list pick-list">' + SH.state.cats.map((c) => row(c.id, c.name, c.color, c.icon)).join('') + row('', 'בלי קטגוריה', 'gray', 'folder') + '</div>' +
        '<button type="button" class="dashed-btn" data-action="new-cat" data-for="' + esc(it.id) + '">' + icon('plus', 'sm') + 'קטגוריה חדשה</button>';
    }
  };

  SH.SHEETS.deleteItem = {
    title: () => 'למחוק את השמירה?',
    render: (d) => {
      const it = SH.itemById(d.id);
      const where = it ? (SH.sourceById(it.src).name === 'אתרים' ? 'האתר' : SH.sourceById(it.src).name) : '';
      return '<p class="fine" style="font-size:14px">' + (it ? '״' + esc(SH.itemTitle(it)) + '״ תימחק מהאפליקציה, כולל התיאור, התמונה' + (it.video ? ' והסרטון שהורדת' : '') + '. הסרטון עצמו לא נמחק מ-' + esc(where) + '.' : '') + '</p>' +
        '<button type="button" class="btn danger" data-action="confirm-delete" data-id="' + esc(d.id) + '">' + icon('trash') + 'כן, למחוק</button>' +
        '<button type="button" class="btn secondary" data-action="close-sheet">ביטול</button>';
    }
  };
})();
