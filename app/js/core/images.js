/* Pictures: recognise the file type from its first bytes and shrink it to a small JPEG. */
(function () {
  'use strict';
  const SH = window.SH;

  // Type of a base64 picture. HEIC (some TikTok covers) cannot be shown by the phone's WebView.
  SH.imageMime = (b64) => {
    const s = String(b64 || '');
    if (s.startsWith('/9j/')) return 'image/jpeg';
    if (s.startsWith('iVBOR')) return 'image/png';
    if (s.startsWith('UklGR')) return 'image/webp';
    if (s.startsWith('R0lGOD')) return 'image/gif';
    let head = '';
    try { head = atob(s.slice(0, 24)); } catch (e) { return ''; }
    if (head.slice(4, 8) === 'ftyp') {
      const brand = head.slice(8, 12);
      if (/^avi[fs]$/.test(brand)) return 'image/avif';
      if (/^(heic|heix|hevc|mif1|msf1)$/.test(brand)) return 'image/heic';
    }
    if (/^\s*</.test(head)) return 'text/html';
    return '';
  };

  // Shrinks a picture to at most `max` px on its long side and re-encodes it as JPEG (keeps backups small).
  SH.resizeImage = (src, max, quality) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w0 = img.naturalWidth, h0 = img.naturalHeight;
        if (!w0 || !h0) { reject(new Error('empty image')); return; }
        const k = Math.min(1, (max || 720) / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ data: cv.toDataURL('image/jpeg', quality || 0.82).replace(/^data:[^,]*,/, ''), w, h });
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = src;
  });
})();
