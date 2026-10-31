/* Where a link comes from: TikTok, Instagram, YouTube… and sources the user added. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.SOURCES = [
    { id: 'tiktok', name: 'TikTok', color: 'ink', letter: 'T', video: true, domains: ['tiktok.com'] },
    { id: 'instagram', name: 'Instagram', color: 'pink', letter: 'I', video: true, domains: ['instagram.com', 'instagr.am', 'threads.net', 'threads.com'] },
    { id: 'youtube', name: 'YouTube', color: 'red', letter: 'Y', video: true, domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
    { id: 'facebook', name: 'Facebook', color: 'blue', letter: 'F', video: true, domains: ['facebook.com', 'fb.watch', 'fb.com', 'fb.me'] },
    { id: 'x', name: 'X', color: 'gray', letter: 'X', domains: ['x.com', 'twitter.com', 't.co'] },
    { id: 'pinterest', name: 'Pinterest', color: 'purple', letter: 'P', domains: ['pinterest.com', 'pin.it', 'pinterest.co.il'] },
    { id: 'telegram', name: 'Telegram', color: 'teal', letter: 'T', domains: ['t.me', 'telegram.me'] },
    { id: 'web', name: 'אתרים', label: 'אתר', color: 'gray', icon: 'globe', domains: [] }
  ];
  SH.allSources = () => SH.SOURCES.filter((s) => s.id !== 'web').concat((SH.state && SH.state.sources) || [], SH.SOURCES.filter((s) => s.id === 'web'));
  SH.sourceById = (id) => SH.allSources().find((s) => s.id === id) || SH.SOURCES.find((s) => s.id === 'web');
  SH.sourceLabel = (s) => (s ? s.label || s.name : 'אתר');

  const hostMatch = (host, d) => host === d || host.endsWith('.' + d);
  SH.hostMatch = hostMatch;
  SH.detectSource = (url) => {
    let host = '';
    try { host = new URL(url).hostname.toLowerCase(); } catch (e) { return 'web'; }
    const custom = (SH.state && SH.state.sources) || [];
    for (const s of custom) if ((s.domains || []).some((d) => hostMatch(host, d))) return s.id;
    for (const s of SH.SOURCES) if (s.domains.some((d) => hostMatch(host, d))) return s.id;
    return 'web';
  };
})();
