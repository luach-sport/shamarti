/* How a saved item is shown: its title, colour, icon, picture shape, and the picture box with its little badges. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;

  // The first line of what the user wrote is the title; else the original title; else the site.
  SH.itemTitle = (it) => {
    const first = String(it.note || '').split('\n').map((s) => s.trim()).find(Boolean);
    return first || it.title || SH.hostOf(it.url) || 'קישור';
  };
  SH.itemRest = (it) => {
    const lines = String(it.note || '').split('\n');
    const i = lines.findIndex((s) => s.trim());
    return i < 0 ? '' : lines.slice(i + 1).join('\n').trim();
  };
  SH.itemColor = (it) => {
    const c = SH.catById(it.cat);
    if (c) return c.color;
    const s = SH.sourceById(it.src);
    return s.color === 'ink' ? 'gray' : s.color;
  };
  SH.itemGlyph = (it) => { const c = SH.catById(it.cat); if (c) return c.icon; const s = SH.sourceById(it.src); return s.video ? 'play' : s.icon || 'link'; };
  SH.isVideo = (it) => !!SH.sourceById(it.src).video;
  // Height / width of the picture box (tall for TikTok and Reels).
  SH.ratio = (it) => {
    if (it.tw && it.th) return SH.clamp(it.th / it.tw, 0.56, 1.5);
    return SH.isTall(it) ? 1.33 : 0.62;
  };
  SH.thumbImg = (it) => {
    const src = SH.thumbs.src(it.thumb);
    return src ? '<img src="' + esc(src) + '" data-thumb="' + esc(it.thumb) + '" alt="" loading="lazy" decoding="async">' : '';
  };

  function inner(it, opts) {
    let h = SH.thumbImg(it) || '<span class="ph">' + icon(SH.itemGlyph(it)) + '</span>';
    if (opts.badges === false) return h;
    h += '<span class="badge src">' + esc(SH.sourceLabel(SH.sourceById(it.src))) + '</span>';
    if (SH.isVideo(it) && opts.play !== false) h += '<span class="badge play">' + icon('play') + '</span>';
    if (it.video) h += '<span class="badge dl" role="img" aria-label="הסרטון שמור בטלפון">' + icon('download') + '</span>';
    if (it.fav && opts.fav !== false) h += '<span class="fav" role="img" aria-label="מועדף">' + icon('star') + '</span>';
    return h;
  }
  SH.thumbHTML = (it, cls, style, opts) => '<span class="thumb' + (cls ? ' ' + cls : '') + '" style="' + SH.colorVars(SH.itemColor(it)) + (style ? ';' + style : '') + '">' + inner(it, opts || {}) + '</span>';
})();
