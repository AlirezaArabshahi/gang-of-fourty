import type { Product, LoadState } from './types';
import {
  loadShop, loadCategories, loadHome, loadProducts, loadStock, loadOffers,
} from './api';
import { state } from './state';
import { updateCartBadge, setupCartSync } from './cart';
import { setupCartEvents } from './cart-actions';
import { CATEGORY_IMAGES, PRODUCT_IMAGES } from './content';
import { renderHeaderParts } from './header';
import { renderHero, startHeroVideo } from './hero';
import { renderFooter } from './footer';
import { renderCategories } from './categories';
import { renderProducts } from './shelves';
import { setupCarouselControls } from './carousel-controls';
import { setupSearch } from './search';
import { setupCatFilter, applyInitialCategory } from './category-filter';
import { setupMenu } from './menu';
import { setupTheme } from './theme';

const MIN_SKELETON = 300;

function hideSlowNotice(): void {
  document.getElementById('slow-connection')?.setAttribute('hidden', '');
}

function errorMsg(err: unknown): string {
  if (err instanceof Error && err.name === 'AbortError') {
    return 'زمان انتظار برای دریافت داده به پایان رسید. لطفاً دوباره تلاش کنید.';
  }
  if (err instanceof Error && err.message.startsWith('HTTP ')) {
    const code = Number(err.message.slice(5));
    if (Number.isInteger(code)) {
      return 'سرور در دسترس نیست. لطفاً اتصال اینترنت را بررسی کنید.';
    }
  }
  return 'داده‌های دریافتی معتبر نبودند. لطفاً بعداً دوباره تلاش کنید.';
}

function waitSkeleton(startedAt: number): Promise<void> {
  const left = MIN_SKELETON - (performance.now() - startedAt);
  return left > 0 ? new Promise((r) => setTimeout(r, left)) : Promise.resolve();
}

function productState(r: PromiseSettledResult<Product[]>): LoadState {
  if (r.status === 'rejected') {
    console.error('[products] load failed', r.reason);
    return { status: 'error', message: errorMsg(r.reason) };
  }
  if (r.value.length === 0) return { status: 'empty' };
  return { status: 'success', products: r.value };
  // return { status: 'empty' }
}

async function init(): Promise<void> {
  setupTheme();
  setupMenu();
  updateCartBadge();
  setupCartSync();
  setupCartEvents();
  setupCatFilter();

  document.querySelector('.search')?.addEventListener('submit', (e) => e.preventDefault());

  const start = performance.now();

  const [shop, categories, home, products, stock, offers] = await Promise.allSettled([
    loadShop(), loadCategories(), loadHome(),
    loadProducts(), loadStock(), loadOffers(),
  ]);

  const shopOk = shop.status === 'fulfilled';
  const homeOk = home.status === 'fulfilled';

  state.shop = shopOk ? shop.value : null;
  state.categories = categories.status === 'fulfilled'
    ? categories.value.map((c) => ({ ...c, image: CATEGORY_IMAGES[c.slug] }))
    : [];
  state.home = homeOk ? home.value : null;
  state.products = products.status === 'fulfilled'
    ? products.value.map((p) => ({ ...p, image: PRODUCT_IMAGES[p.id] }))
    : [];
  state.stock = stock.status === 'fulfilled' ? stock.value : { items: {} };
  state.offerMap = offers.status === 'fulfilled'
    ? new Map(offers.value.map((o) => [o.productId, o]))
    : new Map();

  hideSlowNotice();
  await waitSkeleton(start);

  if (!shopOk && !homeOk) {
    document.body.dataset.state = 'error';
    document.getElementById('hero-video')?.classList.remove('hero-video--skeleton');
    renderProducts({ status: 'error', message: errorMsg(shop.reason) });
    return;
  }

  if (state.shop) renderHeaderParts();
  if (state.home) renderHero(state.home);
  if (state.categories.length > 0) {
    renderCategories(state.categories);
    document.getElementById('categories-list')?.removeAttribute('aria-busy');
  }
  if (state.shop) renderFooter(state.shop, state.categories);

  const pState = productState(products);
  renderProducts(pState);

  if (pState.status === 'success') {
    setupSearch(state.products);
    applyInitialCategory();
  } else if (pState.status === 'error') {
    document.body.dataset.state = 'error';
  }

  setupCarouselControls();
  startHeroVideo();

  if (state.shop) {
    document.title = `${state.shop.name} | ${state.shop.slogan}`;
  }
}

init();