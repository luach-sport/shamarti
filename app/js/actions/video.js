/* Video actions: download, download-and-share, share the file, save to gallery, delete the file, report a problem. */
(function () {
  'use strict';
  const SH = window.SH;
  const A = SH.A;
  const itemOf = (el) => SH.itemById(el.dataset.id);

  // Redraw only the video section of the open item page (progress updates often).
  SH.onVideoChange = (id) => {
    const v = SH.view();
    if (v && v.name === 'item' && v.id === id) SH.part('vcard', SH.views.videoInner(SH.itemById(id)));
  };
  // When an item page opens, check its video file is still on the phone.
  const checked = new Set();
  SH.onItemShown = (id) => {
    if (checked.has(id)) return;
    checked.add(id);
    const it = SH.itemById(id);
    if (it && it.video) SH.videoFiles.check(it);
  };

  async function download(id) {
    const ok = await SH.dl.start(id);
    if (ok) { SH.haptic(); SH.toast('הסרטון ירד לטלפון'); SH.softRefreshCards(); }
    return ok;
  }
  // The grid shows a small "downloaded" mark; redraw it only when the grid is on screen.
  SH.softRefreshCards = () => { if (!SH.view() && !SH.ui.sheet) SH.render(true); };

  A['download-video'] = (el) => download(el.dataset.id);
  A['download-share'] = async (el) => {
    const id = el.dataset.id;
    SH.closeSheet();
    if (await download(id)) SH.videoFiles.share(SH.itemById(id));
  };
  A['share-video-file'] = (el) => { SH.closeSheet(); SH.videoFiles.share(itemOf(el)); };
  A['save-gallery'] = async (el) => {
    const it = itemOf(el);
    const ok = await SH.videoFiles.toGallery(it);
    SH.toast(ok ? 'נשמר בגלריה, בתיקייה Shamarti' : 'לא הצלחתי לשמור בגלריה בטלפון הזה. אפשר "שיתוף כקובץ" ולשמור משם', ok ? 2600 : 4500);
    if (it) SH.onVideoChange(it.id);
  };
  A['delete-video'] = async (el) => {
    const it = itemOf(el);
    if (!it) return;
    await SH.videoFiles.remove(it);
    SH.toast('הקובץ נמחק מהטלפון. השמירה נשארת');
    SH.render(true);
  };
  A['report-video'] = (el) => { const it = itemOf(el); if (it) SH.reportProblem('הורדת סרטון לא הצליחה', it, SH.dl.logs[it.id]); };
})();
