import { loadAllData } from './api/load-all';
import { loadCart, saveCart } from './storage/cart-storage';
import { loadTheme, saveTheme } from './storage/theme-storage';
import { getCatParam, setCatParam, clearCatParam } from './storage/url';
import { updateCart } from './cart/cart';
import type { CartChange } from './types';
import { createState } from './catalog/app-state';
import { stockOf } from './catalog/stock';
import { buildShelves } from './catalog/shelves';
import { buildCartView, pruneCart } from './catalog/cart-rows';
import { cardOf } from './catalog/to-card';
import { BANNER_IMAGES, PROMO_IMAGES, CATEGORY_IMAGES } from './content';
import { renderPage } from './ui/render-page';
import { renderCartView } from './ui/cart-view';
import { refreshCartButtons } from './ui/cart-button';
import { showCartFeedback } from './ui/cart-feedback';
import { setupStaticEvents, setupDataEvents } from './ui/events';
import { showCategory } from './ui/category-filter';

const state = createState(loadCart());
const syncCategory = () => showCategory(getCatParam(), state.categories);
const renderCartUI = () => renderCartView(buildCartView(state), (id) => changeCart(id, 'remove-line'));

function render(): void {
  renderPage({ ...state, shelves: buildShelves(state), banners: BANNER_IMAGES, promos: PROMO_IMAGES });
  renderCartUI();
}

function changeCart(id: number, change: CartChange): void {
  const before = state.cart[id] ?? 0;
  const maxStock = stockOf(id, state.stock);
  const name = state.products.find((p) => p.id === id)?.name ?? 'کالا';

  if (change === 'add' && before >= maxStock) {
    showCartFeedback(name, before, before, true);
    return;
  }

  state.cart = updateCart(state.cart, id, change, maxStock);
  const after = state.cart[id] ?? 0;
  if (after === before) return;

  saveCart(state.cart);
  refreshCartButtons(id, after, maxStock);
  renderCartUI();
  showCartFeedback(name, before, after);
}

async function start(): Promise<void> {
  setupStaticEvents({ theme: loadTheme(), onTheme: saveTheme, onCartChange: changeCart });
  
  Object.assign(state, await loadAllData());
  state.categories = state.categories.map((c) => ({ ...c, image: CATEGORY_IMAGES[c.slug] }));
  state.cart = pruneCart(state);
  saveCart(state.cart);
  
  render();
  syncCategory();
  
  setupDataEvents({
    onCategory: (slug) => { setCatParam(slug); syncCategory(); },
    onPop: syncCategory,
    onHiddenShelf: () => { clearCatParam(); syncCategory(); },
    search: { products: state.products, toCard: (p) => cardOf(p, state) }
  });
}

start();