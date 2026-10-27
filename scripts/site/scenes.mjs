// The screenshots on שמרתי's site, taken by the Itzko site kit (kit/lib/shots.mjs in luach-sport/itzko).
// prepare() fills the app with example saves; every scene's `set` then runs inside the app page (sent as is)
// with { cover, info }. `fill` types into a field afterwards, `scroll` is a selector to bring into view (or 'bottom').
import { installCovers } from './covers.mjs';
import { seedApp, previewCover } from './seed.mjs';

export async function prepare(page, { info }) {
  await page.evaluate(installCovers);
  await page.evaluate(seedApp);
  await page.reload();
  await page.waitForTimeout(1200);
  await page.evaluate(installCovers);
  const cover = await page.evaluate(previewCover);
  await page.evaluate(async () => { window.__clipUrl = await window.__clip(window.SH.thumbs.src(window.SH.itemById('ex1').thumb)); });
  return { cover, info };
}
export const reset = () => { window.SH.closeSheet(); window.scrollTo(0, 0); };

// The first example (a TikTok recipe) has its video "downloaded": the app checks the file exists, so a stand-in is registered.
const at = (tab) => `const SH = window.SH, ui = SH.ui; ui.clip = null; ui.stack = []; ui.tab = '${tab}'; ui.homeCat = 'all'; ui.catsEdit = false;
  SH.fs.web['videos/ex1.mp4'] = SH.fs.web['videos/ex1.mp4'] || { url: window.__clipUrl || '', size: 7400000 };
  SH.itemById('ex1').video = { path: 'videos/ex1.mp4', size: 7400000, at: Date.now() - 36e5, gallery: '' };`;
const scene = (name, body, extra) => Object.assign({ name, set: new Function('arg', body) }, extra || {});

export const SCENES = [
  scene('home', at('home') + 'SH.render();'),
  scene('clip', at('home') + "ui.clip = { url: 'https://vm.tiktok.com/ZS8kQx2mP/', src: 'tiktok' }; SH.render();"),
  scene('save', at('home') + `SH.render(); SH.openSheet('save', {});
    Object.assign(ui.form, { url: 'https://www.tiktok.com/@cook.home/video/7430222233334444555', src: 'tiktok', srcManual: true,
      title: 'שקשוקה בתנור בלי לעמוד ליד הכיריים', author: '@cook.home', pv: { state: 'ok' }, thumbData: arg.cover, tw: 540, th: 960,
      note: 'שקשוקה בתנור לארוחת שישי\\nלהוסיף פטה בסוף', cat: 'recipes', tags: ['שישי', 'מהיר'] });
    SH.renderSheet();`, { wait: 800 }),
  scene('item', at('home') + "ui.stack = [{ name: 'item', id: 'ex1' }]; SH.render();"),
  scene('share', at('home') + "ui.stack = [{ name: 'item', id: 'ex1' }]; SH.render(); SH.openSheet('share', { id: 'ex1' });", { wait: 800 }),
  scene('video', at('home') + "ui.stack = [{ name: 'item', id: 'ex1' }]; SH.render();", { scroll: '#vcard', after: 1500 }),
  scene('blocked', at('home') + "SH.dl.jobs.ex6 = { state: 'blocked', reason: 'blocked' }; ui.stack = [{ name: 'item', id: 'ex6' }]; SH.render();", { scroll: '#vcard' }),
  scene('search', at('home') + "SH.render(); SH.A['search-tag']({ dataset: { tag: 'שיעור' } });"),
  scene('search-date', at('home') + "SH.render(); SH.A['search-tag']({ dataset: { tag: 'שיעור' } }); SH.openSheet('pickDate');", { wait: 800 }),
  scene('cats', at('cats') + 'SH.render();', { scroll: '.sub-h' }),
  scene('cat-new', at('cats') + "SH.render(); SH.openSheet('cat', {}); Object.assign(ui.form, { name: 'מתנות', color: 'amber', icon: 'gift' }); SH.renderSheet();", { wait: 800 }),
  scene('favs', at('favs') + 'SH.render();'),
  scene('settings', at('settings') + 'SH.render();'),
  scene('settings-end', at('settings') + 'SH.render();', { scroll: 'bottom' }),
  scene('feedback', at('settings') + "SH.render(); SH.state.profile = { name: 'דני כהן', email: 'dani@example.com' }; SH.openSheet('feedback');",
    { fill: ['#fbm', 'הייתי רוצה לסדר שמירות גם בתיקיות בתוך קטגוריה'], wait: 600 }),
  scene('share-app', at('settings') + "SH.render(); SH.openSheet('shareApp');", { wait: 800 }),
  scene('update', at('settings') + `SH.render();
    const b = parseInt(arg.info.build, 10) || 2;
    SH.VERSION.build = String(b > 1 ? b - 1 : b);
    SH.update.info = { version: arg.info.version, build: b, notes: arg.info.notes.slice(0, 5), inApp: true };
    SH.openSheet('update');`, { wait: 800 })
];
