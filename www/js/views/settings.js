/* Settings tab: look, saving, backup, feedback, updates and the credit. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const V = SH.views;

  const sw = (key, label, sub, on, ic) => '<div class="row">' + (ic ? '<span class="lead">' + icon(ic) + '</span>' : '') + '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' +
    '<button type="button" class="switch-hit" role="switch" aria-checked="' + !!on + '" data-action="toggle-setting" data-k="' + key + '" aria-label="' + esc(label) + '"><span class="switch"></span></button></div>';
  const navRow = (action, ic, label, sub, value, extra) => '<button type="button" class="row" data-action="' + action + '"' + (extra || '') + '>' + (ic ? '<span class="lead' + (ic === 'upload' ? ' accent' : '') + '">' + icon(ic) + '</span>' : '') + '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' + (value ? '<span class="v">' + esc(value) + '</span>' : '') + '<span class="chev">' + icon('chevL', 'sm') + '</span></button>';
  V.settings = () => {
    const S = SH.state, st = S.settings;
    const themes = [{ v: 'light', l: 'בהיר' }, { v: 'dark', l: 'כהה' }, { v: 'system', l: 'לפי הטלפון' }];
    let h = '<header class="top"><h1 class="h1">הגדרות</h1></header>';
    h += '<span class="section-label">מראה</span><div class="seg" role="group" aria-label="מראה">' + themes.map((t) => '<button type="button" data-action="set-theme" data-v="' + t.v + '" aria-pressed="' + (st.theme === t.v) + '">' + t.l + '</button>').join('') + '</div>';
    h += '<span class="section-label">שמירה</span><div class="card list">' +
      sw('clip', 'זיהוי קישור שהעתקתי', 'כשנכנסים לאפליקציה עם קישור מועתק, היא מציעה לשמור אותו', st.clip) +
      sw('thumbs', 'שמירת תמונת הסרטון בטלפון', 'התמונה נשארת גם אם הסרטון יימחק מהרשת', st.thumbs) +
      navRow('open-sheet', '', 'קטגוריה לשמירה חדשה', '', st.defCat === 'last' ? 'האחרונה שבחרתי' : st.defCat === '' ? 'בלי' : ((SH.catById(st.defCat) || {}).name || 'בלי'), ' data-sheet="defCat"') +
      '</div>';
    h += '<span class="section-label">גיבוי ונתונים</span><div class="card list">' +
      navRow('export-backup', 'upload', 'גיבוי לקובץ', SH.plural(S.items.length, 'שמירה אחת', 'שמירות') + ' והתמונות. לשמור בדרייב, בוואטסאפ או במחשב' + (st.lastBackup ? ' · גיבוי אחרון: ' + SH.dayLabel(st.lastBackup) : '')) +
      navRow('import-backup', 'download', 'שחזור מגיבוי', 'בטלפון חדש, או כדי להחזיר שמירות') +
      sw('backupRemind', 'תזכורת לגבות כל שבוע', 'הודעה קטנה במסך הבית אם עבר שבוע בלי גיבוי', st.backupRemind, 'clock') +
      navRow('export-csv', 'table', 'ייצוא לאקסל', 'כל השמירות בטבלה') +
      '</div>';
    h += '<span class="section-label">כללי</span><div class="card list">' +
      navRow('open-sheet', 'message', 'פנייה / הצעת ייעול', 'מה להוסיף? מה לשפר? הפנייה מגיעה ישירות למפתח', '', ' data-sheet="feedback"') +
      V.updateRow() +
      navRow('share-app', 'share', 'שיתוף האפליקציה', 'לשלוח לחברים קישור להורדה') +
      '</div>';
    h += '<div class="credit">' + SH.logo(44) + '<span class="n">שמרתי · גרסה ' + esc(SH.VERSION.version) + (SH.VERSION.build && SH.VERSION.build !== 'dev' ? ' (בנייה ' + esc(SH.VERSION.build) + ')' : '') + '</span><span class="by">פותח על ידי <b>Itzko</b></span></div>';
    return h;
  };
  V.updateRow = () => {
    const U = SH.update;
    if (!SH.canSelfUpdate()) return '';
    if (U.info) return navRow('open-sheet', 'sparkle', 'יש גרסה חדשה: ' + U.info.version + ' (בנייה ' + U.info.build + ')', 'לחיצה לעדכון', '', ' data-sheet="update"');
    return navRow('check-update', 'refresh', U.state === 'checking' ? 'בודק…' : 'בדיקת עדכונים', 'אצלך גרסה ' + SH.VERSION.version + ' (בנייה ' + SH.VERSION.build + ')');
  };
})();
