/* Backup to a file (all items and their pictures) and restore from it: add to what's there, or replace everything.
   Downloaded videos are not in the backup (too big); they can be downloaded again. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.exportBackup = async () => {
    const S = SH.state;
    SH.toast('מכין גיבוי…', 20000);
    const thumbs = {};
    for (const it of S.items) {
      if (!it.thumb) continue;
      const data = await SH.thumbs.read(it.thumb);
      if (data) thumbs[it.thumb] = data;
    }
    const doc = { app: 'shamarti', v: 1, exportedAt: new Date().toISOString(), version: SH.VERSION.version, count: S.items.length, state: S, thumbs };
    SH.$('#toast-root').innerHTML = '';
    const ok = await SH.shareFile('שמרתי-גיבוי-' + SH.dateInput(Date.now()) + '.json', JSON.stringify(doc), 'application/json', 'גיבוי שמרתי');
    if (ok) { S.settings.lastBackup = Date.now(); S.settings.backupSnooze = 0; SH.save(); SH.render(true); }
  };

  async function writeThumb(it, thumbs) {
    const data = it.thumb && thumbs[it.thumb];
    if (!data) { it.thumb = ''; return; }
    try { it.thumb = await SH.thumbs.save(it.id, data); } catch (e) { it.thumb = ''; }
  }

  async function replaceAll(incoming, thumbs) {
    const S = SH.state;
    const old = S.items.map((it) => it.thumb).filter(Boolean);
    for (const it of incoming.items) await writeThumb(it, thumbs);
    incoming.outbox = S.outbox; incoming.updateSeen = S.updateSeen;
    SH.state = incoming;
    old.forEach((p) => SH.thumbs.remove(p));
  }

  // Categories with the same name are joined; items already here (same link) are skipped.
  async function merge(incoming, thumbs) {
    const S = SH.state;
    const catMap = {};
    incoming.cats.forEach((c) => {
      const same = S.cats.find((x) => x.id === c.id) || S.cats.find((x) => x.name.trim() === c.name.trim());
      if (same) catMap[c.id] = same.id; else { S.cats.push(c); catMap[c.id] = c.id; }
    });
    incoming.sources.forEach((s) => { if (!S.sources.some((x) => x.id === s.id)) S.sources.push(s); });
    const ids = new Set(S.items.map((it) => it.id)), keys = new Set(S.items.map((it) => it.key));
    let added = 0;
    for (const it of incoming.items) {
      if (ids.has(it.id) || keys.has(it.key)) continue;
      it.cat = it.cat ? catMap[it.cat] || '' : '';
      await writeThumb(it, thumbs);
      S.items.push(it); added++;
    }
    S.items.sort((a, b) => b.ts - a.ts);
    return added;
  }

  SH.importBackup = async (doc, mode) => {
    const incoming = SH.normalize(doc.state);
    const thumbs = SH.isObj(doc.thumbs) ? doc.thumbs : {};
    SH.toast('משחזר…', 30000);
    let added = 0;
    if (mode === 'replace') await replaceAll(incoming, thumbs); else added = await merge(incoming, thumbs);
    await SH.save(true);
    SH.applyTheme(); SH.closeSheet();
    SH.toast(mode === 'replace' ? 'השמירות שוחזרו' : (added ? 'נוספו ' + SH.plural(added, 'שמירה אחת', 'שמירות') : 'הכל כבר היה באפליקציה'));
    const ui = SH.ui;
    ui.stack = []; ui.tab = 'home'; ui.homeCat = 'all';
    SH.render();
  };

  // Reads a chosen backup file and asks how to restore it.
  SH.readBackupFile = (file) => {
    SH.toast('קורא את הגיבוי…', 20000);
    const reader = new FileReader();
    reader.onload = () => {
      SH.$('#toast-root').innerHTML = '';
      try {
        const d = JSON.parse(String(reader.result));
        if (!d || d.app !== 'shamarti' || !d.state) throw new Error('bad');
        SH.openSheet('importConfirm', { doc: d, items: (d.state.items || []).length, thumbs: Object.keys(d.thumbs || {}).length, at: Date.parse(d.exportedAt) || 0 });
      } catch (err) { SH.toast('הקובץ הזה אינו גיבוי של שמרתי'); }
    };
    reader.onerror = () => SH.toast('לא הצלחתי לקרוא את הקובץ');
    reader.readAsText(file);
  };
})();
