/* Bottom sheets (dialogs). Each sheet in js/sheets/ has: title(), render(), and optional init(), onClose(), full. */
(function () {
  'use strict';
  const SH = window.SH;
  const ui = SH.ui;
  const SHEETS = SH.SHEETS;

  SH.openSheet = (name, data) => {
    ui.sheet = { name, data: data || {} };
    if (SHEETS[name].init) SHEETS[name].init(ui.sheet.data);
    SH.renderSheet();
    const first = SH.$('#sheet-root [autofocus]');
    if (first) setTimeout(() => first.focus(), 80);
  };

  SH.closeSheet = () => {
    if (!ui.sheet) return;
    if (SHEETS[ui.sheet.name].onClose) SHEETS[ui.sheet.name].onClose();
    ui.sheet = null;
    SH.$('#sheet-root').innerHTML = '';
  };

  SH.renderSheet = () => {
    const root = SH.$('#sheet-root');
    if (!ui.sheet) { root.innerHTML = ''; return; }
    const def = SHEETS[ui.sheet.name];
    const body = def.render(ui.sheet.data);
    const prev = root.querySelector('.sheet');
    const st = prev ? prev.scrollTop : 0;
    const title = def.title(ui.sheet.data);
    root.innerHTML = '<div class="sheet-wrap"><div class="sheet-backdrop" data-action="close-sheet"></div>' +
      '<div class="sheet' + (def.full ? ' full' : '') + '" role="dialog" aria-modal="true" aria-label="' + SH.esc(title) + '">' +
      '<div class="grabber" aria-hidden="true"></div>' +
      '<div class="sheet-head"><button type="button" class="icon-btn" aria-label="סגירה" data-action="close-sheet">' + SH.icon('close') + '</button><h2>' + SH.esc(title) + '</h2></div>' +
      body + '</div></div>';
    if (prev) {
      const s = root.querySelector('.sheet');
      if (s) { s.style.animation = 'none'; s.scrollTop = st; const b = root.querySelector('.sheet-backdrop'); if (b) b.style.animation = 'none'; }
    }
  };
  SH.sheetIs = (name) => !!ui.sheet && ui.sheet.name === name;

  // A list row that can be picked (used by several sheets).
  SH.pickRow = (action, v, label, on, extra) => '<button type="button" class="row" data-action="' + action + '" data-v="' + SH.esc(v) + '" aria-pressed="' + on + '">' + (extra || '') +
    '<span class="grow"><span class="t">' + SH.esc(label) + '</span></span>' + (on ? '<span class="check">' + SH.icon('check') + '</span>' : '') + '</button>';
})();
