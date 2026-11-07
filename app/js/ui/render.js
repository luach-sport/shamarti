/* Drawing the current screen: a tab (home, categories, favourites, settings) or a page on top (item, search). */
(function () {
  'use strict';
  const SH = window.SH;
  const ui = SH.ui;

  const scrollKey = () => { const v = SH.view(); return v ? v.name + (v.id || '') : 'tab-' + ui.tab; };

  function screenHtml() {
    const V = SH.views, v = SH.view();
    if (v && v.name === 'item') return V.item(SH.itemById(v.id));
    if (v && v.name === 'search') return V.search();
    if (ui.tab === 'cats') return V.cats();
    if (ui.tab === 'favs') return V.favs();
    if (ui.tab === 'settings') return V.settings();
    return V.home();
  }

  // keepScroll: true = stay where you are, 'restore' = back to where this screen was left, else top.
  SH.render = (keepScroll) => {
    const main = SH.$('#screen');
    const v = SH.view();
    const prevKey = main.dataset.key;
    if (prevKey) ui.scroll[prevKey] = window.scrollY;
    document.body.classList.toggle('no-tabs', !!v);
    main.classList.toggle('pushed', !!v);
    main.innerHTML = screenHtml();
    const key = scrollKey();
    main.dataset.key = key;
    SH.$('#fab-root').innerHTML = !v && (ui.tab === 'home' || ui.tab === 'favs') && SH.state.items.length ? SH.views.fab() : '';
    document.querySelectorAll('#tabs button[data-tab]').forEach((b) => {
      if (b.getAttribute('data-tab') === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (keepScroll === true && prevKey === key) window.scrollTo(0, ui.scroll[key] || 0);
    else if (keepScroll === 'restore') window.scrollTo(0, ui.scroll[key] || 0);
    else window.scrollTo(0, 0);
    if (v && v.name === 'item' && SH.onItemShown) SH.onItemShown(v.id);
  };

  SH.rerenderAll = () => { if (ui.sheet) SH.renderSheet(); SH.render(true); };
  SH.pushView = (v) => { ui.scroll[scrollKey()] = window.scrollY; ui.stack.push(v); SH.render(); };
  SH.popView = () => { ui.stack.pop(); SH.render('restore'); };
  // Replaces just one part of the screen (keeps typing focus and scroll).
  SH.part = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
})();
