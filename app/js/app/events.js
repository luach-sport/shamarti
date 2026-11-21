/* Taps, typing and file choosers. Every button has data-action="name"; its function is SH.A[name] (js/actions/). */
(function () {
  'use strict';
  const SH = window.SH;
  const ui = SH.ui;

  function onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = SH.A[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    if (el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
    fn(el, e);
  }

  function onSaveFormInput(el, k) {
    if (k === 'tagInput' && /[,،]/.test(el.value)) {
      SH.addTag(el.value);
      SH.part('ftags', SH.tagChips());
      const t = SH.$('#tagin'); if (t) t.focus();
      return;
    }
    ui.form[k] = el.value;
    if (ui.sheet.name !== 'save' || k !== 'url') return;
    const f = ui.form;
    Object.assign(f, { err: '', srcManual: false, title: '', author: '', site: '' });
    if (!f.thumbManual) f.thumbData = '';
    if (f.editId) { const it = SH.itemById(f.editId); f.thumbPath = it && SH.urlKey(el.value) === it.key ? it.thumb : ''; }
    SH.previewSoon();
  }

  function onInput(e) {
    const el = e.target;
    if (el.dataset.search) {
      ui.search.q = el.value; ui.search.limit = 80;
      const w = SH.$('#qwrap'); if (w) w.classList.toggle('has-q', !!el.value);
      SH.searchSoon();
      return;
    }
    if (el.dataset.f && ui.sheet) onSaveFormInput(el, el.dataset.f);
  }

  function onChange(e) {
    const el = e.target;
    if (el.dataset.f === 'src' && SH.sheetIs('save')) { ui.form.src = el.value; ui.form.srcManual = true; SH.refreshPreview(); return; }
    if (el.id === 'image-file') { SH.useChosenImage(el.files && el.files[0]); return; }
    if (el.id === 'import-file') { const file = el.files && el.files[0]; if (file) SH.readBackupFile(file); }
  }

  function onKey(e) {
    if (e.key === 'Escape' && ui.sheet) { SH.closeSheet(); return; }
    const el = e.target;
    if (e.key !== 'Enter' || !el) return;
    if (el.id === 'tagin') {
      e.preventDefault();
      if (el.value.trim()) { SH.addTag(el.value); SH.part('ftags', SH.tagChips()); const t = SH.$('#tagin'); if (t) t.focus(); }
    } else if (el.id === 'newcat') { e.preventDefault(); SH.A['add-cat-inline'](); }
    else if (el.dataset && el.dataset.search) { e.preventDefault(); el.blur(); }
  }

  SH.bindEvents = () => {
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey);
    SH.thumbs.watchErrors();
  };
})();
