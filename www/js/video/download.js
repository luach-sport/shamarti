/* Downloading a saved video to the phone (app folder), with progress shown on the item page.
   Today: TikTok videos and direct video links (.mp4 / .webm / .mov). */
(function () {
  'use strict';
  const SH = window.SH;
  const D = (SH.dl = { jobs: {}, logs: {} });
  const MIN_SIZE = 60 * 1024; // smaller than this is an error page, not a video

  SH.isDirectVideo = (url) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(url || ''));
  SH.canDownload = (it) => !!it && (it.src === 'tiktok' || SH.isDirectVideo(it.url));

  function update(id) {
    if (SH.onVideoChange) SH.onVideoChange(id);
  }

  async function sourcesFor(it, log) {
    if (SH.isDirectVideo(it.url)) return { sources: [{ url: it.url, headers: { 'User-Agent': SH.UA.mobile }, from: 'direct' }], reason: '' };
    return SH.tiktok.videoInfo(it.url, log);
  }

  async function tryDownload(job, s, rel, log) {
    job.state = 'downloading'; job.pct = 0; update(job.id);
    try {
      const st = await SH.fs.download(s.url, rel, s.headers, (bytes, total) => {
        job.bytes = bytes;
        job.pct = total > 0 ? Math.min(99, Math.round((bytes / total) * 100)) : 0;
        update(job.id);
      });
      const size = st ? +st.size || 0 : 0;
      SH.plog(log, 'download from ' + s.from + ': ' + SH.fileSize(size));
      if (size >= MIN_SIZE) return size;
    } catch (e) { SH.plog(log, 'download from ' + s.from + ' failed: ' + String(e && (e.message || e)).slice(0, 120)); }
    await SH.fs.remove(rel);
    return 0;
  }

  // Runs the whole download; result in it.video or D.jobs[id] (state 'error' / 'blocked' with a reason).
  D.start = async (id) => {
    const it = SH.itemById(id);
    if (!it || (D.jobs[id] && /resolving|downloading/.test(D.jobs[id].state))) return false;
    const job = (D.jobs[id] = { id, state: 'resolving', pct: 0, bytes: 0, reason: '' });
    const log = (D.logs[id] = []);
    update(id);
    if (!SH.online()) { Object.assign(job, { state: 'error', reason: 'offline' }); update(id); return false; }
    let info;
    try { info = await sourcesFor(it, log); } catch (e) { info = { sources: [], reason: 'failed' }; SH.plog(log, 'video info failed: ' + (e && e.message)); }
    if (!info.sources.length) {
      Object.assign(job, { state: SH.VIDEO_FINAL.includes(info.reason) ? 'blocked' : 'error', reason: info.reason || 'failed' });
      update(id);
      return false;
    }
    const rel = 'videos/' + id + '.mp4';
    await SH.fs.mkdir('videos');
    for (const s of info.sources) {
      const size = await tryDownload(job, s, rel, log);
      if (size) {
        const cur = SH.itemById(id);
        if (!cur) { await SH.fs.remove(rel); delete D.jobs[id]; return false; }
        cur.video = { path: rel, size, at: Date.now(), gallery: '' };
        cur.upd = Date.now();
        delete D.jobs[id];
        await SH.save(true);
        update(id);
        return true;
      }
    }
    Object.assign(job, { state: 'error', reason: 'failed' });
    update(id);
    return false;
  };
})();
