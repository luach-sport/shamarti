// Example saves for the screenshots, dated relative to today so the pictures always look current.
// seedApp runs inside the app page (sent to the browser as is) and needs installCovers() first.
export async function seedApp() {
  const SH = window.SH;
  const now = Date.now(), hour = 36e5, day = 864e5;
  const tall = (from, to, icon, text) => ({ w: 540, h: 960, from, to, icon, text });
  const wide = (from, to, icon, text) => ({ w: 960, h: 540, from, to, icon, text });
  const items = [];
  const add = async (o, cover) => {
    const id = 'ex' + (items.length + 1);
    const it = Object.assign({ id, tags: [], note: '', title: '', author: '', site: '', fav: false, cat: '', thumb: '', tw: 0, th: 0 }, o);
    it.upd = it.ts;
    it.key = SH.urlKey(it.url);
    if (cover) {
      it.thumb = await SH.thumbs.save(id, await window.__cover(cover));
      it.tw = cover.w;
      it.th = cover.h;
    }
    items.push(it);
  };

  await add({ url: 'https://www.tiktok.com/@cook.home/video/7429111122223333444', src: 'tiktok', cat: 'recipes', ts: now - 2 * hour, fav: true,
    note: 'פסטה בשמנת ופטריות\nלנסות בשבת. פחות מלח, ופרמזן בסוף', tags: ['שבת', 'מהיר'], title: 'הפסטה הכי קלה שתכינו השבוע', author: '@cook.home',
    video: { path: 'videos/ex1.mp4', size: 7.4e6, at: now - hour } }, tall('#F4A53A', '#D9381E', 'pot', 'פסטה ב-10 דקות'));
  await add({ url: 'https://www.instagram.com/reel/C9xyzAbC12/', src: 'instagram', cat: 'fitness', ts: now - 1 * day, fav: true,
    note: 'תרגילי גב תחתון, 5 דקות בבוקר', author: '@coach.dana' }, tall('#2BB5A0', '#0E6E63', 'dumbbell', '5 דקות לגב'));
  await add({ url: 'https://www.youtube.com/watch?v=Xa1b2C3d4E5', src: 'youtube', cat: 'lessons', ts: now - 3 * day,
    note: 'שיעור בפרשת השבוע – לשמוע בדרך לעבודה', title: 'שיעור שבועי | פרשת השבוע', author: 'ערוץ השיעורים' }, wide('#8C6BE8', '#4B2BA8', 'book', 'שיעור שבועי'));
  await add({ url: 'https://www.facebook.com/reel/1234567890', src: 'facebook', cat: 'trips', ts: now - 4 * day,
    note: 'מסלול מים בגליל, מתאים לילדים\nלבוא מוקדם, יש חנייה בכניסה', tags: ['משפחה', 'קיץ'] }, tall('#4C8DF0', '#1F4FB8', 'mountain', 'מסלול מים בגליל'));
  await add({ url: 'https://example.co.il/aircon-clean', src: 'web', cat: 'tips', ts: now - 6 * day, site: 'example.co.il',
    note: 'מדריך: ניקוי מזגן ביתי לבד\nצריך מברשת רכה, ספריי ניקוי ומגבת', title: 'איך מנקים מזגן בבית' }, wide('#E5679A', '#A8336A', 'bulb', 'ניקוי מזגן לבד'));
  await add({ url: 'https://www.tiktok.com/@fold.tricks/video/7428000011112222333', src: 'tiktok', cat: 'videos', ts: now - 8 * day,
    note: 'טריק לקיפול חולצות ב-2 שניות', author: '@fold.tricks' }, tall('#FF7A5C', '#B32E18', 'star', 'קיפול חולצה ב-2 שניות'));
  await add({ url: 'https://www.tiktok.com/@sweet.home/video/7427000011112222333', src: 'tiktok', cat: 'recipes', ts: now - 12 * day,
    note: 'עוגת שוקולד בלי אפייה', tags: ['קינוח'], author: '@sweet.home' }, tall('#A0623C', '#4A2716', 'gift', 'עוגה בלי אפייה'));
  await add({ url: 'https://www.instagram.com/p/C8shoes123/', src: 'instagram', cat: 'shop', ts: now - 16 * day,
    note: 'נעלי ריצה במבצע – לבדוק מידה 43' }, { w: 540, h: 675, from: '#3BB56C', to: '#16703C', icon: 'cart', text: 'מבצע נעליים' });
  await add({ url: 'https://open.spotify.com/episode/4abcDEF123', src: 'src_spotify', cat: 'lessons', ts: now - 22 * day,
    note: 'פודקאסט על חיסכון, פרק 12' }, { w: 640, h: 640, from: '#2E3440', to: '#14171C', icon: 'music', text: 'פרק 12' });
  await add({ url: 'https://example.com/moon-story', src: 'web', ts: now - 35 * day, title: 'למה הירח מתרחק מכדור הארץ', site: 'example.com' },
    wide('#25325A', '#0E1428', 'globe', ''));
  await add({ url: 'https://www.youtube.com/watch?v=Ex9cel0000A', src: 'youtube', cat: 'lessons', ts: now - 400 * day,
    note: 'קורס אקסל למתחילים – שיעור 1', title: 'אקסל למתחילים' }, wide('#2FA866', '#146B3D', 'book', 'אקסל למתחילים'));

  const cats = SH.defaultCats().concat([{ id: 'shop', name: 'לקנות', color: 'green', icon: 'cart' }]);
  const state = {
    v: 1, createdAt: now - 420 * day,
    settings: { theme: 'light', clip: true, thumbs: true, defCat: 'last', backupRemind: true, lastBackup: now - 2 * day, backupSnooze: 0 },
    cats, sources: [{ id: 'src_spotify', name: 'Spotify', domains: ['spotify.com'], color: 'green' }],
    items, lastCat: 'recipes', clipSeen: '', lastShare: null, outbox: [], profile: { name: '', email: '' }, updateSeen: 999999
  };
  localStorage.setItem('shamarti.theme', 'light');
  localStorage.setItem('shamarti.state.v1', JSON.stringify(state));
}

// The picture shown in the save sheet's preview (a new TikTok link, not saved yet).
export async function previewCover() {
  return window.__cover({ w: 540, h: 960, from: '#F2C14E', to: '#E0672B', icon: 'pot', text: 'שקשוקה בתנור' });
}
