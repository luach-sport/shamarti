// Drives the app in Chromium at phone size: saves items, searches, filters, edits, deletes, themes, backup.
import { createRequire } from 'node:module';
const require = createRequire(process.env.PW_FROM || '/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const OUT = process.env.SHOTS || 'tests/shots/';
const URL = (process.env.APP_URL || 'http://127.0.0.1:8765/index.html');
const errors = [];
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'he-IL', colorScheme: 'light' });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/cap-runtime|Failed to load resource|ERR_|CORS|net::/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(URL);
await page.waitForTimeout(500);
const shot = (n, full) => page.screenshot({ path: OUT + n + '.png', fullPage: !!full });
const click = async (sel) => { await page.click(sel); await page.waitForTimeout(250); };
const check = (cond, msg) => { if (!cond) errors.push('FAIL: ' + msg); else console.log('ok -', msg); };

await shot('01-welcome');
check(await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some((f) => f.family.includes('Rubik') && f.status === 'loaded'); }), 'the app font (Rubik) loads');
check(await page.isVisible('text=כאן יישמר כל מה ששווה לזכור'), 'welcome card shows for an empty app');

// ---- first save through the sheet (preview cannot load in a plain browser: expect graceful fallback)
await click('[data-action="new-save"]');
await page.fill('#lnk', 'https://vm.tiktok.com/ZS8kQx2mP/');
await page.waitForTimeout(1600);
check(await page.$eval('.src-select select', (s) => s.value) === 'tiktok', 'TikTok detected from the link');
await page.fill('#note', 'פסטה בשמנת ופטריות. לנסות בשבת\nלשים פחות מלח');
await click('[data-action="form-cat"][data-id="recipes"]');
await page.fill('#tagin', 'שבת');
await page.press('#tagin', 'Enter');
await page.fill('#tagin', 'מהיר,');
await page.waitForTimeout(150);
check((await page.$$('#ftags .tagchip')).length === 2, 'two tags added (Enter and comma)');
await click('[data-action="form-fav"]');
await shot('02-save-sheet');
await click('[data-action="save-item"]');
await page.waitForTimeout(400);
let st = await page.evaluate(() => window.SH.state);
check(st.items.length === 1 && st.items[0].cat === 'recipes' && st.items[0].fav && st.items[0].tags.join(',') === 'שבת,מהיר', 'item saved with category, fav and tags');
check(st.items[0].url === 'https://vm.tiktok.com/ZS8kQx2mP/', 'link stored');

