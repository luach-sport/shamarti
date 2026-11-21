/* Bridge to the Android side (Capacitor plugins). */
(function () {
  'use strict';
  const SH = window.SH;

  SH.capacitor = () => { const rt = window.ShamartiCap; return (rt && rt.Capacitor) || window.Capacitor || null; };
  SH.isNative = () => {
    const C = SH.capacitor();
    if (!C) return false;
    try { return typeof C.isNativePlatform === 'function' ? !!C.isNativePlatform() : C.platform === 'android'; } catch (e) { return false; }
  };
  const pluginCache = {};
  SH.plugin = (name) => {
    if (!SH.isNative()) return null;
    if (Object.prototype.hasOwnProperty.call(pluginCache, name)) return pluginCache[name];
    let p = null;
    try {
      const rt = window.ShamartiCap;
      if (rt && typeof rt.registerPlugin === 'function') p = rt.registerPlugin(name);
      else if (window.Capacitor && window.Capacitor.Plugins) p = window.Capacitor.Plugins[name] || null;
    } catch (e) { p = null; }
    pluginCache[name] = p;
    return p;
  };
  SH.callRaw = async (name, method, args) => {
    const p = SH.plugin(name);
    if (!p || typeof p[method] !== 'function') throw new Error('no-plugin ' + name + '.' + method);
    return p[method](args);
  };
  SH.call = async (name, method, args) => {
    try { return await SH.callRaw(name, method, args); } catch (e) { console.warn('[native]', name, method, e && (e.message || e)); return undefined; }
  };
  SH.listen = async (name, event, cb) => {
    const p = SH.plugin(name);
    if (!p) return;
    try { await p.addListener(event, cb); } catch (e) { console.warn('[native] listen', name, event, e && e.message); }
  };
})();
