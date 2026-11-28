/* Search page actions: open, filter by source / category / date / order / favourites, clear, more results. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const ui = SH.ui;
  const fresh = (o) => Object.assign(ui.search, { q: '', src: 'all', cat: 'all', date: 'all', sort: 'new', fav: false, limit: 80 }, o || {});

  // Only the chips and results change, so typing in the search box is never interrupted.
  SH.refreshSearch = () => { SH.part('s-src', SH.views.searchChips()); SH.part('s-res', SH.views.searchResults()); };
  SH.searchSoon = SH.debounce(() => SH.refreshSearch(), 160);

  A['open-search'] = (el) => {
    fresh({ cat: ui.tab === 'home' && ui.homeCat !== 'all' ? ui.homeCat : 'all' });
    SH.pushView({ name: 'search' });
    if (el.dataset.focus !== 'filters') setTimeout(() => { const q = SH.$('#q'); if (q) q.focus(); }, 60);
  };
  A['open-source'] = (el) => { fresh({ src: el.dataset.id }); SH.pushView({ name: 'search' }); };
  A['search-tag'] = (el) => { fresh({ q: el.dataset.tag }); SH.pushView({ name: 'search' }); };
  A['search-src'] = (el) => { ui.search.src = el.dataset.id; ui.search.limit = 80; SH.refreshSearch(); };
  A['search-clear'] = () => {
    ui.search.q = '';
    const q = SH.$('#q'); if (q) { q.value = ''; q.focus(); }
    const w = SH.$('#qwrap'); if (w) w.classList.remove('has-q');
    SH.refreshSearch();
  };
  A['search-more'] = () => { ui.search.limit += 80; SH.part('s-res', SH.views.searchResults()); };
  A['search-fav'] = () => { ui.search.fav = !ui.search.fav; SH.render(true); };
  A['set-search-cat'] = (el) => { ui.search.cat = el.dataset.v; SH.closeSheet(); SH.render(true); };
  A['set-search-date'] = (el) => { ui.search.date = el.dataset.v; SH.closeSheet(); SH.render(true); };
  A['set-search-sort'] = (el) => { ui.search.sort = el.dataset.v; SH.closeSheet(); SH.render(true); };
})();
