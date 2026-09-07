// NAVONMESH icon set — stroke SVG on a 24px grid.
//
// These replace the emoji the navigation used to carry. Emoji render from the
// device font, so the same glyph changed shape across Android versions and
// fell back to tofu boxes on the older handsets this app is built for. A path
// renders identically everywhere and inherits currentColor.

const PATHS = {
  dashboard: 'M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5',
  alerts: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10.5 19a1.8 1.8 0 0 0 3 0',
  storage: 'M3.5 4.5h17v15h-17zM3.5 9.5h17M9.5 4.5v15',
  energy: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8',
  pcm: 'M12 2v20M3.5 7l17 10M20.5 7l-17 10',
  performance: 'M4 20V11M9.5 20V5M15 20v-6M20.5 20V8M2.5 20h19',
  produce: 'M3 9h18l-2 11H5zM8.5 9 12 3.5 15.5 9',
  crops: 'M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5',
  shelflife: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 7.5V12l3 2',
  health: 'M2.5 12h4l2-5 3.5 10 2.5-5h7',
  connectivity: 'M12 18h.01M8.5 14.5a5 5 0 0 1 7 0M5.5 11.5a9 9 0 0 1 13 0M2.5 8.5a13 13 0 0 1 19 0',
  troubleshoot: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M9.5 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2.1-2.3 3.6M12 17.2h.01',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2.5v2.6M12 18.9v2.6M4.2 7l2.2 1.3M17.6 14.7l2.2 1.3M4.2 17l2.2-1.3M17.6 9.3l2.2-1.3',
  retailer: 'M3 5h2.5l2 11h11M8 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M16 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M7 9h13l-1.5 5H8',
  fpo: 'M3.5 20.5V6l7-2.5V20.5M10.5 20.5h10V10h-10M13.5 13.5h1M17 13.5h1M13.5 17h1M17 17h1M6 8.5h1.5M6 12h1.5M6 15.5h1.5',
  external: 'M7 17 17 7M9 7h8v8'
};

export function icon(name, size = 20) {
  const d = PATHS[name] || PATHS.dashboard;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"><path d="${d}"/></svg>`;
}
