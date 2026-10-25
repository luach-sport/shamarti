/* Restore from a backup file: add to what's here, or replace everything. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;

  SH.SHEETS.importConfirm = {
    title: () => 'שחזור מגיבוי',
    render: (d) => '<div class="notice gray">' + icon('info', 'sm') + '<span class="grow">בגיבוי: ' + SH.plural(d.items, 'שמירה אחת', 'שמירות') + ', ' + SH.plural(d.thumbs, 'תמונה אחת', 'תמונות') + (d.at ? ', ' + esc(SH.whenWith('מ', d.at)) : '') + '. כרגע באפליקציה: ' + SH.plural(SH.state.items.length, 'שמירה אחת', 'שמירות') + '.</span></div>' +
      '<button type="button" class="btn" data-action="confirm-import" data-mode="merge">' + icon('plus') + 'להוסיף למה שיש</button>' +
      '<p class="fine" style="margin-top:-8px;text-align:center">שמירות שכבר קיימות לא יוכפלו.</p>' +
      '<button type="button" class="btn secondary" data-action="confirm-import" data-mode="replace">' + icon('refresh') + 'להחליף הכל בגיבוי</button>' +
      '<button type="button" class="btn ghost" data-action="close-sheet">ביטול</button>'
  };
})();
