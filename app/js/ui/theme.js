/* Light / dark / follow the phone, including the phone's status bar colour. */
(function () {
  'use strict';
  const SH = window.SH;

  SH.resolvedTheme = () => {
    const t = SH.state.settings.theme;
    if (t === 'system') return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return t;
  };

  SH.applyTheme = () => {
    const t = SH.resolvedTheme();
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('shamarti.theme', SH.state.settings.theme); } catch (e) { /* ignore */ }
    const bg = t === 'dark' ? '#111317' : '#F5F6F8';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
    if (SH.isNative()) {
      SH.call('StatusBar', 'setBackgroundColor', { color: bg });
      SH.call('StatusBar', 'setStyle', { style: t === 'dark' ? 'DARK' : 'LIGHT' });
    }
  };

  SH.watchSystemTheme = () => {
    if (!window.matchMedia) return;
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (SH.state.settings.theme === 'system') SH.applyTheme(); }); } catch (e) { /* old WebView */ }
  };
})();
