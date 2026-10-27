// Screenshots of the real app (phone size) with the example data, one per screen the site explains.
import { join } from 'node:path';
import { installCovers } from './covers.mjs';
import { seedApp, previewCover } from './seed.mjs';
import { SCENES } from './scenes.mjs';

export async function takeShots(browser, base, out, info) {
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: 'he-IL', timezoneId: 'Asia/Jerusalem', colorScheme: 'light'
  });
  // No internet for the app: previews and updates stay quiet, and the pictures are always the same.
  await ctx.route((url) => !url.href.startsWith(base), (route) => route.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(base + '/app/index.html');
  await page.waitForTimeout(600);
  await page.evaluate(installCovers);
  await page.evaluate(seedApp);
  await page.reload();
  await page.waitForTimeout(1200);
  await page.evaluate(installCovers);
  const cover = await page.evaluate(previewCover);
  await page.evaluate(async () => { window.__clipUrl = await window.__clip(window.SH.thumbs.src(window.SH.itemById('ex1').thumb)); });

  for (const scene of SCENES) {
    await page.evaluate(() => { window.SH.closeSheet(); window.scrollTo(0, 0); });
    await page.evaluate(scene.set, { cover, info });
    if (scene.fill) await page.fill(scene.fill[0], scene.fill[1]);
    await page.waitForTimeout(scene.wait || 500);
    await page.evaluate((to) => {
      if (to === 'bottom') window.scrollTo(0, document.documentElement.scrollHeight);
      else if (to) { const el = document.querySelector(to); if (el) el.scrollIntoView({ block: 'center' }); }
      else window.scrollTo(0, 0);
    }, scene.scroll || '');
    await page.waitForTimeout(scene.after || 250);
    // A player on screen: wait until it has its first picture, so there's no loading circle.
    await page.waitForFunction(() => { const v = document.querySelector('video'); return !v || v.readyState >= 2; }, null, { timeout: 5000 }).catch(() => console.log('  (video not ready)'));
    await page.screenshot({ path: join(out, 'shots', scene.name + '.jpg'), type: 'jpeg', quality: 86 });
    console.log('shot', scene.name);
  }
  await ctx.close();
  return errors;
}
