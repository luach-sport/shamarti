/* Item page: big picture (opens the original app), what you wrote, category and tags, the video section,
   details (source, date, creator, link) and actions (edit, share, move, delete). */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;

  const back = '<button type="button" class="icon-btn" data-action="back" aria-label="חזרה">' + icon('back') + '</button>';

  function topBar(it) {
    return '<div class="bar-top">' + back + '<span class="grow"></span>' +
      '<button type="button" class="icon-btn' + (it.fav ? ' on' : '') + '" data-action="toggle-fav" data-id="' + esc(it.id) + '" aria-pressed="' + !!it.fav + '" aria-label="' + (it.fav ? 'הסרה מהמועדפים' : 'הוספה למועדפים') + '">' + icon('star', it.fav ? 'fill' : '') + '</button>' +
      '<button type="button" class="icon-btn" data-action="edit-item" data-id="' + esc(it.id) + '" aria-label="עריכה">' + icon('edit') + '</button></div>';
  }

  function hero(it, openLabel) {
    const img = SH.thumbImg(it);
    return '<button type="button" class="hero" data-action="open-link" data-id="' + esc(it.id) + '" aria-label="' + esc(openLabel) + '" style="aspect-ratio:1/' + Math.min(SH.ratio(it), 1.25).toFixed(3) + ';' + SH.colorVars(SH.itemColor(it)) + '">' +
      (img || (SH.isVideo(it) ? '' : '<span class="ph">' + icon(SH.itemGlyph(it)) + '</span>')) +
      (SH.isVideo(it) ? '<span class="playbig">' + icon('play') + '</span>' : '') +
      '<span class="badge">' + esc(SH.sourceLabel(SH.sourceById(it.src))) + '</span></button>';
  }

  // No picture yet: try again now, or send the technical details to the developer.
  function noPicture(it) {
    if (it.thumb || !SH.state.settings.thumbs) return '';
    const hasLog = SH.thumbLogs && SH.thumbLogs[it.id];
    const msg = SH.thumbGaveUp(it) ? 'לא מצאתי תמונה לקישור הזה.' : 'אין עדיין תמונה לשמירה הזו. היא תימשך לבד כשיש אינטרנט.';
    return '<div class="notice gray">' + icon('image', 'sm') + '<span class="grow">' + msg +
      '<br><button type="button" class="link" data-action="refetch-thumb" data-id="' + esc(it.id) + '">למשוך עכשיו</button>' +
      (hasLog ? ' · <button type="button" class="link" data-action="report-thumb" data-id="' + esc(it.id) + '">לשלוח פרטים למפתח</button>' : '') + '</span></div>';
  }

  function chips(it) {
    const c = SH.catById(it.cat);
    const cat = c
      ? '<button type="button" class="catchip" data-action="move-item" data-id="' + esc(it.id) + '" style="' + SH.colorVars(c.color) + '"><span class="dot"></span>' + esc(c.name) + '</button>'
      : '<button type="button" class="catchip" data-action="move-item" data-id="' + esc(it.id) + '" style="' + SH.colorVars('gray') + '">' + icon('folder', 'xs') + 'בלי קטגוריה</button>';
    return '<div class="chips">' + cat + (it.tags || []).map((t) => '<button type="button" class="tagchip plain" data-action="search-tag" data-tag="' + esc(t) + '">#' + esc(t) + '</button>').join('') + '</div>';
  }

  function details(it) {
    const s = SH.sourceById(it.src);
    const r = (k, v) => '<div class="r"><span class="k">' + k + '</span><span class="val">' + v + '</span></div>';
    return '<div class="card info">' +
      r('מקור', esc(s.name === 'אתרים' ? (it.site || SH.hostOf(it.url) || 'אתר') : s.name)) +
      r('נשמר', SH.dateLong(it.ts) + ' · ' + SH.time(it.ts)) +
      (it.title && it.title !== SH.itemTitle(it) ? r('כותרת מקורית', esc(it.title)) : '') +
      (it.author ? r('יוצר', '<span class="ltr">' + esc(it.author) + '</span>') : '') +
      '<div class="r"><span class="k">קישור</span><span class="val url ltr">' + esc(String(it.url).replace(/^https?:\/\/(www\.)?/, '')) + '</span>' +
      '<button type="button" class="icon-btn" data-action="copy-link" data-id="' + esc(it.id) + '" aria-label="העתקת הקישור">' + icon('copy', 'sm') + '</button></div></div>';
  }

  function actions(it) {
    const b = (action, ic, label, cls) => '<button type="button"' + (cls ? ' class="' + cls + '"' : '') + ' data-action="' + action + '" data-id="' + esc(it.id) + '">' + icon(ic) + label + '</button>';
    return '<div class="actions4">' + b('edit-item', 'edit', 'עריכה') + b('share-item', 'share', 'שיתוף') + b('move-item', 'move', 'העברה') + b('delete-item', 'trash', 'מחיקה', 'danger') + '</div>';
  }

  V.item = (it) => {
    if (!it) return '<div class="bar-top">' + back + '</div><div class="empty">השמירה הזו כבר לא קיימת</div>';
    const s = SH.sourceById(it.src);
    const rest = SH.itemRest(it);
    const openLabel = it.src === 'web' ? 'פתיחת האתר' : s.custom ? 'פתיחת הקישור' : 'פתיחה ב-' + s.name;
    return topBar(it) + hero(it, openLabel) + noPicture(it) +
      '<h1 class="item-h1">' + esc(SH.itemTitle(it)) + '</h1>' + (rest ? '<p class="item-note">' + esc(rest) + '</p>' : '') +
      chips(it) +
      '<button type="button" class="btn" data-action="open-link" data-id="' + esc(it.id) + '">' + icon('external') + esc(openLabel) + '</button>' +
      V.videoCard(it) + details(it) + actions(it);
  };
})();
