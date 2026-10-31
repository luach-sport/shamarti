/* Online / offline status. */
(function () {
  'use strict';
  const SH = window.SH;

  let online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const netListeners = [];
  SH.online = () => online;
  SH.onNetwork = (cb) => netListeners.push(cb);
  function setOnline(v) {
    v = !!v;
    if (v === online) return;
    online = v;
    netListeners.forEach((cb) => { try { cb(v); } catch (e) { console.warn(e); } });
  }
  SH.initNetwork = async () => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    if (SH.isNative()) {
      const st = await SH.call('Network', 'getStatus');
      if (st && typeof st.connected === 'boolean') online = st.connected;
      SH.listen('Network', 'networkStatusChange', (s) => setOnline(s && s.connected));
    }
  };
})();
