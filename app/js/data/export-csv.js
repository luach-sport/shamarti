/* Export of all items to a table file (opens in Excel / Google Sheets). */
(function () {
  'use strict';
  const SH = window.SH;
  const cell = (v) => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

  SH.exportCsv = async () => {
    const head = ['תאריך שמירה', 'שעה', 'התיאור שלי', 'כותרת מקורית', 'יוצר', 'קטגוריה', 'מקור', 'תגיות', 'מועדף', 'קישור'];
    const rows = SH.state.items.slice().sort((a, b) => b.ts - a.ts).map((it) => [
      SH.dateFull(it.ts), SH.time(it.ts), it.note, it.title, it.author, (SH.catById(it.cat) || {}).name || '',
      SH.sourceById(it.src).name, (it.tags || []).join(', '), it.fav ? 'כן' : '', it.url
    ]);
    const csv = '﻿' + [head].concat(rows).map((r) => r.map(cell).join(',')).join('\r\n');
    await SH.shareFile('שמרתי-' + SH.dateInput(Date.now()) + '.csv', csv, 'text/csv', 'ייצוא שמרתי');
  };
})();
