/* Category actions: new, edit (name / colour / icon), reorder, delete. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const ui = SH.ui;

  A['new-cat'] = (el) => SH.openSheet('cat', { forItem: el.dataset.for || '' });
  A['edit-cat'] = (el) => SH.openSheet('cat', { id: el.dataset.id });
  A['cat-color'] = (el) => { ui.form.color = el.dataset.v; SH.renderSheet(); };
  A['cat-icon'] = (el) => { ui.form.icon = el.dataset.v; SH.renderSheet(); };
  A['ask-delete-cat'] = () => { ui.form.confirmDel = true; SH.renderSheet(); };

  A['save-cat'] = () => {
    const d = ui.sheet.data, f = ui.form, name = String(f.name || '').trim();
    if (!name) { f.err = 'צריך לתת שם'; SH.renderSheet(); return; }
    if (SH.state.cats.some((c) => c.id !== d.id && c.name.trim() === name)) { f.err = 'כבר יש קטגוריה בשם הזה'; SH.renderSheet(); return; }
    let c = d.id ? SH.catById(d.id) : null;
    if (c) Object.assign(c, { name, color: f.color, icon: f.icon });
    else { c = { id: SH.uid(), name, color: f.color, icon: f.icon }; SH.state.cats.push(c); }
    SH.state.items.forEach((it) => { if (it.cat === c.id) it.upd = Date.now(); });
    if (d.forItem) {
      const it = SH.itemById(d.forItem);
      if (it) { it.cat = c.id; it.upd = Date.now(); SH.state.lastCat = c.id; }
    }
    SH.save(); SH.closeSheet();
    SH.toast(d.id ? 'נשמר' : 'הקטגוריה נוספה');
    SH.render(true);
  };

  A['delete-cat'] = () => {
    const id = ui.sheet.data.id;
    SH.state.cats = SH.state.cats.filter((c) => c.id !== id);
    SH.state.items.forEach((it) => { if (it.cat === id) { it.cat = ''; it.upd = Date.now(); } });
    if (SH.state.settings.defCat === id) SH.state.settings.defCat = 'last';
    if (ui.homeCat === id) ui.homeCat = 'all';
    SH.save(); SH.closeSheet(); SH.toast('הקטגוריה נמחקה'); SH.render(true);
  };

  function moveCat(id, delta) {
    const a = SH.state.cats, i = a.findIndex((c) => c.id === id), j = i + delta;
    if (i < 0 || j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    SH.save(); SH.render(true);
  }
  A['cat-up'] = (el) => moveCat(el.dataset.id, -1);
  A['cat-down'] = (el) => moveCat(el.dataset.id, 1);
})();
