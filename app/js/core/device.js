/* Clipboard, opening links in their own app, the Android share menu. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.readClipboard = async () => {
    if (SH.isNative()) {
      try { const r = await SH.callRaw('Clipboard', 'read'); return (r && typeof r.value === 'string') ? r.value : ''; } catch (e) { return ''; }
    }
    try { return navigator.clipboard && navigator.clipboard.readText ? await navigator.clipboard.readText() : ''; } catch (e) { return ''; }
  };
  SH.writeClipboard = async (text) => {
    if (SH.isNative()) { try { await SH.callRaw('Clipboard', 'write', { string: text }); return true; } catch (e) { return false; } }
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
  };
  // Opens a link in its own app when installed (TikTok, Instagram, YouTube), otherwise in the browser.
  SH.openExternal = async (url) => {
    if (SH.isNative()) {
      try { await SH.callRaw('AppLauncher', 'openUrl', { url }); return true; } catch (e) { console.warn('openUrl', e && e.message); }
    }
    try { window.open(url, '_blank', 'noopener'); return true; } catch (e) { return false; }
  };
  SH.shareText = async (text, title) => {
    if (SH.isNative()) { try { await SH.callRaw('Share', 'share', { text, title, dialogTitle: title || 'שיתוף' }); return true; } catch (e) { return false; } }
    if (navigator.share) { try { await navigator.share({ text, title }); return true; } catch (e) { return false; } }
    const ok = await SH.writeClipboard(text);
    if (ok && SH.toast) SH.toast('הועתק ללוח');
    return ok;
  };
  // Writes a file to the cache and opens the share menu (Drive, WhatsApp, e-mail…). On the web: download.
  SH.shareFile = async (name, content, mime, title) => {
    if (SH.isNative()) {
      const w = await SH.call('Filesystem', 'writeFile', { path: name, data: content, directory: 'CACHE', encoding: 'utf8' });
      if (w && w.uri) {
        try { await SH.callRaw('Share', 'share', { title, files: [w.uri], dialogTitle: title }); return true; } catch (e) {
          try { await SH.callRaw('Share', 'share', { title, url: w.uri, dialogTitle: title }); return true; } catch (e2) { /* cancelled */ }
        }
      }
      return false;
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  };
})();
