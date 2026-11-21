/* Sharing the app with friends: a short personal message with the link to the app's site, or the app
   itself as an APK file (Bluetooth, WhatsApp, Nearby Share, file manager…).
   The APK file is the one installed on this phone, so it works without internet. If that copy can't be
   reached, the latest APK is downloaded from GitHub instead. */
(function () {
  'use strict';
  const SH = window.SH;
  const S = (SH.shareApp = {});
  const FILE = 'share/shamarti.apk';

  S.text = 'היי! אני משתמש באפליקציה שמרתי. שומרים בה סרטונים מטיקטוק, אינסטגרם ויוטיוב וכל קישור, עם תיאור וקטגוריה, ומוצאים הכל בקלות. אשמח מאוד לשתף אותך:';
  S.message = () => S.text + '\n' + SH.SITE_URL;

  S.link = () => SH.shareText(S.message(), 'שיתוף שמרתי');

  // Where Android installed this app: the line with base.apk in the process memory map.
  async function installedApk() {
    const r = await SH.callRaw('Filesystem', 'readFile', { path: '/proc/self/maps', encoding: 'utf8' });
    const m = String((r && r.data) || '').match(/(\/data\/app\/\S+?\/base\.apk)/);
    if (!m) throw new Error('no base.apk');
    return m[1];
  }

  async function prepareFile(onStatus) {
    try { await SH.callRaw('Filesystem', 'deleteFile', { path: FILE, directory: 'CACHE' }); } catch (e) { /* not there */ }
    await SH.fs.mkdir('share', 'CACHE');
    try {
      await SH.callRaw('Filesystem', 'copy', { from: await installedApk(), to: FILE, toDirectory: 'CACHE' });
    } catch (e) {
      console.warn('apk copy', e && (e.message || e));
      if (!SH.online()) throw new Error('offline');
      onStatus('מוריד את הקובץ…');
      await SH.callRaw('Filesystem', 'downloadFile', { url: SH.APK_URL, path: FILE, directory: 'CACHE', recursive: true });
    }
    const st = await SH.callRaw('Filesystem', 'stat', { path: FILE, directory: 'CACHE' });
    if (!st || st.size < 500000) throw new Error('small file');
    return (await SH.callRaw('Filesystem', 'getUri', { path: FILE, directory: 'CACHE' })).uri;
  }

  S.apk = async () => {
    if (!SH.isNative()) { window.open(SH.APK_URL, '_blank'); return true; }
    if (S.busy) return false;
    S.busy = true;
    SH.toast('מכין את הקובץ…', 8000);
    try {
      const uri = await prepareFile((t) => SH.toast(t, 30000));
      const t = SH.$('#toast-root'); if (t) t.innerHTML = '';
      await SH.callRaw('Share', 'share', { title: 'שמרתי', text: S.message(), files: [uri], dialogTitle: 'שליחת האפליקציה כקובץ' });
      return true;
    } catch (e) {
      const msg = String(e && (e.message || e));
      if (/cancel/i.test(msg)) return false;
      console.warn('share apk', msg);
      SH.toast(msg === 'offline' ? 'אין אינטרנט כרגע. אפשר לשלוח קישור לאתר במקום' : 'לא הצלחתי להכין את הקובץ. אפשר לשלוח קישור לאתר במקום', 4000);
      return false;
    } finally {
      S.busy = false;
    }
  };
})();
