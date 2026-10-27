// Example video covers for the screenshots, drawn in the browser: a colour gradient, one of the app's own
// icons drawn big, and a short caption like the text creators put on their videos.
// installCovers runs inside the app page (it is sent to the browser as is, so it uses nothing from here).
export function installCovers() {
  const wrap = (x, text, max) => {
    const lines = [];
    let line = '';
    String(text).split(' ').forEach((word) => {
      const next = line ? line + ' ' + word : word;
      if (line && x.measureText(next).width > max) { lines.push(line); line = word; } else line = next;
    });
    if (line) lines.push(line);
    return lines;
  };

  window.__cover = async ({ w, h, from, to, icon, text }) => {
    await document.fonts.load('800 40px Rubik');
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w * 0.5, h);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.10)';
    x.beginPath(); x.arc(w * 0.88, h * 0.1, Math.max(w, h) * 0.3, 0, 7); x.fill();
    x.fillStyle = 'rgba(0,0,0,0.12)';
    x.beginPath(); x.arc(w * 0.05, h * 1.02, Math.max(w, h) * 0.38, 0, 7); x.fill();

    const tall = h > w * 1.1;
    const inner = (window.SH.icon(icon).match(/<svg[^>]*>([\s\S]*)<\/svg>/) || [])[1] || '';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="480" height="480" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    const s = Math.min(w, h) * (tall ? 0.46 : 0.4);
    x.globalAlpha = 0.92;
    x.drawImage(img, (w - s) / 2, tall ? h * 0.2 : h * 0.12, s, s);
    x.globalAlpha = 1;

    if (text) {
      const size = Math.round(Math.min(w, h) * (tall ? 0.1 : 0.11));
      x.font = '800 ' + size + 'px Rubik';
      x.direction = 'rtl';
      x.textAlign = 'center';
      x.fillStyle = '#FFFFFF';
      x.shadowColor = 'rgba(0,0,0,0.45)';
      x.shadowBlur = size * 0.35;
      x.shadowOffsetY = size * 0.06;
      const lines = wrap(x, text, w * 0.84);
      const top = tall ? h * 0.66 : h * 0.72;
      lines.forEach((l, i) => x.fillText(l, w / 2, top + i * size * 1.18));
    }
    return c.toDataURL('image/jpeg', 0.84).split(',')[1];
  };

  // A two-second video of a picture, so the "downloaded video" player has something real to show.
  window.__clip = async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 270;
    c.height = 480;
    const x = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(15), { mimeType: 'video/webm' });
    const parts = [];
    rec.ondataavailable = (e) => parts.push(e.data);
    const done = new Promise((r) => { rec.onstop = r; });
    rec.start();
    const t0 = performance.now();
    while (performance.now() - t0 < 2200) {
      x.drawImage(img, 0, 0, c.width, c.height);
      await new Promise((r) => setTimeout(r, 60));
    }
    rec.stop();
    await done;
    return URL.createObjectURL(new Blob(parts, { type: 'video/webm' }));
  };
}
