/* Save sheet actions: new save, paste, picture from the phone, fetch again, category / tags / favourite, save. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const ui = SH.ui;

  A['new-save'] = () => SH.openSheet('save', {});
  A['open-dup'] = (el) => { SH.stopPreview(); ui.sheet = null; SH.$('#sheet-root').innerHTML = ''; SH.pushView({ name: 'item', id: el.dataset.id }); };
  A['paste-link'] = async () => {
    const text = await SH.readClipboard();
    const url = SH.findUrl(text);
    if (!url) { SH.toast(text ? 'אין קישור במה שהעתקת' : 'הלוח ריק. קודם מעתיקים קישור'); return; }
    Object.assign(ui.form, { url, err: '', srcManual: false, thumbData: '', thumbManual: false, title: '', author: '' });
    SH.state.clipSeen = url; ui.clip = null;
    const l = SH.$('#lnk'); if (l) l.value = url;
    SH.startPreview();
  };
  A.refetch = () => { ui.form.thumbManual = false; ui.form.thumbData = ''; SH.startPreview(); };
  A['pick-image'] = () => { const i = SH.$('#image-file'); i.value = ''; i.click(); };
  A['form-fav'] = (el) => {
    ui.form.fav = !ui.form.fav;
    el.setAttribute('aria-checked', String(ui.form.fav));
    const star = el.parentElement.querySelector('.lead svg');
    if (star) star.classList.toggle('fill', ui.form.fav);
  };
  A['form-cat'] = (el) => {
    ui.form.cat = ui.form.cat === el.dataset.id ? '' : el.dataset.id;
    SH.part('fcats', SH.catChips());
    if (ui.form.pv.state !== 'loading') SH.part('pv', SH.previewBox());
  };
  A['new-cat-inline'] = () => { ui.form.newCat = ''; SH.part('fcats', SH.catChips()); const i = SH.$('#newcat'); if (i) i.focus(); };
  A['add-cat-inline'] = () => {
    const name = String(ui.form.newCat || '').trim();
    if (!name) { ui.form.newCat = null; SH.part('fcats', SH.catChips()); return; }
    let c = SH.state.cats.find((x) => x.name.trim() === name);
    if (!c) { c = { id: SH.uid(), name: name.slice(0, 40), color: SH.nextColor(), icon: 'folder' }; SH.state.cats.push(c); SH.save(); }
    ui.form.cat = c.id; ui.form.newCat = null;
    SH.part('fcats', SH.catChips());
  };
  A['remove-tag'] = (el) => { ui.form.tags.splice(+el.dataset.i, 1); SH.part('ftags', SH.tagChips()); };
  A['save-item'] = () => SH.saveItem();

  // A picture chosen from the phone (a screenshot) instead of the one from the link.
  SH.useChosenImage = (file) => {
    if (!file || !SH.sheetIs('save')) return;
    const url = URL.createObjectURL(file);
    SH.resizeImage(url, 900, 0.82).then((img) => {
      Object.assign(ui.form, { thumbData: img.data, tw: img.w, th: img.h, thumbManual: true, pv: { state: 'ok' } });
      SH.refreshPreview();
    }).catch(() => SH.toast('לא הצלחתי לפתוח את התמונה')).finally(() => URL.revokeObjectURL(url));
  };
})();
