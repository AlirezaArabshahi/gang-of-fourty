import type { Theme, Product, Card } from '../types';
import { setupMobileMenu } from './mobile-menu';
import { setupMegaMenu } from './mega-menu-events';
import { setupCartClicks } from './cart-events';
import { setupCartPanelToggle } from './cart-panel-toggle';
import { setupTheme } from './theme';
import { setupCatFilter } from './category-filter';
import { setupSearch } from './search';

export function setupStaticEvents(h: {
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onCartChange: (id: number, change: 'add' | 'remove') => void;
}): void {
  setupMobileMenu();
  setupMegaMenu();
  setupCartPanelToggle();
  setupCartClicks(h.onCartChange);
  setupTheme(h.theme, h.onTheme);
}

export function setupDataEvents(h: {
  getHash: () => string;
  onCategory: (slug: string) => void;
  onPop: () => void;
  onHiddenShelf: () => void;
  search: {
    products: Product[];
    toCard: (p: Product) => Card;
    initialQuery: string;
    onQueryChange: (query: string) => void;
  };
}): (query: string) => void {
  setupCatFilter({
    onSelect: h.onCategory,
    onPop: h.onPop,
    onHiddenShelf: h.onHiddenShelf,
    getHash: h.getHash,
  });
  return setupSearch(h.search);
}