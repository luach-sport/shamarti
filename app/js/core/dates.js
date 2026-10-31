/* Dates in Hebrew: "היום", "אתמול", "4 בספטמבר", 24.10.26. */
(function () {
  'use strict';
  const SH = window.SH;

  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const p2 = (n) => String(n).padStart(2, '0');
  SH.dayStart = (d) => { d = new Date(d); d.setHours(0, 0, 0, 0); return d.getTime(); };
  SH.dateShort = (ts) => { const d = new Date(ts); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2); };
  SH.dateFull = (ts) => { const d = new Date(ts); return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(); };
  SH.dateInput = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  SH.time = (ts) => { const d = new Date(ts); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  SH.dateLong = (ts) => { const d = new Date(ts); return (d.getDay() === 6 ? 'שבת' : 'יום ' + DAYS[d.getDay()]) + ', ' + d.getDate() + ' ב' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  SH.dayLabel = (ts) => {
    const t = SH.dayStart(ts), today = SH.dayStart(Date.now());
    if (t === today) return 'היום';
    if (t === today - 864e5) return 'אתמול';
    const d = new Date(ts);
    return d.getDate() + ' ב' + MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
  };
  // "ב-4 בספטמבר" / "היום" / "אתמול" (prep is 'ב' or 'מ')
  SH.whenWith = (prep, ts) => {
    const l = SH.dayLabel(ts);
    if (l === 'היום' || l === 'אתמול') return prep === 'מ' ? 'מ' + l : l;
    return prep + '-' + l;
  };
})();
