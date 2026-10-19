const THEMES = ['auto', 'light', 'dark'] as const;
type Theme = (typeof THEMES)[number];


function isTheme(value: string | null): value is Theme {
  return value === 'auto' || value === 'light' || value === 'dark';
}

function getShopSlug(): string {
  const parts = location.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('shops');
  return i !== -1 && parts[i + 1] ? parts[i + 1] : 'default';
}

const STORAGE_KEY = `shop:${getShopSlug()}:v1:theme`;

function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isTheme(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function syncInputs(theme: Theme): void {
  document
    .querySelectorAll<HTMLInputElement>('[data-theme-set]')
    .forEach((input) => {
      input.checked = input.value === theme;
    });
}

function applyTheme(theme: Theme): void {
  if (!isTheme(theme)) return;
  document.documentElement.dataset.theme = theme;
  syncInputs(theme);
}

function setTheme(theme: Theme): void {
  if (!isTheme(theme)) return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch { }
  applyTheme(theme);
}

document.addEventListener('change', (e: Event) => {
  if (!(e.target instanceof Element)) return;
  const input = e.target.closest<HTMLInputElement>('[data-theme-set]');
  if (!input) return;
  if (!isTheme(input.value)) return;
  setTheme(input.value);
});

window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === STORAGE_KEY && isTheme(e.newValue)) {
    applyTheme(e.newValue);
  }
});

applyTheme(getStoredTheme());
export { };