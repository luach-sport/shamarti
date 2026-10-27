// After the page is built: the link-preview picture (og.jpg), and checks that would embarrass us live:
// a screenshot the page points to but doesn't exist, or a page that scrolls sideways on a phone or a computer.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export async function finishAndCheck(browser, base, out, html) {
  const problems = [];
  for (const m of html.matchAll(/src="(shots\/[^"]+)"/g)) {
    if (!existsSync(join(out, m[1]))) problems.push('missing screenshot ' + m[1]);
  }

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' });
  await og.goto(base + '/index.html');
  await og.waitForTimeout(1800);
  await og.screenshot({ path: join(out, 'og.jpg'), type: 'jpeg', quality: 85 });

  const sizes = [[1200, 900, 'light'], [820, 1000, 'light'], [360, 740, 'light'], [360, 740, 'dark']];
  for (const [width, height, scheme] of sizes) {
    const p = width === 1200 ? og : await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
    if (p !== og) await p.goto(base + '/index.html');
    await p.waitForTimeout(400);
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (wide) problems.push('the page scrolls sideways at ' + width + 'px (' + scheme + ')');
    const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth && !i.src.includes('mycar')).map((i) => i.getAttribute('src')));
    if (broken.length) problems.push('pictures that did not load: ' + broken.join(', '));
    if (p !== og) await p.close();
  }
  await og.close();
  return problems;
}
