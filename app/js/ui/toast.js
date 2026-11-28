/* Short messages at the bottom of the screen, and a light vibration on the phone. */
(function () {
  'use strict';
  const SH = window.SH;
  let timer;

  SH.toast = (msg, ms) => {
    const root = SH.$('#toast-root');
    root.innerHTML = '<div class="toast">' + SH.esc(msg) + '</div>';
    clearTimeout(timer);
    timer = setTimeout(() => { root.innerHTML = ''; }, ms || 2600);
  };
  SH.haptic = () => { if (SH.isNative()) SH.call('Haptics', 'impact', { style: 'LIGHT' }); };
})();
