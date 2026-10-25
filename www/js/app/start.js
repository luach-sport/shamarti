/* Start-up: load the data, draw the first screen, and listen to the phone (back button, shares, coming back
   to the app, internet). Background work: missing pictures, waiting feedback, new versions. */
(function () {
  'use strict';
  const SH = window.SH;
  const ui = SH.ui;

  // Looks for a new version when the app opens; shows it once per version.
  async function autoUpdateCheck() {
    const info = await SH.update.check(false);
    if (info && info.build > (SH.state.updateSeen || 0) && !ui.sheet && !SH.view()) SH.openSheet('update');
  }
  function background() { SH.flushOutbox(); autoUpdateCheck(); SH.fillThumbs(); }

  function listenToPhone() {
    if (!SH.isNative()) return;
    SH.listen('App', 'backButton', SH.onBack);
    SH.listen('App', 'appUrlOpen', (d) => SH.handleShareUrl(d && d.url, false));
    SH.listen('App', 'appStateChange', (st) => {
      if (st && st.isActive) { SH.checkClipboard(); background(); } else SH.flushSave();
    });
    SH.listen('App', 'pause', () => SH.flushSave());
  }

  async function init() {
    SH.bindEvents();
    await SH.initNetwork();
    await SH.fs.init();
    SH.state = SH.normalize(await SH.loadState());
    SH.applyTheme();
    SH.watchSystemTheme();
    SH.render();
    listenToPhone();
    if (SH.isNative()) {
      const launch = await SH.call('App', 'getLaunchUrl');
      if (launch && launch.url) SH.handleShareUrl(launch.url, true);
    }
    window.addEventListener('focus', () => SH.checkClipboard());
    SH.onUpdate(() => {
      if (SH.sheetIs('update')) SH.renderSheet();
      else if (!ui.sheet && ui.tab === 'settings' && !SH.view()) SH.render(true);
    });
    SH.onNetwork((on) => {
      if (SH.sheetIs('save')) SH.refreshPreview(); else if (SH.sheetIs('feedback')) SH.renderSheet();
      if (on) background();
    });
    if (!ui.sheet) SH.checkClipboard();
    SH.videoFiles.cleanShareCache();
    background();
  }

  // Small test surface for automated checks.
  window.__shamarti = {
    get ui() { return ui; }, A: SH.A,
    normalize: SH.normalize, render: SH.render, openSheet: SH.openSheet, closeSheet: SH.closeSheet,
    handleShareUrl: SH.handleShareUrl, saveItem: SH.saveItem, importBackup: SH.importBackup, flushOutbox: SH.flushOutbox
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
