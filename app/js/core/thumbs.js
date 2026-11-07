/* The picture of each saved item: a small JPEG in the app folder (thumbs/<id>-<n>.jpg). In a browser: localStorage. */
(function () {
  'use strict';
  const SH = window.SH;
  const LS = 'shamarti.thumb.';

  SH.thumbs = {
    src(rel) {
      if (!rel) return '';
      if (SH.isNative()) return SH.fs.src(rel);
      try { return localStorage.getItem(LS + rel) || ''; } catch (e) { return ''; }
    },
    async save(id, base64) {
      const rel = 'thumbs/' + id + '-' + Date.now().toString(36) + '.jpg';
      if (SH.isNative()) {
        await SH.callRaw('Filesystem', 'writeFile', { path: SH.fs.full(rel), data: base64, directory: 'DATA', recursive: true });
        return rel;
      }
      try { localStorage.setItem(LS + rel, 'data:image/jpeg;base64,' + base64); } catch (e) { console.warn('thumb: storage full'); return ''; }
      return rel;
    },
    async read(rel) {
      if (!rel) return '';
      if (SH.isNative()) {
        try { const r = await SH.callRaw('Filesystem', 'readFile', { path: SH.fs.full(rel), directory: 'DATA' }); return (r && r.data) || ''; } catch (e) { return ''; }
      }
      try { return (localStorage.getItem(LS + rel) || '').replace(/^data:[^,]*,/, ''); } catch (e) { return ''; }
    },
    async remove(rel) {
      if (!rel) return;
      if (SH.isNative()) return SH.fs.remove(rel);
      try { localStorage.removeItem(LS + rel); } catch (e) { /* ignore */ }
    },
    // If the WebView cannot load a picture by its address, show it from the file's bytes instead.
    watchErrors() {
      document.addEventListener('error', (e) => {
        const img = e.target;
        if (!img || img.tagName !== 'IMG' || !img.dataset || !img.dataset.thumb || img.dataset.fb) return;
        img.dataset.fb = '1';
        SH.thumbs.read(img.dataset.thumb).then((b64) => {
          if (b64) img.src = 'data:image/jpeg;base64,' + b64; else img.style.display = 'none';
        });
      }, true);
    }
  };
})();
