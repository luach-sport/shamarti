/* Save sheet: the preview box (picture, source, title, creator) and fetching it while the user types.
   If the user saves before the preview arrives, the result is written into the saved item afterwards. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const ui = SH.ui;
  let seq = 0;

  const STATUS = {
    loading: () => '<span class="status">מושך תמונה וכותרת…</span>',
    ok: (f) => '<span class="status ok">' + icon('check', 'xs') + (f.thumbManual ? 'צילום המסך שלך' : 'זוהה לבד') + '</span>',
    noimg: () => '<span class="status">נמצאה כותרת, בלי תמונה. אנסה שוב אחרי השמירה</span>',
    fail: () => '<span class="status">' + (SH.online() ? 'לא הצלחתי למשוך תמונה. אפשר לצרף צילום מסך, או לשמור ואנסה שוב אחר כך' : 'אין אינטרנט כרגע. התמונה תימשך לבד אחר כך') + '</span>',
    idle: () => ''
  };

  function thumbBox(f, url) {
    const fake = { src: f.src, cat: f.cat, url, tw: f.tw, th: f.th, thumb: f.thumbData ? '' : f.thumbPath, fav: false };
    const ratio = Math.max(0.75, Math.min(SH.ratio(fake), 1.45));
    const src = f.thumbData ? 'data:image/jpeg;base64,' + f.thumbData : SH.thumbs.src(f.thumbPath);
    return { src, html: '<span class="thumb" style="aspect-ratio:1/' + ratio.toFixed(3) + ';' + SH.colorVars(SH.itemColor(fake)) + '">' +
      (src ? '<img src="' + esc(src) + '" alt="">' : '<span class="ph">' + icon(SH.itemGlyph(fake)) + '</span>') +
      (f.pv.state === 'loading' ? '<span class="spin" aria-hidden="true"></span>' : '') + '</span>' };
  }

  SH.previewBox = () => {
    const f = ui.form;
    const url = SH.findUrl(f.url);
    if (!url) return '<div class="notice gray">' + icon('link', 'sm') + '<span class="grow">מדביקים קישור מטיקטוק, אינסטגרם, יוטיוב, פייסבוק או מכל אתר. התמונה והכותרת יופיעו כאן לבד.</span></div>';
    const t = thumbBox(f, url);
    const opts = SH.allSources().map((s) => '<option value="' + esc(s.id) + '"' + (s.id === f.src ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('');
    let info = '<label class="src-select"><span class="sr-only">מקור</span><select data-f="src">' + opts + '</select>' + icon('chevD') + '</label>' + (STATUS[f.pv.state] || STATUS.idle)(f);
    if (f.pv.state === 'loading' && !f.title) info += '<span class="skeleton" style="width:90%"></span><span class="skeleton" style="width:60%"></span>';
    if (f.title) info += '<span class="ttl">' + esc(f.title) + '</span>';
    if (f.author) info += '<span class="by ltr" style="text-align:right">' + esc(f.author) + '</span>';
    info += '<span class="acts"><button type="button" class="chip sm" data-action="pick-image">' + icon('camera', 'xs') + (t.src ? 'להחליף תמונה' : 'צילום מסך משלך') + '</button>' +
      (f.pv.state !== 'loading' && SH.online() && (f.editId || f.pv.state === 'fail' || f.pv.state === 'noimg') ? '<button type="button" class="chip sm" data-action="refetch">' + icon('refresh', 'xs') + 'למשוך שוב</button>' : '') + '</span>';
    return '<div class="card pv">' + t.html + '<div class="info">' + info + '</div></div>' +
      (SH.state.settings.thumbs ? '' : '<p class="fine">שמירת התמונות כבויה בהגדרות.</p>') +
      (t.src && SH.state.settings.thumbs ? '<p class="fine" style="display:flex;gap:6px;align-items:center">' + icon('image', 'xs') + 'התמונה נשמרת בטלפון, גם אם הסרטון יימחק</p>' : '');
  };

  SH.refreshPreview = () => { if (SH.sheetIs('save')) { SH.part('pv', SH.previewBox()); SH.part('dup', SH.dupNotice()); } };
  SH.stopPreview = () => { seq++; };

  SH.startPreview = () => {
    const f = ui.form;
    const url = SH.findUrl(f.url);
    const mine = ++seq;
    f.finalUrl = '';
    if (!url) { f.pv = { state: 'idle' }; SH.refreshPreview(); return; }
    if (!f.srcManual) f.src = SH.detectSource(url);
    if (!SH.online()) { f.pv = { state: 'fail' }; SH.refreshPreview(); return; }
    f.pv = { state: 'loading' };
    const job = SH.loadPreview(url, f.src);
    f.job = job;
    SH.refreshPreview();
    job.then(({ p, img, log }) => {
      if (mine !== seq || !SH.sheetIs('save')) return;
      f.pvLog = log;
      if (p) {
        f.title = p.title || f.title; f.author = p.author || f.author; f.site = p.site || f.site;
        if (p.url && p.url !== url) f.finalUrl = p.url;
      }
      if (img && !f.thumbManual) { f.thumbData = img.data; f.tw = img.w; f.th = img.h; }
      f.pv = { state: f.thumbData || f.thumbPath ? 'ok' : p && p.title ? 'noimg' : 'fail' };
      SH.refreshPreview();
    });
  };
  SH.previewSoon = SH.debounce(() => { if (SH.sheetIs('save')) SH.startPreview(); }, 700);

  SH.lateApply = async (id, job) => {
    const { p, img, log } = await job;
    const it = SH.itemById(id);
    if (!it) return;
    SH.thumbLogs[id] = log;
    if (p) {
      if (!it.title && p.title) it.title = p.title;
      if (!it.author && p.author) it.author = p.author;
      if (!it.site && p.site) it.site = p.site;
      SH.upgradeShortLink(it, p.url);
    }
    if (!it.thumb && img) { it.thumb = await SH.thumbs.save(it.id, img.data); it.tw = img.w; it.th = img.h; }
    if (!it.thumb) { it.thumbTries = (it.thumbTries || 0) + 1; it.thumbAt = Date.now(); }
    it.upd = Date.now();
    SH.save();
    SH.softRefresh();
  };
})();
