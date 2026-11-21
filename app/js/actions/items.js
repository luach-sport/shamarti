/* Item actions: open the original, favourite, copy / share the link, move, delete, pictures. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const itemOf = (el) => SH.itemById(el.dataset.id);

  A['open-link'] = (el) => { const it = itemOf(el); if (it) SH.openExternal(it.url); };
  A['open-url'] = (el) => SH.openExternal(el.dataset.url);
  A['toggle-fav'] = (el) => {
    const it = itemOf(el);
    if (!it) return;
    it.fav = !it.fav; it.upd = Date.now(); SH.save(); SH.haptic();
    SH.toast(it.fav ? 'נוסף למועדפים' : 'הוסר מהמועדפים');
    SH.render(true);
  };
  A['edit-item'] = (el) => SH.openSheet('save', { editId: el.dataset.id });
  A['copy-link'] = async (el) => {
    const it = itemOf(el);
    if (!it) return;
    const ok = await SH.writeClipboard(it.url);
    if (ok) SH.state.clipSeen = it.url;
    SH.save();
    SH.toast(ok ? 'הקישור הועתק' : 'לא הצלחתי להעתיק');
  };
  A['share-item'] = (el) => SH.openSheet('share', { id: el.dataset.id });
  A['share-link'] = (el) => {
    const it = itemOf(el);
    if (!it) return;
    SH.closeSheet();
    const title = SH.itemTitle(it);
    SH.shareText((title && title !== SH.hostOf(it.url) ? title + '\n' : '') + it.url, 'שיתוף');
  };
  A['move-item'] = (el) => SH.openSheet('move', { id: el.dataset.id });
  A['do-move'] = (el) => {
    const it = itemOf(el);
    if (!it) return;
    it.cat = el.dataset.cat; it.upd = Date.now();
    if (it.cat) SH.state.lastCat = it.cat;
    SH.save(); SH.closeSheet();
    SH.toast(it.cat ? 'הועבר ל' + SH.catById(it.cat).name : 'הוסר מהקטגוריה');
    SH.render(true);
  };
  A['delete-item'] = (el) => SH.openSheet('deleteItem', { id: el.dataset.id });
  A['confirm-delete'] = (el) => {
    const it = itemOf(el);
    if (!it) { SH.closeSheet(); return; }
    SH.state.items = SH.state.items.filter((x) => x.id !== it.id);
    if (it.thumb) SH.thumbs.remove(it.thumb);
    if (it.video) SH.fs.remove(it.video.path);
    SH.save(); SH.closeSheet(); SH.toast('נמחק');
    const v = SH.view();
    if (v && v.name === 'item' && v.id === it.id) SH.popView(); else SH.render(true);
  };
  A['refetch-thumb'] = (el) => SH.refreshThumb(el.dataset.id);
  A['report-thumb'] = (el) => { const it = itemOf(el); if (it) SH.reportProblem('לא נמשכה תמונה לקישור', it, SH.thumbLogs[it.id]); };
})();
