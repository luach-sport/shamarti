// Builds the public website (GitHub Pages) from the app itself, into _site/:
//   index.html        the guide (site/index.html + site/parts/*.html) with the current version and what's new
//   css/ js/ fonts/   the guide's styles, its small script and the app's font
//   shots/*.jpg       fresh screenshots of the real app with example data
//   og.jpg            link preview picture (WhatsApp and so on)
//   app/              the web version of the app (used for the screenshots)
// Run from the repo root: node scripts/site/build.mjs   (needs Playwright's Chromium; see browser.mjs)
import { rmSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readInfo } from './info.mjs';
import { serve } from './server.mjs';
import { launch } from './browser.mjs';
import { takeShots } from './shots.mjs';
import { writePage } from './page.mjs';
import { finishAndCheck } from './checks.mjs';

const root = process.cwd();
const out = join(root, '_site');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'shots'), { recursive: true });

const info = readInfo(root);
console.log('version', info.version, 'build', info.build, 'notes', info.notes.length);

cpSync(join(root, 'www'), join(out, 'app'), { recursive: true });
writeFileSync(join(out, 'app', 'js', 'version.js'), 'window.SHAMARTI_VERSION = ' + JSON.stringify({ version: info.version || 'dev', build: info.build || 'dev' }) + ';\n');

const server = await serve(out);
const browser = await launch();
try {
  const appErrors = await takeShots(browser, server.base, out, info);
  if (appErrors.length) console.log('app errors while taking screenshots:', appErrors.slice(0, 5));
  const html = writePage(root, out, info);
  const problems = await finishAndCheck(browser, server.base, out, html);
  if (problems.length) throw new Error('site problems:\n- ' + problems.join('\n- '));
} finally {
  await browser.close();
  server.close();
}
console.log('site ready:', out);
