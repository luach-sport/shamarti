/* Starting data: the categories a new user gets, the colours and icons to choose from, and empty app data. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.CAT_ICONS = ['play', 'pot', 'book', 'bulb', 'dumbbell', 'mountain', 'music', 'cart', 'heart', 'baby', 'car', 'tool', 'laugh', 'gift', 'globe', 'star', 'image', 'folder'];
  SH.CAT_COLORS = ['red', 'amber', 'purple', 'teal', 'pink', 'blue', 'green', 'gray'];

  SH.defaultCats = () => [
    { id: 'videos', name: 'סרטונים', color: 'red', icon: 'play' },
    { id: 'recipes', name: 'מתכונים', color: 'amber', icon: 'pot' },
    { id: 'lessons', name: 'שיעורים', color: 'purple', icon: 'book' },
    { id: 'tips', name: 'טיפים לבית', color: 'pink', icon: 'bulb' },
    { id: 'fitness', name: 'כושר', color: 'teal', icon: 'dumbbell' },
    { id: 'trips', name: 'טיולים', color: 'blue', icon: 'mountain' }
  ];

  SH.defaults = () => ({
    v: 1, createdAt: Date.now(),
    settings: { theme: 'system', clip: true, thumbs: true, defCat: 'last', backupRemind: true, lastBackup: 0, backupSnooze: 0 },
    cats: SH.defaultCats(), sources: [], items: [],
    lastCat: '', clipSeen: '', lastShare: null,
    outbox: [], profile: { name: '', email: '' }, updateSeen: 0
  });

  // A free colour for a new category.
  SH.nextColor = () => {
    const used = new Set(SH.state.cats.map((c) => c.color));
    return SH.CAT_COLORS.find((x) => !used.has(x)) || SH.CAT_COLORS[SH.state.cats.length % SH.CAT_COLORS.length];
  };
})();
