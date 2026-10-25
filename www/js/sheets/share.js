/* Share sheet: as a link (always), or the video itself as a file (after it was downloaded). */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;

  const row = (action, it, ic, label, sub) => '<button type="button" class="row" data-action="' + action + '" data-id="' + esc(it.id) + '">' +
    '<span class="lead accent">' + icon(ic) + '</span><span class="grow"><span class="t b">' + esc(label) + '</span><span class="s">' + esc(sub) + '</span></span>' +
    '<span class="chev">' + icon('chevL', 'sm') + '</span></button>';

  SH.SHEETS.share = {
    title: () => 'שיתוף',
    render: (d) => {
      const it = SH.itemById(d.id);
      if (!it) return '';
      let h = '<div class="card list">' + row('share-link', it, 'link', 'שיתוף כקישור', 'הקישור, עם השורה הראשונה של התיאור שלך');
      if (it.video) h += row('share-video-file', it, 'film', 'שיתוף הסרטון כקובץ', 'הסרטון עצמו (' + SH.fileSize(it.video.size) + '), לוואטסאפ ולכל מקום');
      else if (SH.canDownload(it)) h += row('download-share', it, 'download', 'להוריד ולשתף כקובץ', 'הסרטון יורד לטלפון ואז נפתח השיתוף');
      h += '</div>';
      if (!it.video && !SH.canDownload(it) && SH.isVideo(it)) h += '<p class="fine">שיתוף כקובץ אפשרי אחרי הורדה, וההורדה עובדת כרגע לסרטוני טיקטוק.</p>';
      return h;
    }
  };
})();
