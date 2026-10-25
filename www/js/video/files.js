/* A downloaded video: share it as a file, copy it to the gallery (Movies/Shamarti), delete it, check it still exists. */
(function () {
  'use strict';
  const SH = window.SH;
  const V = (SH.videoFiles = {});
  const GALLERY_DIR = 'Movies/Shamarti';

  V.fileName = (it) => 'שמרתי - ' + SH.safeName(SH.itemTitle(it), 40) + ' - ' + it.id.slice(-4) + '.mp4';

  // Share menu with the video file itself (WhatsApp, Drive…). The file is copied to the cache folder first,
  // because Android only shares files from there.
  V.share = async (it) => {
    if (!it || !it.video) return false;
    if (!SH.isNative()) {
      const a = document.createElement('a');
      a.href = SH.fs.src(it.video.path); a.download = V.fileName(it);
      document.body.appendChild(a); a.click(); a.remove();
      return true;
    }
    const name = 'share/' + V.fileName(it);
    try {
      try { await SH.callRaw('Filesystem', 'deleteFile', { path: name, directory: 'CACHE' }); } catch (e) { /* not there */ }
      await SH.fs.mkdir('share', 'CACHE');
      await SH.callRaw('Filesystem', 'copy', { from: SH.fs.full(it.video.path), directory: 'DATA', to: name, toDirectory: 'CACHE' });
      const r = await SH.callRaw('Filesystem', 'getUri', { path: name, directory: 'CACHE' });
      await SH.callRaw('Share', 'share', { title: SH.itemTitle(it), files: [r.uri], dialogTitle: 'שיתוף הסרטון' });
      return true;
    } catch (e) {
      const msg = String(e && (e.message || e));
      if (/cancel/i.test(msg)) return false;
      console.warn('share video', msg);
      SH.toast('לא הצלחתי לפתוח את השיתוף');
      return false;
    }
  };

  // Copies the video to the phone's gallery (Movies/Shamarti). Works on Android 11 and newer without asking.
  V.toGallery = async (it) => {
    if (!it || !it.video || !SH.isNative()) return false;
    const to = GALLERY_DIR + '/' + V.fileName(it);
    try {
      await SH.fs.mkdir(GALLERY_DIR, 'EXTERNAL_STORAGE');
      await SH.callRaw('Filesystem', 'copy', { from: SH.fs.full(it.video.path), directory: 'DATA', to, toDirectory: 'EXTERNAL_STORAGE' });
      it.video.gallery = to;
      it.upd = Date.now();
      await SH.save(true);
      return true;
    } catch (e) {
      console.warn('gallery', e && (e.message || e));
      return false;
    }
  };

  V.remove = async (it) => {
    if (!it || !it.video) return;
    await SH.fs.remove(it.video.path);
    delete it.video;
    it.upd = Date.now();
    SH.save();
  };

  // A video file can disappear (cleaned by the phone, or a backup restored on another phone).
  V.check = async (it) => {
    if (!it || !it.video) return;
    const st = await SH.fs.stat(it.video.path);
    if (!st) { delete it.video; SH.save(); if (SH.onVideoChange) SH.onVideoChange(it.id); }
  };

  // Old copies left in the cache by earlier shares.
  V.cleanShareCache = async () => {
    if (!SH.isNative()) return;
    try { await SH.callRaw('Filesystem', 'rmdir', { path: 'share', directory: 'CACHE', recursive: true }); } catch (e) { /* nothing to clean */ }
  };
})();
