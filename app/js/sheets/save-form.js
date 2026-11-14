/* Save / edit sheet: the form (link, preview box, description, category, tags, favourite). */
(function () {
  'use strict';
  const SH = window.SH;
  const { esc, icon } = SH;
  const ui = SH.ui;

  function startCat() {
    const d = SH.state.settings.defCat;
    if (d === 'last') return SH.catById(SH.state.lastCat) ? SH.state.lastCat : '';
    return SH.catById(d) ? d : '';
  }

  function formFor(d) {
    const it = d.editId ? SH.itemById(d.editId) : null;
    if (it) {
      return {
        editId: it.id, url: it.url, src: it.src, srcManual: true, title: it.title, author: it.author, site: it.site,
        note: it.note, cat: it.cat, tags: it.tags.slice(), fav: it.fav, tagInput: '', newCat: null,
        pv: { state: it.thumb ? 'ok' : 'idle' }, thumbPath: it.thumb, tw: it.tw, th: it.th, thumbData: '', fromShare: false
      };
    }
    return {
      editId: '', url: d.url || '', src: d.url ? SH.detectSource(d.url) : 'web', srcManual: false, title: '', author: '', site: '',
      note: d.note || '', cat: startCat(), tags: [], fav: false, tagInput: '', newCat: null,
      pv: { state: 'idle' }, thumbPath: '', tw: 0, th: 0, thumbData: '', fromShare: !!d.fromShare
    };
  }

  function findDup() {
    const f = ui.form;
    const url = SH.findUrl(f.url);
    if (!url) return null;
    const keys = [SH.urlKey(url)];
    if (f.finalUrl) keys.push(SH.urlKey(f.finalUrl));
    return SH.state.items.find((it) => it.id !== f.editId && keys.includes(it.key)) || null;
  }
  SH.dupNotice = () => {
    const d = findDup();
    if (!d) return '';
    return '<div class="notice accent">' + icon('info', 'sm') + '<span class="grow">כבר שמרת את זה ' + esc(SH.whenWith('ב', d.ts)) + (d.cat && SH.catById(d.cat) ? ', בקטגוריה ' + esc(SH.catById(d.cat).name) : '') + '. אפשר לשמור שוב בכל זאת.' +
      '<br><button type="button" class="link" style="padding:0;margin-top:4px" data-action="open-dup" data-id="' + esc(d.id) + '">לפתוח את מה ששמרת ←</button></span></div>';
  };

  SH.catChips = () => {
    const f = ui.form;
    let h = SH.state.cats.map((c) => '<button type="button" class="chip accent" data-action="form-cat" data-id="' + esc(c.id) + '" aria-pressed="' + (f.cat === c.id) + '" style="' + SH.colorVars(c.color) + '"><span class="dot"></span>' + esc(c.name) + '</button>').join('');
    if (f.newCat != null) {
      h += '<div class="input-row" style="width:100%"><input id="newcat" class="input" placeholder="שם הקטגוריה" maxlength="40" data-f="newCat" value="' + esc(f.newCat) + '" enterkeyhint="done">' +
        '<button type="button" class="btn small" data-action="add-cat-inline">הוספה</button></div>';
    } else {
      h += '<button type="button" class="chip dashed" data-action="new-cat-inline">' + icon('plus', 'sm') + 'קטגוריה חדשה</button>';
    }
    return h;
  };

  SH.tagChips = () => {
    const f = ui.form;
    return f.tags.map((t, i) => '<span class="tagchip">#' + esc(t) + '<button type="button" data-action="remove-tag" data-i="' + i + '" aria-label="הסרת התגית ' + esc(t) + '">' + icon('close', 'xs') + '</button></span>').join('') +
      '<input id="tagin" class="input" style="flex:1;min-width:140px;min-height:44px" placeholder="תגית ואז Enter" data-f="tagInput" value="' + esc(f.tagInput) + '" enterkeyhint="done" autocomplete="off">';
  };
  SH.addTag = (raw) => {
    const f = ui.form;
    String(raw || '').split(/[,،\n]/).map((t) => t.replace(/^#+/, '').trim()).filter(Boolean).forEach((t) => {
      if (!f.tags.some((x) => x.toLowerCase() === t.toLowerCase()) && f.tags.length < 20) f.tags.push(t.slice(0, 40));
    });
    f.tagInput = '';
  };

  SH.SHEETS.save = {
    full: true,
    title: () => (ui.form.editId ? 'עריכת שמירה' : 'שמירה חדשה'),
    init: (d) => {
      ui.form = formFor(d);
      if (!ui.form.editId && ui.form.url) SH.startPreview();
    },
    onClose: () => SH.stopPreview(),
    render: () => {
      const f = ui.form;
      return '<div class="field"><label for="lnk">קישור</label><div class="input-row">' +
        '<input id="lnk" class="input ltr" style="text-align:left" type="url" inputmode="url" autocomplete="off" placeholder="https://" data-f="url" value="' + esc(f.url) + '"' + (f.url ? '' : ' autofocus') + '>' +
        '<button type="button" class="btn secondary small" data-action="paste-link">' + icon('clipboard', 'sm') + 'הדבקה</button></div>' +
        (f.err === 'url' ? '<span class="hint bad">צריך להדביק קישור</span>' : '') + '</div>' +
        '<div id="dup">' + SH.dupNotice() + '</div>' +
        '<div id="pv">' + SH.previewBox() + '</div>' +
        '<div class="field"><label for="note">התיאור שלי</label><textarea id="note" class="input" rows="3" data-f="note" placeholder="מה יש פה? למה שמרת? (למשל: פסטה בשמנת, לנסות בשבת)">' + esc(f.note) + '</textarea><span class="hint">החיפוש ימצא כל מילה שכתבת כאן</span></div>' +
        '<div class="field"><span class="label">קטגוריה</span><div class="chips" id="fcats">' + SH.catChips() + '</div></div>' +
        '<div class="field"><label for="tagin">תגיות (לא חובה)</label><div class="chips" id="ftags">' + SH.tagChips() + '</div></div>' +
        '<div class="card list"><div class="row"><span class="lead" style="color:var(--primary)">' + icon('star', f.fav ? 'fill' : '') + '</span><span class="grow"><span class="t">להוסיף למועדפים</span></span>' +
        '<button type="button" class="switch-hit" role="switch" aria-checked="' + !!f.fav + '" data-action="form-fav" aria-label="להוסיף למועדפים"><span class="switch"></span></button></div></div>' +
        (f.editId ? '' : '<div class="notice accent">' + icon('share', 'sm') + '<span class="grow">אפשר גם בלי להעתיק: בטיקטוק או באינסטגרם לוחצים <b>שיתוף ← שמרתי</b>, והמסך הזה נפתח לבד עם הקישור.</span></div>') +
        '<div class="sheet-foot"><button type="button" class="btn" data-action="save-item">' + icon('check') + (f.editId ? 'שמירת השינויים' : 'שמירה') + '</button></div>';
    }
  };
})();
