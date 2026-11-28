/* Colour palette for categories and sources, light and dark. */
(function () {
  'use strict';
  const SH = window.SH;

  // Colour palette for categories and sources (light and dark variants).
  SH.PALETTE = {
    red: { c: '#D9381E', soft: '#FDECE8', ink: '#A82A15', dsoft: '#3A211B', dink: '#FF9D85' },
    amber: { c: '#D99A0E', soft: '#FFF3D6', ink: '#7A5000', dsoft: '#3A2E12', dink: '#F5C451' },
    purple: { c: '#6B45D1', soft: '#EEE6FF', ink: '#5B33B8', dsoft: '#2A2140', dink: '#B9A2FF' },
    teal: { c: '#14907F', soft: '#DDF3EF', ink: '#0F6E66', dsoft: '#14302C', dink: '#6FD6C6' },
    pink: { c: '#C23A6E', soft: '#FFE4EE', ink: '#A31D52', dsoft: '#3A1A27', dink: '#FF8FB8' },
    blue: { c: '#2F5BD3', soft: '#E2ECFF', ink: '#2448B8', dsoft: '#1A2540', dink: '#8FB0FF' },
    green: { c: '#2E8B3E', soft: '#E3F4E5', ink: '#1F6B2C', dsoft: '#18301B', dink: '#86D694' },
    gray: { c: '#596070', soft: '#E9EBEF', ink: '#3F4552', dsoft: '#262A31', dink: '#C3C8D2' },
    ink: { c: '#16181D', soft: '#E9EBEF', ink: '#16181D', dsoft: '#262A31', dink: '#F1F2F4' }
  };
  SH.colorVars = (id) => {
    const p = SH.PALETTE[id] || SH.PALETTE.gray;
    return '--c:' + p.c + ';--soft:' + p.soft + ';--cink:' + p.ink + ';--dsoft:' + p.dsoft + ';--dink:' + p.dink;
  };
})();
