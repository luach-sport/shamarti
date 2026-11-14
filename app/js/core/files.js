/* Files in the app's private folder: pictures (thumbs/) and downloaded videos (videos/).
   Paths given here are relative to that folder, e.g. "videos/abc.mp4". In a browser (testing) files live in memory. */
(function () {
  'use strict';
  const SH = window.SH;
  const F = (SH.fs = { base: 'shamarti', baseUri: '', web: {} });
  F.full = (rel) => F.base + '/' + rel;

  F.init = async () => {
    if (!SH.isNative()) return;
    await F.mkdir('thumbs');
    await F.mkdir('videos');
    try {
      const r = await SH.callRaw('Filesystem', 'getUri', { path: F.base, directory: 'DATA' });
      F.baseUri = (r && r.uri) || '';
    } catch (e) { console.warn('files: no folder address', e && e.message); }
  };

  F.mkdir = async (rel, directory) => {
    try { await SH.callRaw('Filesystem', 'mkdir', { path: directory ? rel : F.full(rel), directory: directory || 'DATA', recursive: true }); return true; } catch (e) { return false; }
  };
  F.stat = async (rel) => {
    if (!SH.isNative()) return F.web[rel] ? { size: F.web[rel].size } : null;
    try { return await SH.callRaw('Filesystem', 'stat', { path: F.full(rel), directory: 'DATA' }); } catch (e) { return null; }
  };
  F.remove = async (rel) => {
    if (!SH.isNative()) { if (F.web[rel]) { URL.revokeObjectURL(F.web[rel].url); delete F.web[rel]; } return; }
    try { await SH.callRaw('Filesystem', 'deleteFile', { path: F.full(rel), directory: 'DATA' }); } catch (e) { /* already gone */ }
  };
  // Address the WebView can load (a picture or a video) for a file in the app folder.
  F.src = (rel) => {
    if (!rel) return '';
    if (!SH.isNative()) return F.web[rel] ? F.web[rel].url : '';
    return F.baseUri ? F.webUrl(F.baseUri + '/' + rel) : '';
  };
  F.webUrl = (fileUri) => {
    const C = SH.capacitor();
    if (C && typeof C.convertFileSrc === 'function') {
      const u = C.convertFileSrc(fileUri);
      if (u && u !== fileUri) return u;
    }
    const base = window.WEBVIEW_SERVER_URL || (location.protocol + '//' + location.host);
    return base + String(fileUri).replace(/^file:\/\//, '/_capacitor_file_');
  };

  // Downloads a file straight to the app folder (not through memory). onProgress(bytes, total).
  F.download = async (url, rel, headers, onProgress) => {
    if (!SH.isNative()) {
      const res = await fetch(url);
      if (!res.ok) throw new Error('http ' + res.status);
      const blob = await res.blob();
      F.web[rel] = { url: URL.createObjectURL(blob), size: blob.size };
      if (onProgress) onProgress(blob.size, blob.size);
      return { size: blob.size };
    }
    let sub = null;
    const fsPlugin = SH.plugin('Filesystem');
    if (onProgress && fsPlugin) {
      try { sub = await fsPlugin.addListener('progress', (e) => { if (e && e.url === url) onProgress(+e.bytes || 0, +e.contentLength || 0); }); } catch (e) { sub = null; }
    }
    try {
      await SH.callRaw('Filesystem', 'downloadFile', {
        url, path: F.full(rel), directory: 'DATA', headers: headers || {}, progress: !!onProgress, connectTimeout: 20000, readTimeout: 60000
      });
      return await F.stat(rel);
    } finally {
      try { if (sub && sub.remove) await sub.remove(); } catch (e) { /* ignore */ }
    }
  };
})();