// ---- seed more items with pictures to see the grid
await page.evaluate(async () => {
  const mk = (w, h, color, label) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.85)'; x.font = 'bold 40px sans-serif'; x.fillText(label, 30, h / 2); return c.toDataURL('image/jpeg', 0.8).split(',')[1]; };
  const S = window.SH.state, now = Date.now(), day = 864e5;
  const add = async (o, img) => {
    const id = window.SH.uid();
    const it = Object.assign({ id, ts: now, upd: now, tags: [], note: '', title: '', author: '', site: '', fav: false, cat: '', thumb: '', tw: 0, th: 0 }, o);
    it.key = window.SH.urlKey(it.url);
    if (img) { it.thumb = await window.SH.thumbs.save(id, mk(img[0], img[1], img[2], img[3])); it.tw = img[0]; it.th = img[1]; }
    S.items.push(it);
  };
  await add({ url: 'https://www.instagram.com/reel/C9xyz12/', src: 'instagram', cat: 'fitness', note: 'תרגילי גב תחתון, 5 דקות בבוקר', author: '@coach', ts: now - 3 * day, fav: true }, [540, 960, '#14907F', 'REEL']);
  await add({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', src: 'youtube', cat: 'lessons', note: 'שיעור בפרשת השבוע – לשמוע בדרך', title: 'שיעור שבועי', author: 'ערוץ שיעורים', ts: now - 7 * day }, [720, 405, '#6B45D1', 'YT']);
  await add({ url: 'https://example.co.il/aircon-clean', src: 'web', cat: 'tips', note: 'מדריך: ניקוי מזגן ביתי לבד', site: 'דוגמה', ts: now - 6 * day }, [720, 378, '#C23A6E', 'WEB']);
  await add({ url: 'https://www.facebook.com/reel/123', src: 'facebook', cat: 'trips', note: 'מסלול מים בגליל למשפחות', ts: now - 12 * day }, [540, 700, '#2F5BD3', 'FB']);
  await add({ url: 'https://www.tiktok.com/@chef/video/7429000000000000001', src: 'tiktok', cat: 'recipes', note: 'פסטה ברוטב עגבניות של סבתא', tags: ['בלי סוכר'], ts: now - 50 * day }, [540, 960, '#D99A0E', 'TT']);
  await add({ url: 'https://www.tiktok.com/@trick/video/7429000000000000002', src: 'tiktok', cat: 'videos', note: 'טריק לקיפול חולצות מהיר', ts: now - 400 * day });
  await add({ url: 'https://news.example.com/story', src: 'web', cat: '', title: 'כתבה מעניינת על חלל', ts: now - 2 * day });
  S.items.sort((a, b) => b.ts - a.ts);
  window.SH.saveState(S, true);
  window.__shamarti.render();
});
await page.waitForTimeout(400);
await shot('03-home-grid');
check((await page.$$('.card-item')).length === 8, 'home grid shows all 8 items');
check(await page.isVisible('.chip[data-id="recipes"]'), 'category chips show used categories');

// category chip filter
await click('.chip[data-id="recipes"]');
check((await page.$$('.card-item')).length === 2, 'recipes chip filters to 2 items');
await click('.chip[data-id="all"]');

// ---- item page
await click('.card-item >> nth=0');
await shot('04-item', true);
check(await page.isVisible('.item-h1'), 'item page opens');
const h1 = await page.textContent('.item-h1');
console.log('   item title:', h1);
await click('[data-action="back"]');
check(await page.isVisible('.masonry'), 'back returns to the grid');

// ---- search
await click('[data-action="open-search"] >> nth=0');
await page.fill('#q', 'פסטה');
await page.waitForTimeout(400);
let n = (await page.$$('.res')).length;
check(n === 2, 'search "פסטה" finds 2 (got ' + n + ')');
check((await page.$$('.res mark')).length >= 2, 'search highlights the word');
await shot('05-search');
await click('.chip[data-action="search-src"][data-id="tiktok"]');
check((await page.$$('.res')).length === 2, 'TikTok filter keeps 2');
await click('.chip[data-action="search-src"][data-id="instagram"]');
check((await page.$$('.res')).length === 0 && await page.isVisible('.empty'), 'Instagram filter shows a clear empty state');
await click('.chip[data-action="search-src"][data-id="all"]');
await page.fill('#q', 'שבת');
await page.waitForTimeout(400);
check((await page.$$('.res')).length === 1, 'search finds a tag ("שבת")');
await page.fill('#q', '');
await page.waitForTimeout(300);
await click('[data-sheet="pickDate"]');
await click('[data-action="set-search-date"][data-v="older"]');
check((await page.$$('.res')).length === 1, 'date filter "older than a year" keeps 1');
await click('[data-sheet="pickDate"]');
await click('[data-action="set-search-date"][data-v="all"]');
await click('[data-sheet="pickCat"]');
await click('[data-action="set-search-cat"][data-v="none"]');
check((await page.$$('.res')).length === 1, 'category filter "no category" keeps 1');
await shot('06-search-filters');
await click('[data-action="back"]');

// ---- duplicate warning + share flow
await page.evaluate(() => window.__shamarti.handleShareUrl('shamarti://share?text=' + encodeURIComponent('Check out this video https://www.tiktok.com/@chef/video/7429000000000000001?_r=1&_t=abc ') + '&t=1', false));
await page.waitForTimeout(600);
check(await page.isVisible('#lnk'), 'shared text opens the save sheet');
check(await page.$eval('#lnk', (i) => i.value).then((v) => v.startsWith('https://www.tiktok.com/@chef/video/7429000000000000001')), 'link pulled out of the shared text');
check(await page.isVisible('[data-action="open-dup"]'), 'already-saved warning shows for the same video');
await shot('07-share-dup');
await click('.sheet-head [data-action="close-sheet"]');

// ---- edit + move + delete
await click('.card-item >> nth=0');
await click('[data-action="move-item"] >> nth=0');
await click('[data-action="do-move"][data-cat="videos"]');
st = await page.evaluate(() => window.SH.state.items[0]);
check(st.cat === 'videos', 'move to another category');
await click('[data-action="edit-item"] >> nth=0');
await page.fill('#note', 'כתבה מעניינת על חלל ועל ירח');
await click('[data-action="save-item"]');
await page.waitForTimeout(300);
check((await page.textContent('.item-h1')).includes('ירח'), 'edit changes the description');
await click('[data-action="delete-item"]');
await click('[data-action="confirm-delete"]');
await page.waitForTimeout(300);
check((await page.evaluate(() => window.SH.state.items.length)) === 7, 'delete removes the item');

// ---- categories tab: new category
await click('#tabs [data-tab="cats"]');
await shot('08-cats', true);
await click('[data-action="new-cat"]');
await page.fill('#cname', 'לקנות');
await click('[data-action="cat-icon"][data-v="cart"]');
await click('[data-action="save-cat"]');
check(await page.evaluate(() => window.SH.state.cats.some((c) => c.name === 'לקנות' && c.icon === 'cart')), 'new category with icon');
await click('[data-action="new-source"]');
await page.fill('#sname', 'דוגמה');
await page.fill('#sdom', 'example.co.il');
await click('[data-action="save-source"]');
check(await page.evaluate(() => window.SH.state.items.some((it) => it.src.startsWith('c'))), 'custom source picks up existing links from its site');

// ---- settings, dark mode, feedback form validation
await click('#tabs [data-tab="settings"]');
await shot('09-settings', true);
check(await page.isVisible('text=פותח על ידי'), 'credit in settings');
await click('[data-action="set-theme"][data-v="dark"]');
check((await page.getAttribute('html', 'data-theme')) === 'dark', 'dark mode switches');
await click('#tabs [data-tab="home"]');
await shot('10-home-dark');
await click('.card-item >> nth=1');
await shot('11-item-dark', true);
await click('[data-action="back"]');
await click('#tabs [data-tab="settings"]');
await click('[data-action="set-theme"][data-v="light"]');
await click('[data-sheet="feedback"]');
await click('[data-action="send-feedback"]');
check(await page.isVisible('text=צריך לכתוב שם'), 'feedback form asks for name, e-mail and message');
await shot('12-feedback');
await click('.sheet-head [data-action="close-sheet"]');

// ---- backup round-trip (replace and merge) through the real import code
const res = await page.evaluate(async () => {
  const S = window.SH.state;
  const thumbs = {};
  for (const it of S.items) if (it.thumb) thumbs[it.thumb] = await window.SH.thumbs.read(it.thumb);
  const doc = JSON.parse(JSON.stringify({ app: 'shamarti', v: 1, exportedAt: new Date().toISOString(), state: S, thumbs }));
  const before = S.items.length, withThumb = S.items.filter((i) => i.thumb).length;
  await window.__shamarti.importBackup(doc, 'merge');
  const afterMerge = window.SH.state.items.length;
  await window.__shamarti.importBackup(doc, 'replace');
  const after = window.SH.state.items.length, thumbsAfter = window.SH.state.items.filter((i) => i.thumb && window.SH.thumbs.src(i.thumb)).length;
  return { before, afterMerge, after, withThumb, thumbsAfter };
});
check(res.afterMerge === res.before, 'merging the same backup adds nothing (no duplicates)');
check(res.after === res.before && res.thumbsAfter === res.withThumb, 'replace restores all items and pictures (' + JSON.stringify(res) + ')');

// ---- reload keeps everything
await page.reload();
await page.waitForTimeout(600);
check((await page.$$('.card-item')).length === res.before, 'data survives a reload');

// no horizontal overflow on any main screen
for (const t of ['home', 'cats', 'favs', 'settings']) {
  await click('#tabs [data-tab="' + t + '"]');
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(ow <= 0, 'no sideways scroll on ' + t + ' (' + ow + ')');
}
await click('#tabs [data-tab="favs"]');
await shot('13-favs');

console.log('\nERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
