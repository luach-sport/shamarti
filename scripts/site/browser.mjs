// Starts Chromium through Playwright.
// On GitHub the workflow installs `playwright`; locally set PW_FROM (where playwright is installed)
// and CHROME (a Chromium to use) if they aren't in the usual places.
import { createRequire } from 'node:module';

export async function launch() {
  let pw;
  try {
    pw = await import('playwright');
  } catch (e) {
    pw = createRequire(process.env.PW_FROM || '/opt/npm-tools/node_modules/')('playwright');
  }
  return pw.chromium.launch({ executablePath: process.env.CHROME || undefined });
}
