/* Links that come in: from another app's share menu (TikTok → שיתוף → שמרתי), or a link the user copied. */
(function () {
  'use strict';
  const SH = window.SH;
  const ui = SH.ui;
  let lastHandled = { u: '', at: 0 };
  let clipBusy = false, clipAt = 0;

  // The Android side turns a share into shamarti://share?text=… (see scripts/patch-android.sh).
  SH.handleShareUrl = (u, isLaunch) => {
    if (!u || u.indexOf('shamarti://share') !== 0) return;
    const now = Date.now();
    if (lastHandled.u === u && now - lastHandled.at < 5000) return;
    // The launch link stays on the app after a reload; don't open it twice.
    const ls = SH.state.lastShare;
    if (isLaunch && ls && ls.u === u) return;
    lastHandled = { u, at: now };
    SH.state.lastShare = { u, at: now };
    SH.save();
    let text = '', subject = '';
    try {
      const x = new URL(u.replace('shamarti://', 'https://shamarti.local/'));
      text = x.searchParams.get('text') || '';
      subject = x.searchParams.get('subject') || '';
    } catch (e) { return; }
    const url = SH.findUrl(text) || SH.findUrl(subject);
    if (!url) { SH.toast('לא מצאתי קישור במה ששותף'); return; }
    if (ui.sheet) SH.closeSheet();
    SH.state.clipSeen = url;
    ui.clip = null;
    SH.openSheet('save', { url, fromShare: true });
  };

  // A copied link shows a "save it?" banner on the home screen (once per link).
  SH.checkClipboard = async () => {
    if (!SH.state.settings.clip || clipBusy || Date.now() - clipAt < 1500) return;
    clipBusy = true; clipAt = Date.now();
    try {
      await SH.sleep(350);
      const url = SH.findUrl(await SH.readClipboard());
      const onHome = !ui.sheet && !SH.view() && ui.tab === 'home';
      if (!url || url === SH.state.clipSeen) {
        if (ui.clip && ui.clip.url !== url) { ui.clip = null; if (onHome) SH.render(true); }
        return;
      }
      if (SH.state.items.some((it) => it.key === SH.urlKey(url))) return;
      if (ui.clip && ui.clip.url === url) return;
      ui.clip = { url, src: SH.detectSource(url) };
      if (onHome) SH.render(true);
    } finally { clipBusy = false; }
  };
})();
