// שמרתי icon artwork: a white bookmark with a play button cut into it, on red-orange.
// Same drawing as the approved sketch (120x120 box). Helpers build every size/shape the app needs.
export const COLORS = { bg: '#D9381E', mark: '#FFFFFF' };

// Glyph in the 120x120 box. Bookmark spans x 37..83, y 26..96 (centre 60,61).
export function glyph() {
  return `<path d="M42 26h36a5 5 0 0 1 5 5v65l-23-16-23 16V31a5 5 0 0 1 5-5z" fill="${COLORS.mark}"/>` +
    `<path d="M53 41v22l18-11z" fill="${COLORS.bg}"/>`;
}

// shape: 'square' (rounded square), 'circle', 'none' (transparent: adaptive-icon foreground)
// scale: glyph size relative to the sketch (1 = as drawn in the sketch)
export function iconSvg({ size = 1024, shape = 'square', scale = 1 } = {}) {
  let bg = '';
  if (shape === 'square') bg = `<rect width="120" height="120" rx="30" fill="${COLORS.bg}"/>`;
  else if (shape === 'circle') bg = `<circle cx="60" cy="60" r="60" fill="${COLORS.bg}"/>`;
  const g = `<g transform="translate(60 60) scale(${scale}) translate(-60 -61)">${glyph()}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120">${bg}${g}</svg>`;
}
