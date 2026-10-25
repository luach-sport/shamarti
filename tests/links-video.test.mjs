// New in 1.1: TikTok picture chain (short link → oEmbed → TikWM → crawler), missing-picture filler,
// video download (ok / blocked / private / failed), share sheet, video section states.
import { createRequire } from 'node:module';
const require = createRequire(process.env.PW_FROM || '/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');
const OUT = process.env.SHOTS || 'tests/shots/';
const errors = [];
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'he-IL' })).newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/cap-runtime|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
const check = (cond, msg) => { if (!cond) errors.push('FAIL: ' + msg); else console.log('ok -', msg); };
await page.goto((process.env.APP_URL || 'http://127.0.0.1:8765/index.html'));
await page.waitForTimeout(500);

// ---------- fake internet ----------
await page.evaluate(() => {
  const SH = window.SH;
  const mk = (w, h, color) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = 'bold 80px sans-serif'; x.fillText('TT', 60, h / 2); return c.toDataURL('image/jpeg', 0.85).split(',')[1]; };
  const JPEG = mk(576, 1024, '#e0533d');
  const HEIC = btoa('\0\0\0\x18ftypheic\0\0\0\0mif1heic' + 'x'.repeat(40));
  window.__net = { calls: [], mode: {} };
  SH.online = () => true;
  SH.http = async (url, o = {}) => {
    const N = window.__net; N.calls.push(url.slice(0, 100) + (o.noRedirect ? ' [noredirect]' : '') + (o.headers && o.headers['User-Agent'] ? ' UA:' + o.headers['User-Agent'].slice(0, 12) : ''));
    const ok = (data, extra) => Object.assign({ ok: true, status: 200, url, data, type: '', headers: {} }, extra || {});
    const no = (s) => ({ ok: false, status: s || 404, url, data: '', type: '', headers: {} });
    if (url.startsWith('https://vm.tiktok.com/')) return o.noRedirect ? { ok: false, status: 301, url, data: '', type: 'text/html', headers: { location: 'https://www.tiktok.com/@cook.home/video/7429111122223333444?_r=1&_t=abc' } } : no(403);
    if (url.startsWith('https://www.tiktok.com/oembed')) {
      if (N.mode.oembed === 'fail') return no(403);
      return ok({ title: 'הפסטה הכי קלה #פסטה', author_url: 'https://www.tiktok.com/@cook.home', author_name: 'Cook', thumbnail_url: N.mode.heic ? 'https://p16.tiktokcdn.com/cover.heic' : 'https://p16.tiktokcdn.com/cover.jpeg' });
    }
    if (url.startsWith('https://www.tikwm.com/api/')) {
      if (N.mode.tikwm === 'private') return ok({ code: -1, msg: 'Video is private' });
      return ok({ code: 0, msg: 'success', data: { id: '7429111122223333444', title: 'הפסטה הכי קלה', cover: '/video/cover/7429.webp', origin_cover: 'https://www.tikwm.com/video/origin_cover/7429.jpg', play: '/video/media/play/7429.mp4', wmplay: '/video/media/wmplay/7429.mp4', author: { unique_id: 'cook.home' } } });
    }
    if (url.startsWith('https://www.tiktok.com/@')) {
      if (N.mode.page === 'blocked') return ok('<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">' + JSON.stringify({ __DEFAULT_SCOPE__: { 'webapp.video-detail': { statusCode: 0, itemInfo: { itemStruct: { id: '7429', author: { uniqueId: 'cook.home', downloadSetting: 3 }, video: { playAddr: 'https://v16.tiktokcdn.com/play.mp4' } } } } } }) + '</script></html>', { headers: { 'set-cookie': 'tt_chain_token=abc; Path=/; Expires=Wed, 21 Oct 2027 07:28:00 GMT, ttwid=xyz; Path=/' } });
      if (N.mode.page === 'private') return ok('<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">' + JSON.stringify({ __DEFAULT_SCOPE__: { 'webapp.video-detail': { statusCode: 10216 } } }) + '</script></html>');
      if (N.mode.page === 'og') return ok('<html><head><meta property="og:image" content="https://p16.tiktokcdn.com/og.jpeg"><meta property="og:description" content="תיאור מהדף"></head></html>');
      return ok('<html><body>Please wait…</body></html>'); // TikTok check page: no data
    }
    if (o.as === 'base64') {
      if (/\.heic/.test(url)) return ok(HEIC, { type: 'image/heic' });
      if (N.mode.images === 'fail' && /tiktokcdn/.test(url)) return no(403);
      return ok(JPEG, { type: 'image/jpeg' });
    }
    return no(404);
  };
  // fake downloads: a file of a given size, with progress
  window.__dl = { fail: new Set(), calls: [] };
  SH.fs.download = async (url, rel, headers, onProgress) => {
    window.__dl.calls.push({ url, cookie: headers && headers.Cookie, referer: headers && headers.Referer });
    if ([...window.__dl.fail].some((f) => url.includes(f))) throw new Error('HTTP 403');
    for (const p of [25, 60, 100]) { onProgress && onProgress(p * 20000, 2000000); await new Promise((r) => setTimeout(r, 40)); }
    const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const blob = new Blob([new Uint8Array(2000000)], { type: 'video/mp4' });
    SH.fs.web[rel] = { url: URL.createObjectURL(blob), size: blob.size };
    return { size: blob.size };
  };
});

