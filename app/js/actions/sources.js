/* Source actions: add your own app / website as a source, edit, delete. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const ui = SH.ui;

  const cleanDomains = (text) => String(text || '').split(/[,\s]+/)
    .map((x) => x.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''))
    .filter((x) => /\./.test(x)).slice(0, 5);

  A['new-source'] = () => SH.openSheet('source', {});
  A['edit-source'] = (el) => SH.openSheet('source', { id: el.dataset.id });
  A['src-color'] = (el) => { ui.form.color = el.dataset.v; SH.renderSheet(); };

  A['save-source'] = () => {
    const d = ui.sheet.data, f = ui.form, name = String(f.name || '').trim();
    if (!name) { f.err = 'צריך לתת שם'; SH.renderSheet(); return; }
    const domains = cleanDomains(f.domain);
    const fields = { name: name.slice(0, 30), domains, color: f.color, letter: name.slice(0, 1).toUpperCase() };
    let s = d.id ? SH.state.sources.find((x) => x.id === d.id) : null;
    if (s) Object.assign(s, fields);
    else { s = Object.assign({ id: 'c' + SH.uid(), custom: true }, fields); SH.state.sources.push(s); }
    // Links already saved from this site now belong to it.
    let moved = 0;
    if (domains.length) SH.state.items.forEach((it) => { if (it.src === 'web' && SH.detectSource(it.url) === s.id) { it.src = s.id; it.upd = Date.now(); moved++; } });
    SH.save(); SH.closeSheet();
    const head = d.id ? 'נשמר' : 'המקור נוסף';
    SH.toast(moved ? head + '. ' + (moved === 1 ? 'שמירה אחת עברה אליו' : SH.fmt(moved) + ' שמירות עברו אליו') : head);
    SH.render(true);
  };

  A['delete-source'] = () => {
    const id = ui.sheet.data.id;
    SH.state.sources = SH.state.sources.filter((s) => s.id !== id);
    SH.state.items.forEach((it) => { if (it.src === id) { it.src = SH.detectSource(it.url); it.upd = Date.now(); } });
    SH.save(); SH.closeSheet(); SH.toast('המקור נמחק'); SH.render(true);
  };
})();
