/* Pictures that are still missing are fetched in the background when there's internet
   (a few tries per item, spaced out), and on request from the item page. */
(function () {
  'use strict';
  const SH = window.SH;
  SH.thumbLogs = {}; // last technical log per item, for "send details to the developer"
  let running = false;
  const MAX_TRIES = 4, WAIT = 6 * 3600e3;
  SH.thumbGaveUp = (it) => !it.thumb && (it.thumbTries || 0) >= MAX_TRIES;

  // Redraws what's on screen without disturbing typing (search box) or an open sheet.
  SH.softRefresh = () => {
    if (SH.ui.sheet) return;
    const v = SH.view();
    if (v && v.name === 'search') { SH.part('s-res', SH.views.searchResults()); return; }
    SH.render(true);
  };

  async function fillOne(it) {
    const { p, img, log } = await SH.loadPreview(it.url, it.src);
    SH.thumbLogs[it.id] = log;
    const cur = SH.itemById(it.id);
    if (!cur) return false;
    cur.thumbTries = (cur.thumbTries || 0) + 1;
    cur.thumbAt = Date.now();
    if (p) {
      if (!cur.title && p.title) cur.title = p.title;
      if (!cur.author && p.author) cur.author = p.author;
      if (!cur.site && p.site) cur.site = p.site;
      SH.upgradeShortLink(cur, p.url);
    }
    if (img && !cur.thumb) { cur.thumb = await SH.thumbs.save(cur.id, img.data); cur.tw = img.w; cur.th = img.h; }
    cur.upd = Date.now();
    SH.save();
    return !!cur.thumb;
  }

  SH.fillThumbs = async () => {
    if (running || !SH.online() || !SH.state.settings.thumbs) return;
    running = true;
    try {
      const now = Date.now();
      const list = SH.state.items.filter((it) => !it.thumb && (it.thumbTries || 0) < MAX_TRIES && now - (it.thumbAt || 0) > WAIT).slice(0, 12);
      for (const it of list) {
        if (!SH.online()) break;
        if (await fillOne(it)) SH.softRefresh();
        await SH.sleep(1200);
      }
    } finally { running = false; }
  };

  SH.refreshThumb = async (id) => {
    const it = SH.itemById(id);
    if (!it) return;
    if (!SH.online()) { SH.toast('אין חיבור לאינטרנט'); return; }
    SH.toast('מושך תמונה…', 20000);
    const ok = await fillOne(it);
    SH.toast(ok ? 'התמונה נוספה' : 'עדיין אין תמונה. אפשר לשלוח את הפרטים למפתח', 3500);
    SH.softRefresh();
  };
})();