// ---------- 1. TikTok short link → full address → oEmbed picture ----------
let r = await page.evaluate(async () => { const x = await window.SH.loadPreview('https://vm.tiktok.com/ZS8kQx2mP/', 'tiktok'); return { url: x.p && x.p.url, title: x.p && x.p.title, author: x.p && x.p.author, img: x.img && [x.img.w, x.img.h], log: x.log, calls: window.__net.calls.splice(0) }; });
check(r.url === 'https://www.tiktok.com/@cook.home/video/7429111122223333444', 'short link resolved to the full TikTok address');
check(r.img && r.img[1] > r.img[0], 'TikTok cover picture loaded (tall ' + JSON.stringify(r.img) + ')');
check(r.author === '@cook.home', 'creator found');
check(r.calls.some((c) => c.includes('[noredirect]') && c.includes('UA:facebookext')), 'short link asked as a crawler without following');
check(r.calls.some((c) => c.startsWith('https://www.tiktok.com/oembed') && c.includes('UA:Mozilla/5.0')), 'oEmbed asked with a browser User-Agent');
console.log('   log:', r.log.join(' | '));

// ---------- 2. oEmbed blocked → TikWM cover ----------
r = await page.evaluate(async () => { window.__net.mode = { oembed: 'fail' }; const x = await window.SH.loadPreview('https://www.tiktok.com/@cook.home/video/7429111122223333444', 'tiktok'); return { img: !!x.img, title: x.p && x.p.title, calls: window.__net.calls.splice(0) }; });
check(r.img && r.title === 'הפסטה הכי קלה', 'when oEmbed is blocked, the TikWM cover and title are used');
check(r.calls.some((c) => c.includes('tikwm.com/video/origin_cover/7429.jpg')), 'TikWM relative addresses made absolute');

// ---------- 3. HEIC cover → skipped, next picture used ----------
r = await page.evaluate(async () => { window.__net.mode = { heic: true }; const x = await window.SH.loadPreview('https://www.tiktok.com/@cook.home/video/7429111122223333444', 'tiktok'); return { img: !!x.img, log: x.log.filter((l) => /picture/.test(l)) }; });
check(r.img && r.log.some((l) => /heic/.test(l)), 'HEIC cover (cannot be shown) is skipped and another picture is used');

// ---------- 4. Everything blocked but the page tags (like WhatsApp) ----------
r = await page.evaluate(async () => { window.__net.mode = { oembed: 'fail', tikwm: 'private', page: 'og' }; const x = await window.SH.loadPreview('https://www.tiktok.com/@cook.home/video/7429111122223333444', 'tiktok'); return { img: !!x.img, calls: window.__net.calls.splice(0) }; });
check(r.img && r.calls.some((c) => c.includes('UA:WhatsApp')), 'falls back to the page tags read as WhatsApp');

