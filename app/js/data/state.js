/* The app's data (SH.state) and what is on screen (SH.ui), with small lookups used everywhere. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.save = (now) => SH.saveState(SH.state, now);
  SH.itemById = (id) => SH.state.items.find((it) => it.id === id) || null;
  SH.catById = (id) => (id ? SH.state.cats.find((c) => c.id === id) || null : null);
  SH.countByCat = () => { const m = {}; SH.state.items.forEach((it) => { m[it.cat || ''] = (m[it.cat || ''] || 0) + 1; }); return m; };
  SH.countBySrc = (items) => { const m = {}; (items || SH.state.items).forEach((it) => { m[it.src] = (m[it.src] || 0) + 1; }); return m; };

  // A weekly backup reminder, once there is something worth keeping.
  SH.backupDue = () => {
    const s = SH.state.settings;
    if (!s.backupRemind || SH.state.items.length < 5) return false;
    const now = Date.now(), week = 7 * 864e5;
    if (s.backupSnooze > now) return false;
    return now - Math.max(s.lastBackup || 0, SH.state.createdAt || 0) > week;
  };

  SH.ui = {
    tab: 'home', stack: [], homeCat: 'all', limit: 60, catsEdit: false, clip: null, scroll: {},
    search: { q: '', src: 'all', cat: 'all', date: 'all', sort: 'new', fav: false, limit: 80 },
    sheet: null, form: {}
  };
  // The page shown on top of the tabs (an item, the search), if any.
  SH.view = () => SH.ui.stack[SH.ui.stack.length - 1] || null;
})();
