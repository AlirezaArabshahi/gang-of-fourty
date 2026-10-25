import type { Product, Offer, Shelf, Home, Category } from './types';
import { state } from './state';
import { h, setText } from './dom';
import { createIcon } from './icons';
import { renderProductCard } from './product-card';

export function createCarouselNav(startHref: string, endHref: string, label: string): HTMLElement {
  const nav = h('nav', { className: 'carousel-nav' });
  nav.setAttribute('aria-label', `ناوبری ${label}`);

  const start = h('a', { href: startHref, className: 'carousel-nav__btn' });
  start.dataset.carouselStart = '';
  start.setAttribute('aria-label', `رفتن به ابتدای ${label}`);
  start.appendChild(createIcon('arrowRight'));

  const end = h('a', { href: endHref, className: 'carousel-nav__btn' });
  end.dataset.carouselEnd = '';
  end.setAttribute('aria-label', `رفتن به انتهای ${label}`);
  end.appendChild(createIcon('arrowLeft'));

  nav.append(start, end);
  return nav;
}

function buildShelf(cfg: Shelf): HTMLElement {
  const isOffers = cfg.source === 'offers';
  const section = h('section', { className: 'product-shelf', id: cfg.id });
  if (isOffers) section.dataset.variant = 'offers';
  section.setAttribute('aria-labelledby', `${cfg.id}-title`);

  const head = h('div', { className: 'product-shelf__head' });
  head.appendChild(
    h('h2', { id: `${cfg.id}-title`, className: 'product-shelf__title', textContent: cfg.title }),
  );
  head.appendChild(createCarouselNav(`#${cfg.id}-start`, `#${cfg.id}-end`, cfg.title));

  const status = h('div', { className: 'product-shelf__status', id: `${cfg.id}-status` });
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;

  const grid = h('ul', { className: 'product-shelf__grid', id: `${cfg.id}-grid`, tabIndex: 0 });
  grid.setAttribute('aria-label', cfg.title);
  grid.setAttribute('aria-busy', 'true');

  const main = h('div', { className: 'product-shelf__main' }, head, status, grid);
  const inner = h('div', { className: 'product-shelf__inner' }, main);
  const container = h('div', { className: 'container' }, inner);
  section.appendChild(container);
  return section;
}

function itemsForShelf(cfg: Shelf, products: Product[], offers: Map<number, Offer>): Product[] {
  if (cfg.source === 'offers') {
    return [...offers.keys()]
      .map((id) => products.find((x) => x.id === id))
      .filter((p): p is Product => p !== undefined)
      .sort((a, b) => (offers.get(b.id)?.percent ?? 0) - (offers.get(a.id)?.percent ?? 0));
  }
  if (cfg.categoryId != null) {
    return products.filter((p) => p.categoryId === cfg.categoryId);
  }
  return [];
}

function fillGrid(
  id: string,
  list: Product[],
  offers: Map<number, Offer>,
  stock: Map<number, number>,
): void {
  const grid = document.getElementById(`${id}-grid`);
  const status = document.getElementById(`${id}-status`);
  if (!grid || !status) return;

  if (list.length === 0) {
    renderStatus(id, 'در حال حاضر محصولی برای نمایش نیست.', false);
    return;
  }

  status.hidden = true;
  status.replaceChildren();
  grid.hidden = false;
  grid.replaceChildren();
  grid.removeAttribute('aria-busy');

  const frag = document.createDocumentFragment();
  list.forEach((product, i) => {
    const card = renderProductCard(product, offers.get(product.id), stock.get(product.id) ?? 0);
    card.style.setProperty('--i', String(i));
    if (i === 0) card.id = `${id}-start`;
    if (i === list.length - 1) card.id = `${id}-end`;
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

function renderStatus(id: string, message: string, isError: boolean): void {
  const grid = document.getElementById(`${id}-grid`);
  const status = document.getElementById(`${id}-status`);
  if (!grid || !status) return;

  grid.hidden = true;
  grid.replaceChildren();
  grid.removeAttribute('aria-busy');

  status.hidden = false;
  status.className = 'product-shelf__status';
  if (isError) status.dataset.variant = 'error';
  else delete status.dataset.variant;
  status.replaceChildren();

  const iconWrap = h('span', { className: 'product-shelf__status-icon' });
  iconWrap.appendChild(createIcon(isError ? 'warning' : 'empty'));
  iconWrap.setAttribute('aria-hidden', 'true');

  status.append(
    iconWrap,
    h('p', {
      className: 'product-shelf__status-title',
      textContent: isError ? 'بارگذاری ناموفق' : 'چیزی برای نمایش نیست',
    }),
    h('p', { className: 'product-shelf__status-text', textContent: message }),
  );

  if (isError) {
    const retry = h('button', {
      type: 'button',
      className: 'product-shelf__status-retry',
      textContent: 'تلاش دوباره',
    });
    retry.addEventListener('click', () => location.reload());
    status.appendChild(retry);
  }
}

function shelvesFor(home: Home, categories: Category[]): Shelf[] {
  const fromHome = home.carousels ?? [];
  const known = new Set(fromHome.map((s) => s.id));
  const extra = categories
    .filter((c) => !known.has(c.slug))
    .map((c) => ({ id: c.slug, title: c.name, categoryId: c.id }));
  return [...fromHome, ...extra];
}

export function renderShelves(): void {
  const { home, stock, products, categories, offerMap } = state;
  const root = document.getElementById('product-shelves');
  if (!root || !home || !stock) return;

  const stockMap = new Map(products.map((p) => [p.id, stock.items[p.id] ?? 0]));
  root.replaceChildren();
  for (const cfg of shelvesFor(home, categories)) {
    root.appendChild(buildShelf(cfg));
    fillGrid(cfg.id, itemsForShelf(cfg, products, offerMap), offerMap, stockMap);
  }
}

export function showShelvesError(message: string): void {
  setText('skeleton-title', 'محصولات');
  renderStatus('skeleton', message, true);
}