// ---------- 5. Instagram: no page picture → embed page ----------
r = await page.evaluate(async () => {
  const SH = window.SH, old = SH.http;
  SH.http = async (url, o) => {
    if (url.includes('/embed/captioned/')) return { ok: true, status: 200, url, headers: {}, data: '<div class="UsernameText">coach.dana</div><img class="EmbeddedMediaImage" alt="" src="https://scontent.cdninstagram.com/v/abc.jpg?stp=1&amp;x=2"><div class="Caption"><a class="CaptionUsername">coach.dana</a>5 דקות לגב<br>כל בוקר<div class="CaptionComments"></div></div>' };
    if (url.includes('instagram.com/reel/')) return { ok: true, status: 200, url, headers: {}, data: '<html><head><title>Instagram</title></head></html>' };
    return old(url, o);
  };
  const x = await SH.loadPreview('https://www.instagram.com/reel/C9xyz12/', 'instagram');
  SH.http = old;
  return { img: !!x.img, title: x.p && x.p.title, author: x.p && x.p.author };
});
check(r.img && r.author === '@coach.dana' && /5 דקות לגב/.test(r.title), 'Instagram picture and caption from the embed page (' + r.title + ')');

// ---------- 6. Missing pictures are filled in the background ----------
r = await page.evaluate(async () => {
  window.__net.mode = {};
  const SH = window.SH, now = Date.now();
  const add = (o) => SH.state.items.push(Object.assign({ id: SH.uid(), ts: now, upd: now, tags: [], note: '', title: '', author: '', site: '', fav: false, cat: '', thumb: '', tw: 0, th: 0 }, o));
  add({ url: 'https://vm.tiktok.com/ZS8kQx2mP/', src: 'tiktok', note: 'מתכון פסטה', key: 'a' });
  add({ url: 'https://www.tiktok.com/@x/video/7429000000000000099', src: 'tiktok', note: 'נוסה כבר 4 פעמים', key: 'b', thumbTries: 4 });
  SH.save(true); SH.render();
  await SH.fillThumbs();
  return SH.state.items.map((it) => ({ note: it.note, thumb: !!it.thumb, tries: it.thumbTries || 0, author: it.author, url: it.url }));
});
check(r[0].thumb && r[0].author === '@cook.home', 'item saved without a picture got one in the background');
check(!r[1].thumb && r[1].tries === 4, 'items already tried 4 times are left alone');
check(r[0].url === 'https://www.tiktok.com/@cook.home/video/7429111122223333444', 'short link of an older save replaced by the full address');
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '30-home-filled.png' });

// ---------- 7. Video download: success ----------
await page.click('.card-item >> nth=0');
await page.waitForTimeout(300);
check(await page.isVisible('[data-action="download-video"]'), 'TikTok item page shows "download the video"');
await page.screenshot({ path: OUT + '31-item-before-download.png', fullPage: true });
r = await page.evaluate(async () => { window.__net.mode = { page: 'blocked-not' }; const id = window.SH.view().id; const p = window.SH.dl.start(id); await new Promise((r) => setTimeout(r, 60)); const mid = document.querySelector('#vcard').textContent; await p; return { mid, video: window.SH.itemById(id).video, calls: window.__dl.calls.splice(0) }; });
check(/מחפש|מוריד/.test(r.mid), 'progress is shown while downloading (' + r.mid.trim().slice(0, 30) + ')');
check(r.video && r.video.size === 2000000 && r.video.path.startsWith('videos/'), 'video saved to the phone');
check(r.calls[0].url.includes('wmplay'), 'first try: the version with TikTok\'s mark (like TikTok\'s own save)');
await page.waitForTimeout(200);
check(await page.isVisible('video.player'), 'player shows after download');
check(await page.isVisible('[data-action="share-video-file"]') && await page.isVisible('[data-action="save-gallery"]') && await page.isVisible('[data-action="delete-video"]'), 'share as file / gallery / delete buttons');
await page.screenshot({ path: OUT + '32-item-downloaded.png', fullPage: true });

// share sheet
await page.click('.actions4 [data-action="share-item"]');
await page.waitForTimeout(200);
check(await page.isVisible('.sheet [data-action="share-link"]') && await page.isVisible('.sheet [data-action="share-video-file"]'), 'share sheet: as link and as file');
await page.screenshot({ path: OUT + '33-share-sheet.png' });
await page.click('.sheet-head [data-action="close-sheet"]');
await page.click('[data-action="delete-video"]');
await page.waitForTimeout(200);
check(!(await page.evaluate(() => !!window.SH.itemById(window.SH.view().id).video)) && await page.isVisible('[data-action="download-video"]'), 'delete file returns to the download button');
await page.click('[data-action="back"]');

