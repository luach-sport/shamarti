/* Home: search bar, "copied link" and backup banners, category chips and the grid. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;
  const sortNew = (a, b) => b.ts - a.ts;

  V.home = () => {
    const S = SH.state, ui = SH.ui;
    const total = S.items.length;
    let h = '<header class="top"><div class="brand">' + SH.logo(34) + '<h1 class="h1">שמרתי</h1></div>' + (total ? '<span class="count">' + SH.plural(total, 'שמירה אחת', 'שמירות') + '</span>' : '') + '</header>';
    if (total) {
      h += '<div class="searchrow"><button type="button" class="searchbar" data-action="open-search">' + icon('search', 'sm') + '<span>חיפוש בתיאורים, כותרות וקישורים</span></button>' +
        '<button type="button" class="icon-btn boxed" data-action="open-search" data-focus="filters" aria-label="סינון לפי מקור, קטגוריה ותאריך">' + icon('sliders', 'sm') + '</button></div>';
    }
    if (ui.clip) {
      const s = SH.sourceById(ui.clip.src);
      h += '<div class="banner"><span class="ic">' + icon('link', 'sm') + '</span><div class="txt"><div class="t">יש קישור' + (ui.clip.src !== 'web' ? ' מ-' + esc(s.name) : '') + ' בהעתקה</div><div class="s ltr" style="text-align:right">' + esc(ui.clip.url.replace(/^https?:\/\//, '')) + '</div></div>' +
        '<button type="button" class="go" data-action="save-clip">שמירה</button><button type="button" class="x" data-action="dismiss-clip" aria-label="לא עכשיו">' + icon('close', 'sm') + '</button></div>';
    }
    if (SH.backupDue()) {
      h += '<div class="banner gray"><span class="ic">' + icon('shield', 'sm') + '</span><div class="txt"><div class="t">כדאי לגבות את השמירות</div><div class="s">' + (S.settings.lastBackup ? 'הגיבוי האחרון: ' + SH.dayLabel(S.settings.lastBackup) : 'עוד לא עשית גיבוי') + '</div></div>' +
        '<button type="button" class="go" data-action="export-backup">גיבוי</button><button type="button" class="x" data-action="snooze-backup" aria-label="אחר כך">' + icon('close', 'sm') + '</button></div>';
    }
    if (!total) return h + V.welcome();

    const counts = SH.countByCat();
    const cat = ui.homeCat;
    const chip = (id, label, n, color) => '<button type="button" class="chip" data-action="home-cat" data-id="' + esc(id) + '" aria-pressed="' + (cat === id) + '"' + (color ? ' style="' + SH.colorVars(color) + '"' : '') + '>' + esc(label) + '<span class="n">' + SH.fmt(n) + '</span></button>';
    h += '<div class="chips scroll" role="group" aria-label="קטגוריות">' + chip('all', 'הכל', total);
    S.cats.forEach((c) => { if (counts[c.id]) h += chip(c.id, c.name, counts[c.id]); });
    if (counts['']) h += chip('none', 'בלי קטגוריה', counts['']);
    h += '</div>';

    let list = S.items.slice().sort(sortNew);
    if (cat === 'none') list = list.filter((it) => !it.cat);
    else if (cat !== 'all') list = list.filter((it) => it.cat === cat);
    const c = SH.catById(cat);
    h += '<div class="sec-head"><h2>' + (c ? esc(c.name) : cat === 'none' ? 'בלי קטגוריה' : 'נשמרו לאחרונה') + '</h2><span>' + (c || cat === 'none' ? SH.plural(list.length, 'שמירה אחת', 'שמירות') : 'לפי תאריך שמירה') + '</span></div>';
    if (!list.length) return h + '<div class="empty boxed">' + icon('folder', 'lg') + '<span>אין עדיין שמירות בקטגוריה הזו</span></div>';
    h += V.masonry(list.slice(0, ui.limit));
    if (list.length > ui.limit) h += '<button type="button" class="btn secondary small more" data-action="more">עוד ' + SH.fmt(Math.min(60, list.length - ui.limit)) + ' שמירות</button>';
    return h;
  };
  V.welcome = () => '<div class="card welcome">' + SH.logo(64) + '<h2>כאן יישמר כל מה ששווה לזכור</h2>' +
    '<p>סרטונים מטיקטוק ואינסטגרם, יוטיוב, אתרים וכל קישור. עם תמונה, תיאור שלך וקטגוריה, כדי שתמצא את זה גם בעוד שנים.</p>' +
    '<div class="ways">' +
    '<div class="way"><span class="tile">' + icon('share') + '</span><div><b>שיתוף ← שמרתי</b><span>בטיקטוק, באינסטגרם או ביוטיוב לוחצים "שיתוף" ובוחרים בשמרתי.</span></div></div>' +
    '<div class="way"><span class="tile">' + icon('clipboard') + '</span><div><b>העתקה והדבקה</b><span>מעתיקים קישור ונכנסים לכאן. האפליקציה תציע לשמור אותו.</span></div></div>' +
    '</div><button type="button" class="btn" data-action="new-save">' + icon('plus') + 'שמירה ראשונה</button></div>';
  V.fab = () => '<button type="button" class="fab" data-action="new-save">' + icon('plus') + 'שמירה</button>';
})();
