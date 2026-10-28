import { loadAllData } from './api/load-all';
import { loadCart, saveCart } from './storage/cart-storage';
import { loadTheme, saveTheme } from './storage/theme-storage';
import { readUrlFilters, writeUrlFilters, readUrlHash, type UrlFilters } from './storage/url';
import { updateCart } from './cart/cart';
import type { CartChange } from './types';
import { createState } from './catalog/app-state';
import { stockOf } from './catalog/stock';
import { buildShelves } from './catalog/shelves';
import { getCartUI, pruneCart } from './catalog/cart-rows';
import { cardOf } from './catalog/to-card';
import { BANNER_IMAGES, PROMO_IMAGES, CATEGORY_IMAGES } from './content';
import { renderPage } from './ui/render-page';
import { renderCartView } from './ui/cart-view';
import { refreshCartButtons } from './ui/cart-button';
import { showCartFeedback } from './ui/cart-feedback';
import { setupStaticEvents, setupDataEvents } from './ui/events';
import { showCategory } from './ui/category-filter';

const state = createState(loadCart());
let filters: UrlFilters = readUrlFilters();
let restoreSearchQuery = (_q: string) => {};

const renderCartUI = () => renderCartView(getCartUI(state), (id) => changeCart(id, 'remove-line'));

const syncFilters = () => {
  filters = readUrlFilters();
  showCategory(filters.category, state.categories);
  restoreSearchQuery(filters.query);
};

const render = () => {
  renderPage({ ...state, shelves: buildShelves(state), banners: BANNER_IMAGES, promos: PROMO_IMAGES });
  renderCartUI();
};

function changeCart(id: number, change: CartChange): void {
  const b = state.cart[id] ?? 0, m = stockOf(id, state.stock);
  const name = state.products.find(p => p.id === id)?.name ?? 'کالا';
  if (change === 'add' && b >= m) return showCartFeedback(name, b, b, true);
  
  state.cart = updateCart(state.cart, id, change, m);
  const a = state.cart[id] ?? 0;
  if (a === b) return;
  
  saveCart(state.cart); refreshCartButtons(id, a, m); renderCartUI(); showCartFeedback(name, b, a);
}

async function start(): Promise<void> {
  setupStaticEvents({ theme: loadTheme(), onTheme: saveTheme, onCartChange: changeCart });
  
  Object.assign(state, await loadAllData());
  
  state.categories = state.categories.map(c => {
    const img = CATEGORY_IMAGES[c.slug];
    return img ? { ...c, image: img } : c;
  });
  
  state.cart = pruneCart(state);
  saveCart(state.cart);
  render();
  showCategory(filters.category, state.categories);

  restoreSearchQuery = setupDataEvents({
    getHash: readUrlHash,
    onCategory: (cat) => { filters.category = cat; writeUrlFilters(filters, 'push'); showCategory(cat, state.categories); },
    onPop: syncFilters,
    onHiddenShelf: () => { filters.category = ''; writeUrlFilters(filters); showCategory('', state.categories); },
    search: { products: state.products, toCard: (p) => cardOf(p, state), initialQuery: filters.query, onQueryChange: (q) => { filters.query = q; writeUrlFilters(filters); } },
  });
}

start();