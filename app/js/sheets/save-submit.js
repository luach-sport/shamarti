/* Save sheet: pressing "שמירה" – create or update the item, keep its picture, and go back to where you were.
   When the save came from another app's share menu, the app steps aside so you're back in TikTok. */
(function () {
  'use strict';
  const SH = window.SH;
  const ui = SH.ui;

  async function keepPicture(it, f) {
    if (!f.thumbData || !SH.state.settings.thumbs) return;
    try {
      const path = await SH.thumbs.save(it.id, f.thumbData);
      if (!path) return;
      if (it.thumb && it.thumb !== path) SH.thumbs.remove(it.thumb);
      Object.assign(it, { thumb: path, tw: f.tw, th: f.th });
    } catch (e) { console.warn('thumb save', e && e.message); }
  }

  SH.saveItem = async () => {
    const f = ui.form;
    if (f.tagInput) SH.addTag(f.tagInput);
    const raw = SH.findUrl(f.url);
    if (!raw) { f.err = 'url'; SH.renderSheet(); const l = SH.$('#lnk'); if (l) l.focus(); return; }
    const S = SH.state, now = Date.now();
    const old = f.editId ? SH.itemById(f.editId) : null;
    const id = old ? old.id : SH.uid();
    const url = SH.cleanUrl(f.finalUrl && !old ? f.finalUrl : raw);
    const it = old || { id, ts: now, thumb: '', tw: 0, th: 0 };
    Object.assign(it, {
      url, key: SH.urlKey(url), title: f.title || '', author: f.author || '', site: f.site || '',
      note: String(f.note || '').trim(), tags: f.tags.slice(), cat: SH.catById(f.cat) ? f.cat : '', src: f.src || SH.detectSource(url),
      fav: !!f.fav, upd: now
    });
    await keepPicture(it, f);
    if (f.pvLog) SH.thumbLogs[id] = f.pvLog;
    // A picture search already ran and found nothing: the background filler waits before trying again.
    if (!it.thumb && f.pvLog && f.pv.state !== 'loading') { it.thumbTries = (it.thumbTries || 0) + 1; it.thumbAt = now; }
    if (!old) S.items.unshift(it);
    if (it.cat) S.lastCat = it.cat;
    S.clipSeen = raw;
    if (ui.clip && SH.urlKey(ui.clip.url) === it.key) ui.clip = null;
    await SH.save(true);

    const pending = f.pv.state === 'loading' && f.job;
    const fromShare = f.fromShare;
    SH.stopPreview();
    ui.sheet = null; SH.$('#sheet-root').innerHTML = '';
    if (pending) SH.lateApply(id, f.job);
    SH.haptic();
    if (old) { SH.toast('השינויים נשמרו'); SH.render(true); return; }
    SH.toast(fromShare ? 'נשמר בשמרתי ✓' : 'נשמר');
    if (!SH.view()) { ui.tab = 'home'; if (ui.homeCat !== 'all' && ui.homeCat !== it.cat) ui.homeCat = 'all'; }
    SH.render();
    if (fromShare && SH.isNative()) setTimeout(() => SH.call('App', 'minimizeApp'), 1100);
  };
})();
