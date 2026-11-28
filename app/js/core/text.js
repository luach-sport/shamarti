/* Hebrew-aware search text and highlighting of search words. */
(function () {
  'use strict';
  const SH = window.SH;

  // Hebrew-aware search text: lower case, no nikud or punctuation, final letters folded, spaces kept.
  const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  SH.norm = (s) => String(s || '')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[^a-z0-9א-ת]+/g, ' ')
    .replace(/יי+/g, 'י')
    .replace(/וו+/g, 'ו')
    .trim();
  // Highlights the words of a query inside plain text (returns safe HTML).
  SH.highlight = (text, q) => {
    const words = String(q || '').trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const t = String(text || '');
    if (!words.length) return SH.esc(t);
    const re = new RegExp('(' + words.join('|') + ')', 'gi');
    return t.split(re).map((part, i) => (i % 2 ? '<mark>' + SH.esc(part) + '</mark>' : SH.esc(part))).join('');
  };
})();
