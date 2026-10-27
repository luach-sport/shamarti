// The version shown on the site and its "what's new" list.
// Comes from update.json (what the app itself sees as the latest release); falls back to the
// workflow's APP_VERSION and release-notes.txt before the first release.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function readInfo(root) {
  try {
    const doc = JSON.parse(readFileSync(join(root, 'update.json'), 'utf8'));
    const p = JSON.parse(doc.payload);
    if (p.version) {
      return { version: String(p.version), build: String(p.build || ''), notes: Array.isArray(p.notes) ? p.notes.map(String) : [] };
    }
  } catch (e) {
    console.log('no update.json, using the workflow version');
  }
  const wf = readFileSync(join(root, '.github/workflows/build.yml'), 'utf8');
  const version = (wf.match(/APP_VERSION:\s*'([^']+)'/) || [])[1] || '';
  const notesFile = join(root, 'release-notes.txt');
  const notes = existsSync(notesFile) ? readFileSync(notesFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean) : [];
  return { version, build: '', notes };
}
