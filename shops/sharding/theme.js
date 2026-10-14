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
      const selected = btn.dataset.themeSet === theme;
      btn.setAttribute('aria-checked', String(selected));
      btn.setAttribute('tabindex', selected ? '0' : '-1');
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
    setTheme(btn.dataset.themeSet);
  });

  document.addEventListener('keydown', (e) => {
    const btn = e.target.closest('.theme-switch__btn');
    if (!btn) return;

    const container = btn.closest('.theme-switch');
    if (!container) return;

    const buttons = Array.from(container.querySelectorAll('.theme-switch__btn'));
    const index = buttons.indexOf(btn);
    if (index === -1) return;

    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % buttons.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    }

    if (nextIndex === -1) return;
    e.preventDefault();
    const next = buttons[nextIndex];
    setTheme(next.dataset.themeSet);
    next.focus();
  });

  updateAria(getStoredTheme());
})();