(function () {
  'use strict';

  const STORAGE_KEY = 'theme';
  const THEMES = ['auto', 'light', 'dark'];

  function getStoredTheme() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(v) ? v : 'auto';
    } catch {
      return 'auto';
    }
  }

  function updateAria(theme) {
    document.querySelectorAll('[data-theme-set]').forEach((btn) => {
      const pressed = btn.dataset.themeSet === theme;
      btn.setAttribute('aria-pressed', String(pressed));
    });
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    document.documentElement.dataset.theme = theme;
    updateAria(theme);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-theme-set]');
    if (!btn) return;
    e.preventDefault();
    setTheme(btn.dataset.themeSet);
  });

  // Sync aria state with whatever the inline script set
  updateAria(getStoredTheme());
})();