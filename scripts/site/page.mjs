// Puts the guide page together: site/index.html with each <!-- part: name --> replaced by site/parts/name.html,
// then the version, build, date and "what's new" filled in. Also copies the styles, script, font and icon.
import { readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function whatsNew(info) {
  if (!info.notes.length) return '';
  return '  <section class="news" aria-labelledby="news-h">\n' +
    '    <div class="news-head"><h2 id="news-h">מה חדש</h2><span class="badge">גרסה ' + esc(info.version) + '</span></div>\n' +
    '    <ul>' + info.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>\n' +
    '  </section>\n';
}

export function writePage(root, out, info) {
  const site = join(root, 'site');
  let html = readFileSync(join(site, 'index.html'), 'utf8');
  html = html.replace(/<!-- part: ([a-z0-9-]+) -->/g, (m, name) => {
    const file = join(site, 'parts', name + '.html');
    if (!existsSync(file)) throw new Error('missing site part: ' + name);
    return readFileSync(file, 'utf8').replace(/\s+$/, '') + '\n';
  });
  const date = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Asia/Jerusalem' }).format(new Date());
  html = html.split('{{VERSION}}').join(esc(info.version))
    .split('{{BUILD}}').join(esc(info.build || '–'))
    .split('{{DATE}}').join(esc(date))
    .split('{{WHATS_NEW}}').join(whatsNew(info));
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('unfilled placeholder in the site');
  writeFileSync(join(out, 'index.html'), html);

  cpSync(join(site, 'css'), join(out, 'css'), { recursive: true });
  cpSync(join(site, 'js'), join(out, 'js'), { recursive: true });
  cpSync(join(root, 'www', 'fonts'), join(out, 'fonts'), { recursive: true });
  cpSync(join(root, 'www', 'icon-512.png'), join(out, 'icon.png'));
  writeFileSync(join(out, '.nojekyll'), '');
  return html;
}
