/* The video section on the item page: download button → progress → player with share / gallery / delete,
   or a clear message when the video can't be downloaded. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;

  const btn = (action, it, ic, label, cls) => '<button type="button" class="' + (cls || 'btn secondary') + '" data-action="' + action + '" data-id="' + esc(it.id) + '">' + icon(ic) + label + '</button>';

  function progress(job) {
    const label = job.state === 'resolving' ? 'מחפש את קובץ הסרטון…' : 'מוריד את הסרטון… ' + (job.pct ? job.pct + '%' : SH.fileSize(job.bytes));
    return '<div class="card pad vcard"><div class="vhead">' + icon('download', 'sm') + '<span class="grow">' + label + '</span></div>' +
      '<div class="progress' + (job.pct ? '' : ' busy') + '"><span style="width:' + Math.max(6, job.pct || 0) + '%"></span></div></div>';
  }

  function player(it) {
    const v = it.video;
    const poster = SH.thumbs.src(it.thumb);
    const inGallery = !!v.gallery;
    return '<div class="card vcard">' +
      '<video class="player" controls playsinline preload="metadata"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' src="' + esc(SH.fs.src(v.path)) + '"></video>' +
      '<div class="vmeta">' + icon('phone', 'xs') + '<span>הסרטון שמור בטלפון · ' + esc(SH.fileSize(v.size)) + '</span></div>' +
      '<div class="vacts">' +
      btn('share-video-file', it, 'share', 'שיתוף כקובץ', 'vbtn') +
      (inGallery ? '<span class="vbtn done">' + icon('check') + 'בגלריה</span>' : btn('save-gallery', it, 'image', 'שמירה בגלריה', 'vbtn')) +
      btn('delete-video', it, 'trash', 'מחיקת הקובץ', 'vbtn danger') +
      '</div></div>';
  }

  function stopped(it, job) {
    const final = job.state === 'blocked';
    return '<div class="notice accent">' + icon(final ? 'lock' : 'alert', 'sm') + '<span class="grow">' + esc(SH.VIDEO_MSG[job.reason] || SH.VIDEO_MSG.failed) + '</span></div>' +
      '<div class="btn-row">' + (final ? '' : btn('download-video', it, 'refresh', 'לנסות שוב')) + btn('share-link', it, 'link', 'שיתוף כקישור') + '</div>' +
      (SH.dl.logs[it.id] && !final ? '<button type="button" class="btn ghost" data-action="report-video" data-id="' + esc(it.id) + '">לשלוח פרטים למפתח</button>' : '');
  }

  V.videoInner = (it) => {
    if (!it) return '';
    const job = SH.dl.jobs[it.id];
    if (job && (job.state === 'resolving' || job.state === 'downloading')) return progress(job);
    if (it.video) return player(it);
    if (job && (job.state === 'blocked' || job.state === 'error')) return stopped(it, job);
    if (SH.canDownload(it)) {
      return btn('download-video', it, 'download', 'הורדת הסרטון לטלפון') +
        '<p class="fine">אחרי ההורדה אפשר לצפות בלי אינטרנט, לשתף את הסרטון כקובץ ולשמור בגלריה. הסרטון יורד עם הסימן של טיקטוק ושם היוצר, כמו בשמירה של טיקטוק.</p>';
    }
    if (SH.isVideo(it)) return '<p class="fine">הורדה לטלפון עובדת כרגע לסרטוני טיקטוק. את הקישור אפשר לשתף תמיד.</p>';
    return '';
  };
  V.videoCard = (it) => '<div id="vcard" class="vwrap">' + V.videoInner(it) + '</div>';
})();
