/* Checks and repairs saved data (from the phone or a backup file) so the app never breaks on odd values. */
(function () {
  'use strict';
  const SH = window.SH;
  const { isObj, str } = SH;

  function settings(d, s) {
    if (!isObj(s)) return;
    if (['light', 'dark', 'system'].includes(s.theme)) d.settings.theme = s.theme;
    d.settings.clip = s.clip !== false;
    d.settings.thumbs = s.thumbs !== false;
    d.settings.backupRemind = s.backupRemind !== false;
    if (typeof s.defCat === 'string') d.settings.defCat = s.defCat;
    d.settings.lastBackup = +s.lastBackup || 0;
    d.settings.backupSnooze = +s.backupSnooze || 0;
  }
  const cat = (c) => ({ id: str(c.id, 40), name: str(c.name, 40), color: SH.PALETTE[c.color] ? c.color : 'gray', icon: SH.ICONS[c.icon] ? c.icon : 'folder' });
  const source = (s) => ({
    id: str(s.id, 40), name: str(s.name, 30), color: SH.PALETTE[s.color] ? s.color : 'gray', letter: str(s.letter || s.name, 1).toUpperCase(),
    domains: Array.isArray(s.domains) ? s.domains.map((x) => str(x, 80).toLowerCase()).filter(Boolean).slice(0, 5) : [], custom: true
  });
  const video = (v) => (isObj(v) && v.path ? { path: str(v.path, 200), size: +v.size || 0, at: +v.at || 0, gallery: str(v.gallery || '', 300) } : null);
  function item(it, catIds, srcIds) {
    const out = {
      id: str(it.id || SH.uid(), 40), url: str(it.url, 2000), title: str(it.title, 400), note: str(it.note, 6000),
      author: str(it.author, 100), site: str(it.site, 80),
      tags: Array.isArray(it.tags) ? it.tags.map((t) => str(t, 40)).filter(Boolean).slice(0, 20) : [],
      cat: catIds.has(it.cat) ? it.cat : '', src: srcIds.has(it.src) ? it.src : 'web', fav: !!it.fav,
      ts: +it.ts || Date.now(), upd: +it.upd || +it.ts || Date.now(),
      thumb: typeof it.thumb === 'string' ? str(it.thumb, 200) : '', tw: +it.tw || 0, th: +it.th || 0,
      thumbTries: +it.thumbTries || 0, thumbAt: +it.thumbAt || 0,
      key: str(it.key || SH.urlKey(it.url), 600)
    };
    const v = video(it.video);
    if (v) out.video = v;
    return out;
  }

  SH.normalize = (raw) => {
    const d = SH.defaults();
    if (!isObj(raw)) return d;
    d.createdAt = +raw.createdAt || d.createdAt;
    settings(d, raw.settings);
    if (Array.isArray(raw.cats)) d.cats = raw.cats.filter((c) => isObj(c) && c.id && c.name).map(cat);
    if (Array.isArray(raw.sources)) d.sources = raw.sources.filter((s) => isObj(s) && s.id && s.name).map(source);
    const catIds = new Set(d.cats.map((c) => c.id));
    const srcIds = new Set(SH.SOURCES.map((s) => s.id).concat(d.sources.map((s) => s.id)));
    if (Array.isArray(raw.items)) d.items = raw.items.filter((it) => isObj(it) && it.url).map((it) => item(it, catIds, srcIds));
    d.lastCat = catIds.has(raw.lastCat) ? raw.lastCat : '';
    d.clipSeen = str(raw.clipSeen, 2000);
    d.lastShare = isObj(raw.lastShare) ? { u: str(raw.lastShare.u, 3000), at: +raw.lastShare.at || 0 } : null;
    if (Array.isArray(raw.outbox)) d.outbox = raw.outbox.filter(isObj).slice(-30);
    if (isObj(raw.profile)) d.profile = { name: str(raw.profile.name, 60), email: str(raw.profile.email, 100) };
    d.updateSeen = +raw.updateSeen || 0;
    return d;
  };
})();
