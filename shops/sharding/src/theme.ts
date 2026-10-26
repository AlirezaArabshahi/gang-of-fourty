import { STORAGE_KEYS } from './storage';
import { closestTarget } from './dom';

const THEMES = ['auto', 'light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

function isTheme(value: string | null): value is Theme {
  return THEMES.some((t) => t === value);
}

function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.theme);
    return isTheme(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function syncInputs(theme: Theme): void {
  document.querySelectorAll<HTMLInputElement>('input[data-theme-set]').forEach((input) => {
    input.checked = input.value === theme;
  });
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  syncInputs(theme);
}

function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch (err: unknown) {
    console.warn('[theme] failed to persist theme preference', err);
  }
  applyTheme(theme);
}

export function setupTheme(): void {
  document.addEventListener('change', (e: Event) => {
    const input = closestTarget<HTMLInputElement>(e, 'input[data-theme-set]');
    if (!input || !isTheme(input.value)) return;
    setTheme(input.value);
  });

  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.theme && isTheme(e.newValue)) {
      applyTheme(e.newValue);
    }
  });

  applyTheme(getStoredTheme());
}