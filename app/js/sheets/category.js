/* New / edit category: name, colour, icon, and deleting it (its items stay, without a category). */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const ui = SH.ui;

  function deletePart(d) {
    const f = ui.form;
    const n = SH.state.items.filter((it) => it.cat === d.id).length;
    if (!f.confirmDel) return '<button type="button" class="btn ghost" style="color:var(--red-text)" data-action="ask-delete-cat">' + icon('trash') + 'מחיקת הקטגוריה</button>';
    const msg = n === 1 ? 'השמירה שבה תישאר באפליקציה, בלי קטגוריה.' : n ? 'ה-' + SH.fmt(n) + ' שמירות שבה יישארו באפליקציה, בלי קטגוריה.' : 'הקטגוריה ריקה.';
    return '<div class="notice accent">' + icon('alert', 'sm') + '<span class="grow">' + msg + '</span></div>' +
      '<button type="button" class="btn danger" data-action="delete-cat">' + icon('trash') + 'כן, למחוק את הקטגוריה</button>';
  }

  SH.SHEETS.cat = {
    title: (d) => (d.id ? 'עריכת קטגוריה' : 'קטגוריה חדשה'),
    init: (d) => {
      const c = d.id ? SH.catById(d.id) : null;
      ui.form = c ? { name: c.name, color: c.color, icon: c.icon, confirmDel: false } : { name: '', color: SH.nextColor(), icon: 'folder', confirmDel: false };
    },
    render: (d) => {
      const f = ui.form;
      return '<div class="field"><label for="cname">שם</label><input id="cname" class="input" maxlength="40" data-f="name" value="' + esc(f.name) + '" placeholder="למשל: מתכונים, שיעורים, לקנות"' + (d.id ? '' : ' autofocus') + '>' + (f.err ? '<span class="hint bad">' + esc(f.err) + '</span>' : '') + '</div>' +
        '<div class="field"><span class="label">צבע</span><div class="swatches">' + SH.CAT_COLORS.map((c) => '<button type="button" class="swatch" style="' + SH.colorVars(c) + '" data-action="cat-color" data-v="' + c + '" aria-pressed="' + (f.color === c) + '" aria-label="צבע ' + c + '"></button>').join('') + '</div></div>' +
        '<div class="field"><span class="label">סמל</span><div class="icon-grid" style="' + SH.colorVars(f.color) + '">' + SH.CAT_ICONS.map((ic) => '<button type="button" data-action="cat-icon" data-v="' + ic + '" aria-pressed="' + (f.icon === ic) + '" aria-label="סמל ' + ic + '">' + icon(ic) + '</button>').join('') + '</div></div>' +
        '<button type="button" class="btn" data-action="save-cat">' + icon('check') + (d.id ? 'שמירה' : 'הוספת הקטגוריה') + '</button>' +
        (d.id ? deletePart(d) : '');
    }
  };
})();
