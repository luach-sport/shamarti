/* Settings actions: theme, switches, default category, backup / restore / Excel, sharing the app, updates. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const ui = SH.ui;

  A['set-theme'] = (el) => { SH.state.settings.theme = el.dataset.v; SH.save(); SH.applyTheme(); SH.render(true); };
  A['toggle-setting'] = (el) => {
    const k = el.dataset.k;
    SH.state.settings[k] = !SH.state.settings[k];
    if (k === 'clip' && !SH.state.settings.clip) ui.clip = null;
    SH.save(); SH.render(true);
    if (k === 'clip' && SH.state.settings.clip) SH.checkClipboard();
  };
  A['set-defcat'] = (el) => { SH.state.settings.defCat = el.dataset.v; SH.save(); SH.closeSheet(); SH.render(true); };

  A['export-backup'] = () => SH.exportBackup();
  A['import-backup'] = () => { const i = SH.$('#import-file'); i.value = ''; i.click(); };
  A['confirm-import'] = (el) => SH.importBackup(ui.sheet.data.doc, el.dataset.mode);
  A['export-csv'] = () => SH.exportCsv();

  A['share-app'] = () => SH.shareText('שמרתי – שומרים סרטונים מטיקטוק, אינסטגרם ויוטיוב וכל קישור, עם תיאור וקטגוריה. להורדה:\n' + SH.APK_URL, 'שיתוף שמרתי');
  A['check-update'] = async () => {
    const i = await SH.update.check(true);
    if (i) SH.openSheet('update'); else SH.toast(SH.update.error || 'יש לך את הגרסה האחרונה');
    SH.render(true);
  };
  A['update-now'] = () => SH.update.apply();
  A['update-later'] = () => { if (SH.update.info) SH.state.updateSeen = SH.update.info.build; SH.save(); SH.closeSheet(); };
})();
