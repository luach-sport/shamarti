/* Registries the other files fill in: screens (views), bottom sheets (SHEETS) and button actions (A). */
(function () {
  'use strict';
  const SH = window.SH;
  SH.views = SH.views || {};
  SH.SHEETS = SH.SHEETS || {};
  SH.A = SH.A || {};
  SH.$ = (sel, root) => (root || document).querySelector(sel);
})();