// ---------- 8. Creator blocked downloads ----------
r = await page.evaluate(async () => {
  const SH = window.SH; window.__net.mode = { page: 'blocked' };
  const it = SH.state.items.find((x) => x.note === 'נוסה כבר 4 פעמים');
  SH.pushView({ name: 'item', id: it.id });
  const ok = await SH.dl.start(it.id);
  return { ok, job: SH.dl.jobs[it.id], text: document.querySelector('#vcard').textContent, calls: window.__dl.calls.splice(0) };
});
check(!r.ok && r.job.reason === 'blocked' && /היוצר חסם הורדות/.test(r.text), 'creator blocked downloads → clear message');
check(r.calls.length === 0, 'nothing is downloaded when the creator blocked it');
check(!(await page.isVisible('#vcard [data-action="download-video"]')) && await page.isVisible('#vcard [data-action="share-link"]'), 'no "try again", offers share as link');
await page.screenshot({ path: OUT + '34-blocked.png', fullPage: true });

// ---------- 9. Private video ----------
r = await page.evaluate(async () => { const SH = window.SH; window.__net.mode = { page: 'private' }; const id = SH.view().id; delete SH.dl.jobs[id]; await SH.dl.start(id); return document.querySelector('#vcard').textContent; });
check(/פרטי/.test(r), 'private video → "the video is private"');

// ---------- 10. All sources fail → message + try again + report ----------
r = await page.evaluate(async () => { const SH = window.SH; window.__net.mode = {}; window.__dl.fail = new Set(['tikwm', 'tiktokcdn']); const id = SH.view().id; delete SH.dl.jobs[id]; await SH.dl.start(id); return { text: document.querySelector('#vcard').textContent, tries: window.__dl.calls.splice(0).length }; });
check(/ייתכן שהיוצר חסם הורדות/.test(r.text) && r.tries >= 2, 'every source failed (' + r.tries + ' tries) → explains why it may be blocked');
check(await page.isVisible('#vcard [data-action="download-video"]') && await page.isVisible('#vcard [data-action="report-video"]'), 'offers try again and sending details');
await page.click('#vcard [data-action="report-video"]');
await page.waitForTimeout(200);
const msg = await page.$eval('#fbm', (t) => t.value);
check(/הורדת סרטון לא הצליחה/.test(msg) && /download from tikwm failed/.test(msg), 'report opens the feedback form with the technical details');
await page.screenshot({ path: OUT + '35-report.png' });
await page.click('.sheet-head [data-action="close-sheet"]');

// ---------- 11. Non-TikTok video: honest note ----------
r = await page.evaluate(() => { const SH = window.SH; const it = { id: 'yt1', url: 'https://www.youtube.com/watch?v=abc', src: 'youtube', ts: Date.now(), upd: 1, tags: [], note: 'שיעור', title: '', author: '', site: '', fav: false, cat: '', thumb: '', tw: 0, th: 0, key: 'yt:abc' }; SH.state.items.push(it); return SH.views.videoInner(it); });
check(/עובדת כרגע לסרטוני טיקטוק/.test(r), 'YouTube item says download works for TikTok for now');

// ---------- 12. Saved state keeps the video record ----------
r = await page.evaluate(() => { const SH = window.SH; const n = SH.normalize(JSON.parse(JSON.stringify({ items: [{ id: 'v1', url: 'https://www.tiktok.com/@a/video/1234567890', video: { path: 'videos/v1.mp4', size: 123, at: 5 }, thumbTries: 2 }] }))); return n.items[0]; });
check(r.video && r.video.path === 'videos/v1.mp4' && r.thumbTries === 2, 'video and picture-try info survive saving');

// dark mode look of the video section
await page.evaluate(async () => { const SH = window.SH; window.__dl.fail = new Set(); window.__net.mode = {}; const it = SH.state.items.find((x) => x.note === 'מתכון פסטה'); SH.ui.stack = []; SH.pushView({ name: 'item', id: it.id }); await SH.dl.start(it.id); SH.state.settings.theme = 'dark'; SH.applyTheme(); SH.render(true); });
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 500));
await page.screenshot({ path: OUT + '36-video-dark.png' });

console.log('\nERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
