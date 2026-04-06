// src/modules/theme/theme-script.ts
// Returns an inline JS string for FOUC prevention — injected into <head> synchronously.
// Cannot import modules at runtime; THEME_KEY is duplicated intentionally.
// IMPORTANT: if THEME_KEY changes in types.ts, update the string literal below to match.

export function getThemeScript(): string {
  return `(function () {
  var THEME_KEY = 'koubou-theme';
  var VALID = { day: 1, nightfall: 1 };
  function applyTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}
    var prefersDark = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = (saved && VALID[saved]) ? saved : prefersDark ? 'nightfall' : 'day';
    document.documentElement.dataset.theme = theme;
  }
  applyTheme();
  document.addEventListener('astro:after-swap', applyTheme);
})();`;
}
