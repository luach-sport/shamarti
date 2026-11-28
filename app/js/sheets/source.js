/* New / edit source (an app or website you save from): name, its web address, colour. */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const ui = SH.ui;

  SH.SHEETS.source = {
    title: (d) => (d.id ? 'עריכת מקור' : 'מקור חדש'),
    init: (d) => {
      const s = d.id ? SH.state.sources.find((x) => x.id === d.id) : null;
      ui.form = s ? { name: s.name, domain: (s.domains || []).join(', '), color: s.color } : { name: '', domain: '', color: 'teal' };
    },
    render: (d) => {
      const f = ui.form;
      return '<p class="fine" style="font-size:14px">מקור הוא האפליקציה או האתר שממנו שמרת. כשתכתוב את הכתובת שלו, כל קישור משם יזוהה לבד.</p>' +
        '<div class="field"><label for="sname">שם</label><input id="sname" class="input" maxlength="30" data-f="name" value="' + esc(f.name) + '" placeholder="למשל: וואטסאפ, ynet, Spotify"' + (d.id ? '' : ' autofocus') + '>' + (f.err ? '<span class="hint bad">' + esc(f.err) + '</span>' : '') + '</div>' +
        '<div class="field"><label for="sdom">כתובת האתר (לא חובה)</label><input id="sdom" class="input ltr" style="text-align:left" inputmode="url" data-f="domain" value="' + esc(f.domain) + '" placeholder="ynet.co.il"><span class="hint">אפשר כמה, עם פסיק ביניהן</span></div>' +
        '<div class="field"><span class="label">צבע</span><div class="swatches">' + SH.CAT_COLORS.concat('ink').map((c) => '<button type="button" class="swatch" style="' + SH.colorVars(c) + '" data-action="src-color" data-v="' + c + '" aria-pressed="' + (f.color === c) + '" aria-label="צבע ' + c + '"></button>').join('') + '</div></div>' +
        '<button type="button" class="btn" data-action="save-source">' + icon('check') + (d.id ? 'שמירה' : 'הוספת המקור') + '</button>' +
        (d.id ? '<button type="button" class="btn ghost" style="color:var(--red-text)" data-action="delete-source">' + icon('trash') + 'מחיקת המקור</button>' : '');
    }
  };
})();
