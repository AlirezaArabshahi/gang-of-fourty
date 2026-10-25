import type { Shop, Category, Product } from './types';
import { state } from './state';
import { h, setText, renderLinks } from './dom';
import { priceFmt } from './format';
import { PROMO_IMAGES } from './content';

const SEARCH_PLACEHOLDER = 'جستجو در محصولات…';

function renderMegaMenu(categories: Category[], products: Product[]): void {
  const ul = document.querySelector<HTMLUListElement>('#mega-menu-categories');
  if (!ul) return;
  ul.replaceChildren();

  categories.forEach((cat, index) => {
    const items = products.filter((p) => p.categoryId === cat.id);

    const li = h('li', { className: 'mega-menu__item' });
    if (index === 0) li.dataset.state = 'active';

    const link = h('a', {
      className: 'mega-menu__category-link',
      href: `#${cat.slug}`,
      textContent: cat.name,
      dataset: { catSlug: cat.slug },
    });

    const list = h('ul', { className: 'mega-menu__products' });
    if (items.length === 0) {
      list.appendChild(
        h('li', {
          className: 'mega-menu__products-empty',
          textContent: 'محصولی برای نمایش نیست',
        }),
      );
    } else {
      for (const p of items) {
        list.appendChild(
          h('li', {},
            h('a', {
              href: `#${cat.slug}`,
              textContent: p.name,
              dataset: { catSlug: cat.slug },
            }),
          ),
        );
      }
    }

    const sub = h('div', { className: 'mega-menu__products-panel' },
      h('h4', { className: 'mega-menu__products-title', textContent: 'محصولات' }),
      list,
    );

    const media = h('span', { className: 'mega-menu__promo-media' });
    media.setAttribute('aria-hidden', 'true');
    const promoImg = PROMO_IMAGES[cat.slug];
    if (promoImg) {
      media.appendChild(h('img', {
        src: promoImg, alt: '', loading: 'lazy', width: 400, height: 600,
      }));
    }

    const promo = h('a', {
      className: 'mega-menu__promo',
      href: `#${cat.slug}`,
      dataset: { catSlug: cat.slug },
    }, media,
      h('span', { className: 'mega-menu__promo-body' },
        h('span', { className: 'mega-menu__promo-title', textContent: cat.name }),
        h('span', { className: 'mega-menu__promo-desc', textContent: `${items.length} کالا` }),
      ),
    );

    li.append(link, sub, promo);
    ul.appendChild(li);
  });
}

function renderTopbar(shop: Shop): void {
  setText('topbar-notice', shop.notice);
}

function renderHeader(shop: Shop, productCount: number): void {
  const identity = document.querySelector<HTMLAnchorElement>('#header-identity');
  identity?.setAttribute('aria-label', `${shop.name} — صفحه اصلی`);
  setText('brand-name', shop.name);
  setText('brand-tagline', shop.slogan);

  const search = document.querySelector<HTMLInputElement>('#search-input');
  if (search) {
    search.placeholder = productCount > 0
      ? `جستجو در میان ${priceFmt.format(productCount)} کالا…`
      : SEARCH_PLACEHOLDER;
  }
}

function renderNav(shop: Shop): void {
  const nav = document.querySelector<HTMLUListElement>('#nav-list');
  if (nav) {
    nav.removeAttribute('aria-busy');
    renderLinks(nav, shop.menu, 0);
  }
}

function renderMobileMenu(shop: Shop): void {
  const list = document.querySelector<HTMLUListElement>('#mobile-menu-list');
  if (list) {
    list.removeAttribute('aria-busy');
    renderLinks(list, shop.menu);
  }
}

export function renderHeaderParts(): void {
  const { shop, products, categories } = state;
  if (!shop) return;
  renderTopbar(shop);
  renderHeader(shop, products.length);
  renderNav(shop);
  renderMobileMenu(shop);
  renderMegaMenu(categories, products);
}