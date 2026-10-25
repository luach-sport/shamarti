/* Moving around: tabs, back, opening items / categories / sources, sheets, home banners. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const ui = SH.ui;

  A.tab = (el) => {
    SH.closeSheet();
    ui.stack = [];
    const t = el.dataset.tab;
    if (t === ui.tab && t === 'home') ui.homeCat = 'all';
    ui.tab = t; ui.catsEdit = false;
    SH.render();
  };
  A.back = () => SH.onBack();
  A['open-sheet'] = (el) => SH.openSheet(el.dataset.sheet);
  A['close-sheet'] = () => SH.closeSheet();
  A['open-item'] = (el) => { SH.closeSheet(); SH.pushView({ name: 'item', id: el.dataset.id }); };
  A['open-cat'] = (el) => { ui.stack = []; ui.tab = 'home'; ui.homeCat = el.dataset.id; ui.limit = 60; SH.render(); };
  A['home-cat'] = (el) => { ui.homeCat = el.dataset.id; ui.limit = 60; SH.render(); };
  A.more = () => { ui.limit += 60; SH.render(true); };
  A['toggle-cats-edit'] = () => { ui.catsEdit = !ui.catsEdit; SH.render(true); };

  // Home banners: a copied link, the weekly backup reminder.
  A['save-clip'] = () => {
    const c = ui.clip;
    if (!c) return;
    ui.clip = null; SH.state.clipSeen = c.url; SH.save();
    SH.openSheet('save', { url: c.url });
    SH.render(true);
  };
  A['dismiss-clip'] = () => { if (ui.clip) SH.state.clipSeen = ui.clip.url; ui.clip = null; SH.save(); SH.render(true); };
  A['snooze-backup'] = () => { SH.state.settings.backupSnooze = Date.now() + 3 * 864e5; SH.save(); SH.render(true); };

  // Android back button / the back arrow.
  SH.onBack = () => {
    if (ui.sheet) { SH.closeSheet(); return; }
    if (ui.stack.length) { SH.popView(); return; }
    if (ui.tab !== 'home') { ui.tab = 'home'; SH.render(); return; }
    if (ui.homeCat !== 'all') { ui.homeCat = 'all'; SH.render(); return; }
    SH.call('App', 'exitApp');
  };
})();
