import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import type {
  Shop, Category, Home, HomeBanner, HomeHero, ShopLink, DeptMenuItem,
  Product, Offer, CarouselConfig,
} from './types';
import { state, getQty } from './state';

export const notyf = new Notyf({
  duration: 2200,
  ripple: true,
  position: { x: 'left', y: 'bottom' },
  dismissible: true,
  types: [{ type: 'error', background: '#e11d48', icon: false }],
});

const priceFmt = new Intl.NumberFormat('fa-IR');

// ─── DOM helpers ──────────────────────────────
type ElementProps<K extends keyof HTMLElementTagNameMap> =
  Partial<HTMLElementTagNameMap[K]> & { dataset?: Record<string, string> };

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps<K> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { dataset, ...rest } = props;
  Object.assign(el, rest);
  if (dataset) for (const [k, v] of Object.entries(dataset)) el.dataset[k] = v;
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

export function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  // Drop loading skeleton chrome once real copy arrives (CLS placeholders in HTML)
  el.classList.remove(
    'skeleton-text',
    'skeleton-text--brand',
    'skeleton-text--tagline',
    'skeleton-text--action',
    'skeleton-text--dept',
    'skeleton-text--mobile-title',
    'skeleton-text--section-title',
    'skeleton-text--footer-title',
    'skeleton-text--about',
    'skeleton-text--copy',
    'skeleton-text--footer-top',
    'skeleton-text--topbar',
  );
  el.removeAttribute('aria-hidden');
}

function mkBtn(
  className: string,
  label: string,
  action?: 'inc' | 'dec',
  text?: string
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  if (action) btn.dataset.action = action;
  btn.setAttribute('aria-label', label);
  if (text !== undefined) btn.textContent = text;
  return btn;
}

export function makeEmoji(emoji: string): HTMLSpanElement {
  const span = h('span', { className: 'product__emoji', textContent: emoji || '🛒' });
  span.setAttribute('aria-hidden', 'true');
  return span;
}

export function createSvgIcon(pathD: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

export function cloneIcon(templateId: string): Node | null {
  const tpl = document.querySelector<HTMLTemplateElement>(`#${templateId}`);
  return tpl ? tpl.content.cloneNode(true) : null;
}

// ─── Cart button / stepper ────────────────────
export function renderCartButton(
  container: HTMLElement,
  productId: string | number,
  name: string
): void {
  container.replaceChildren();
  container.dataset.productId = String(productId);
  container.dataset.productName = name;

  const qty = getQty(productId);
  if (qty <= 0) {
    const addBtn = mkBtn('product__add', `افزودن ${name} به سبد خرید`, 'inc');
    const icon = cloneIcon('tpl-icon-plus');
    if (icon) addBtn.appendChild(icon);
    container.appendChild(addBtn);
    return;
  }

  const dec = mkBtn('product__qty-btn', `کم کردن ${name}`, 'dec', '−');

  const value = priceFmt.format(qty);
  const val = h('span', {
    className: 'product__qty-val',
    textContent: value,
  });
  val.setAttribute('aria-live', 'polite');
  val.setAttribute('aria-label', `تعداد ${name}: ${value}`);

  const inc = mkBtn('product__qty-btn', `افزودن ${name}`, 'inc', '+');

  const stepper = h('div', { className: 'product__qty' });
  stepper.append(dec, val, inc);
  container.appendChild(stepper);
}

// ─── Product card ─────────────────────────────
export function renderProductCard(
  product: Product,
  offer: Offer | null,
  stock: number
): HTMLLIElement {
  const outOfStock = stock === 0;
  const hasDiscount = !!offer && offer.percent > 0 && !outOfStock;

  const li = h('li', { className: 'products__item' });
  const article = h('article', {
    className: outOfStock ? 'product product--out-of-stock' : 'product',
  });

  const body = h('div', { className: 'product__link' });
  const imgWrap = h('span', { className: 'product__img' });

  if (product.image) {
    const img = h('img', {
      src: product.image,
      alt: product.name,
      loading: 'lazy',
      decoding: 'async',
      width: 200,
      height: 150,
    });
    img.onerror = () => {
      img.remove();
      imgWrap.classList.add('product__img--emoji');
      imgWrap.appendChild(makeEmoji(product.emoji));
    };
    imgWrap.appendChild(img);
  } else {
    imgWrap.classList.add('product__img--emoji');
    imgWrap.appendChild(makeEmoji(product.emoji));
  }

  if (outOfStock) {
    imgWrap.appendChild(h('span', { className: 'product__badge-stock', textContent: 'ناموجود' }));
  } else if (hasDiscount && offer) {
    const pct = new Intl.NumberFormat('fa-IR', { style: 'percent', maximumFractionDigits: 0 });
    const badge = h('span', {
      className: 'product__discount',
      textContent: pct.format(offer.percent / 100),
    });
    badge.setAttribute('aria-label', `${offer.percent} درصد تخفیف`);
    imgWrap.appendChild(badge);
  }

  const name = h('h3', {
    className: 'product__name',
    textContent: `${product.name} — ${product.unit}`,
  });

  body.append(imgWrap, name);

  const footer = h('div', { className: 'product__footer' });
  const price = h('span', { className: 'product__price' });

  const finalPrice = hasDiscount && offer
    ? Math.round(product.price * (1 - offer.percent / 100))
    : product.price;

  price.append(
    h('span', { className: 'product__current', textContent: priceFmt.format(finalPrice) }),
    h('span', { className: 'product__unit', textContent: 'تومان' })
  );

  if (hasDiscount) {
    const old = h('span', { className: 'product__old', textContent: priceFmt.format(product.price) });
    old.setAttribute('aria-label', `قیمت قبلی ${priceFmt.format(product.price)} تومان`);
    price.appendChild(old);
  }

  const actions = h('div', {
    className: 'product__actions',
    dataset: { productId: String(product.id), productName: product.name },
  });

  if (outOfStock) {
    const addBtn = mkBtn('product__add', `${product.name} ناموجود است`);
    addBtn.disabled = true;
    const icon = cloneIcon('tpl-icon-plus');
    if (icon) addBtn.appendChild(icon);
    actions.appendChild(addBtn);
  } else {
    renderCartButton(actions, product.id, product.name);
  }

  footer.append(price, actions);
  article.append(body, footer);
  li.appendChild(article);
  return li;
}

// ─── Shell ─────────────────────────────────────
function renderLinks(
  el: HTMLElement,
  links: ShopLink[],
  opts: { as?: 'ul' | 'div'; activeClass?: boolean } = {}
): void {
  const { as = 'div', activeClass = false } = opts;
  el.replaceChildren();

  links.forEach((item, i) => {
    const a = h('a', { href: item.href, textContent: item.label });
    if (activeClass && item.active) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    }

    if (as === 'ul') {
      const li = h('li');
      li.style.setProperty('--i', String(i));
      li.appendChild(a);
      el.appendChild(li);
    } else {
      el.appendChild(a);
    }
  });
}

function renderMegaMenu(items: DeptMenuItem[]): void {
  const ul = document.querySelector<HTMLUListElement>('#dept-menu');
  if (!ul) return;
  ul.replaceChildren();

  for (const item of items) {
    const li = h('li', { className: `dept-menu__item dept-menu__item--${item.modifier}` });
    const link = h('a', {
      className: 'dept-menu__link',
      href: item.href,
      textContent: item.label,
    });

    const cols = h('div', { className: 'dept-sub__cols' });
    for (const col of item.columns) {
      const list = h('ul', { className: 'dept-sub__list' });
      for (const text of col.links) {
        list.appendChild(h('li', {}, h('a', { href: item.href, textContent: text })));
      }
      cols.appendChild(
        h('div', {},
          h('h4', { className: 'dept-sub__title', textContent: col.title }),
          list
        )
      );
    }

    const sub = h('div', { className: `dept-sub dept-sub--${item.modifier}` }, cols);

    const media = h('span', { className: 'dept-promo__media' });
    media.setAttribute('aria-hidden', 'true');
    media.appendChild(
      h('img', {
        src: item.promo.image, alt: '', loading: 'lazy', decoding: 'async', width: 400, height: 600,
      })
    );

    const promo = h('a', { className: `dept-promo dept-promo--${item.modifier}`, href: item.href },
      media,
      h('span', { className: 'dept-promo__body' },
        h('span', { className: 'dept-promo__title', textContent: item.promo.title }),
        h('span', { className: 'dept-promo__desc', textContent: item.promo.desc })
      )
    );

    li.append(link, sub, promo);
    ul.appendChild(li);
  }
}

function renderContact(shop: Shop): void {
  const ul = document.querySelector<HTMLUListElement>('#footer-contact-list');
  if (!ul) return;
  ul.replaceChildren();

  if (shop.phone) {
    const a = h('a', { href: `tel:${shop.phoneLink || shop.phone}`, textContent: shop.phone, dir: 'ltr' });
    ul.appendChild(h('li', {}, a));
  }
  if (shop.email) {
    const a = h('a', { href: `mailto:${shop.email}`, textContent: shop.email, dir: 'ltr' });
    ul.appendChild(h('li', {}, a));
  }
  if (shop.address) {
    ul.appendChild(h('li', { textContent: shop.address }));
  }
}

function renderSchedule(schedule: { days: string; time: string }[]): void {
  const el = document.getElementById('footer-schedule');
  if (!el) return;
  const frag = document.createDocumentFragment();
  schedule.forEach((item, i) => {
    if (i > 0) frag.appendChild(document.createElement('br'));
    frag.appendChild(document.createTextNode(item.days));
    frag.appendChild(document.createElement('br'));
    frag.appendChild(document.createTextNode(item.time));
  });
  el.replaceChildren(frag);
}

function homeBannerSlides(home: Home): HomeBanner[] {
  if (Array.isArray(home.banners) && home.banners.length) return home.banners;
  const slides: HomeBanner[] = [];
  if (home.side) {
    slides.push({
      text: home.side.title || home.side.text,
      emoji: home.side.emoji || '🛒',
      color: '#f3e5f5',
      href: home.side.cta?.href || '#',
    });
  }
  if (Array.isArray(home.promos)) slides.push(...home.promos);
  return slides;
}


// ─── Shell skeletons (empty HTML shells) ─────
function cloneTemplate(id: string): DocumentFragment | null {
  const tpl = document.querySelector<HTMLTemplateElement>(`#${id}`);
  if (!tpl) return null;
  const node = tpl.content.cloneNode(true);
  return node instanceof DocumentFragment ? node : null;
}

function fillFromTemplate(
  containerId: string,
  templateId: string,
  count: number
): void {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.replaceChildren();
  for (let i = 0; i < count; i++) {
    const frag = cloneTemplate(templateId);
    if (!frag) continue;
    // --i inherits to .skeleton-text so card-in staggers like before
    for (const node of Array.from(frag.children)) {
      if (node instanceof HTMLElement) {
        node.style.setProperty('--i', String(i));
      }
    }
    el.appendChild(frag);
  }
}

/** Fill empty nav / mobile / category / topbar shells before fetch. */
export function renderShellSkeletons(): void {
  fillFromTemplate('topbar-links', 'tpl-skeleton-topbar-link', 3);
  fillFromTemplate('nav-list', 'tpl-skeleton-nav-item', 7);
  fillFromTemplate('mobile-menu-list', 'tpl-skeleton-mobile-item', 7);
  fillFromTemplate('categories-list', 'tpl-skeleton-category', 10);
}

export function renderBannerSkeletons(): void {
  const track = document.getElementById('banner-track');
  if (!track) return;

  const count = 5;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const li = h('li', { className: 'hero-carousel__slide hero-carousel__slide--skeleton' });
    if (i === 0) li.id = 'banner-start';
    if (i === count - 1) li.id = 'banner-end';
    li.appendChild(h('span', { className: 'hero-banner' }));
    frag.appendChild(li);
  }
  track.appendChild(frag);
}

export function renderShell(): void {
  const shop = state.shop;
  const home = state.home;
  if (!shop || !home) return;
  const categories = state.categories;
  const productCount = state.products.length;

  // Topbar
  const notice = document.getElementById('topbar-notice');
  if (notice) {
    notice.textContent = shop.notice;
    notice.classList.remove('skeleton-text', 'skeleton-text--topbar');
    notice.removeAttribute('aria-hidden');
  }
  const topbarLinks = document.getElementById('topbar-links');
  if (topbarLinks) {
    topbarLinks.removeAttribute('aria-busy');
    renderLinks(topbarLinks, shop.topbarLinks);
  }

  // Header
  const brand = document.querySelector<HTMLAnchorElement>('#header-brand');
  brand?.setAttribute('aria-label', `${shop.name} — صفحه اصلی`);
  setText('brand-name', shop.name);
  setText('brand-tagline', shop.slogan);

  const search = document.querySelector<HTMLInputElement>('#search-input');
  if (search) {
    search.placeholder =
      productCount > 0
        ? `جستجو در میان ${priceFmt.format(productCount)} کالا…`
        : (shop.searchPlaceholder || 'جستجوی محصول، برند یا دسته‌بندی…');
  }

  setText('label-location', shop.labels.location);
  setText('label-account', shop.labels.account);
  setText('label-cart', shop.labels.cart);

  // Nav
  setText('dept-btn-label', shop.labels.deptButton);

  const nav = document.querySelector<HTMLUListElement>('#nav-list');
  if (nav) {
    nav.removeAttribute('aria-busy');
    renderLinks(nav, shop.menu, { as: 'ul', activeClass: true });
  }

  setText('mobile-menu-title', shop.labels.mobileMenuTitle);

  const mobileList = document.querySelector<HTMLUListElement>('#mobile-menu-list');
  if (mobileList) {
    mobileList.removeAttribute('aria-busy');
    renderLinks(mobileList, shop.menu, { as: 'ul' });
  }

  renderMegaMenu(shop.deptMenu || []);

  // Hero
  const hero: HomeHero = home.hero || {};
  setText('hero-title', hero.title || '');
  setText('hero-desc', hero.desc || hero.text || '');

  const cta = document.querySelector<HTMLAnchorElement>('#hero-cta');
  if (cta) {
    const ctaHref = hero.ctaHref || (hero.cta && typeof hero.cta === 'object' ? hero.cta.href : undefined) || '#fruits';
    const ctaLabel =
      hero.ctaLabel ||
      (typeof hero.cta === 'string' ? hero.cta : typeof hero.cta === 'object' ? hero.cta.label : '');
    cta.href = ctaHref;
    cta.removeAttribute('aria-hidden');
    cta.removeAttribute('tabindex');
    setText('hero-cta-label', ctaLabel);
  }

  document.getElementById('hero-video')?.classList.remove('hero-video--skeleton');
  
  setText('categories-title', home.categoriesTitle || 'خرید از دسته‌بندی‌ها');

  // Banners
  const track = document.getElementById('banner-track');
  if (track) {
    const slides = homeBannerSlides(home);
    if (slides.length) {
      track.removeAttribute('aria-busy');
      track.replaceChildren();

      // ─── First slide: basket (built entirely via JS) ───
      const basketLi = h('li', {
        className: 'hero-carousel__slide hero-carousel__slide--basket is-active',
        id: 'banner-start',
      });

      const basketLink = h('a', {
        className: 'hero-banner hero-banner--basket',
        href: '#fruits',
      });

      // Basket wrapper (fruits + basket images)
      const basketWrap = h('div', { className: 'hero-carousel__basket-wrap' });
      basketWrap.setAttribute('aria-hidden', 'true');

      const fruitsImg = h('img', {
        className: 'hero-carousel__fruits',
        src: '/assets/images/promos/fruits.webp',
        alt: '',
        loading: 'eager',
      });

      const basketImg = h('img', {
        className: 'hero-carousel__basket',
        src: '/assets/images/promos/basket.webp',
        alt: '',
        loading: 'eager',
      });

      basketWrap.append(fruitsImg, basketImg);

      // Basket content
      const basketContent = h('div', { className: 'hero-carousel__basket-content' });

      const eyebrow = h('span', {
        className: 'hero-carousel__basket-eyebrow',
        textContent: '✦ تازه از مزرعه',
      });

      const basketTitle = h('h3', {
        className: 'hero-carousel__basket-title',
        textContent: 'پیشنهادهای ویژه هفته',
      });
      const basketArrow = h('span', {
        className: 'hero-carousel__basket-arrow',
        textContent: '←',
        ariaHidden: 'true',
      });
      basketTitle.appendChild(basketArrow);
      basketContent.append(eyebrow, basketTitle);
      basketLink.append(basketWrap, basketContent);
      basketLi.appendChild(basketLink);
      track.appendChild(basketLi);

      // ─── Other slides ───
      slides.forEach((b, i) => {
        const li = h('li', { className: 'hero-carousel__slide' });
        li.style.setProperty('--i', String(i + 1));
        if (i === slides.length - 1) li.id = 'banner-end';

        const a = h('a', {
          className: b.image ? 'hero-banner' : 'hero-banner hero-banner--promo',
          href: b.href || '#',
        });

        if (b.image) {
          const img = h('img', {
            src: b.image,
            alt: b.alt || b.text || '',
            width: 800,
            height: 500,
            decoding: 'async',
            loading: 'lazy',
          });
          a.appendChild(img);
        } else {
          a.style.backgroundColor = b.color || '#e3f1e7';
          const emoji = h('span', { className: 'hero-banner__emoji', textContent: b.emoji || '✨' });
          emoji.setAttribute('aria-hidden', 'true');
          a.append(emoji, h('span', { className: 'hero-banner__text', textContent: b.text || '' }));
        }

        li.appendChild(a);
        track.appendChild(li);
      });

      // ─── Carousel nav buttons, appended into the track's parent ───
      const carousel = track.parentElement;
      if (carousel && !carousel.querySelector('.hero-carousel__nav')) {
        const nav = h('nav', { className: 'hero-carousel__nav' });
        nav.setAttribute('aria-label', 'ناوبری کاروسل پیشنهادها');

        const btnStart = h('a', {
          href: '#banner-start',
          className: 'carousel-nav__btn carousel-nav__btn--start hero-carousel__nav-btn hero-carousel__nav-btn--start',
        });
        btnStart.setAttribute('aria-label', 'رفتن به ابتدای پیشنهادها');
        btnStart.appendChild(createSvgIcon('M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z'));

        const btnEnd = h('a', {
          href: '#banner-end',
          className: 'carousel-nav__btn carousel-nav__btn--end hero-carousel__nav-btn hero-carousel__nav-btn--end',
        });
        btnEnd.setAttribute('aria-label', 'رفتن به انتهای پیشنهادها');
        btnEnd.appendChild(createSvgIcon('M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z'));

        nav.append(btnStart, btnEnd);
        carousel.appendChild(nav);
      }
    }
  }

  // Footer
  const fBrand = document.querySelector<HTMLAnchorElement>('#footer-brand');
  fBrand?.setAttribute('aria-label', shop.name);
  setText('footer-brand-name', shop.name);
  setText('footer-brand-tagline', shop.slogan);
  setText('footer-about', shop.about);

  setText('footer-categories-title', 'دسته‌بندی‌ها');
  setText('footer-help-title', shop.labels.footerHelpTitle);
  setText('footer-contact-title', shop.labels.footerContactTitle);
  setText('footer-schedule-title', shop.labels.footerScheduleTitle);

  const helpList = document.querySelector<HTMLUListElement>('#footer-help-list');
  if (helpList) renderLinks(helpList, shop.help, { as: 'ul' });

  renderContact(shop);
  renderSchedule(shop.schedule);

  setText('footer-copyright', shop.copyright);
  setText('footer-top-label', shop.labels.footerTop);

  // Categories
  const catUl = document.querySelector<HTMLUListElement>('#categories-list');
  if (catUl) {
    catUl.replaceChildren();
    categories.forEach((cat, i) => {
      const li = h('li');
      li.style.setProperty('--i', String(i));
      const a = h('a', {
        className: 'category',
        href: `?cat=${encodeURIComponent(cat.slug)}#${cat.slug}`,
        dataset: { catSlug: cat.slug, categoryId: String(cat.id) },
      });
      if (i === 0) a.id = 'cat-start';
      if (i === categories.length - 1) a.id = 'cat-end';

      const imgWrap = h('span', { className: 'category__img' });
      if (cat.color) imgWrap.style.backgroundColor = cat.color;

      if (cat.image) {
        imgWrap.appendChild(
          h('img', { src: cat.image, alt: cat.name, loading: 'lazy', decoding: 'async', width: 200, height: 200 })
        );
      } else {
        const emoji = h('span', { className: 'product__emoji', textContent: cat.emoji || '🛒' });
        emoji.setAttribute('aria-hidden', 'true');
        imgWrap.appendChild(emoji);
      }

      a.append(imgWrap, h('span', { className: 'category__name', textContent: cat.name }));
      li.appendChild(a);
      catUl.appendChild(li);
    });
  }

  const footCats = document.querySelector<HTMLUListElement>('#footer-categories-list');
  if (footCats) {
    const links = categories.map((c) => ({ label: c.name, href: `?cat=${encodeURIComponent(c.slug)}#${c.slug}` }));
    renderLinks(footCats, links, { as: 'ul' });
  }

  document.title = `${shop.name} | ${shop.slogan}`;
}

// ─── Carousels ────────────────────────────────
function buildCarouselSection(cfg: CarouselConfig): HTMLElement {
  const isOffers = cfg.source === 'offers' || cfg.variant === 'offers';
  const section = h('section', {
    className: isOffers ? 'products products--offers' : 'products',
    id: cfg.id,
  });
  section.setAttribute('aria-labelledby', `${cfg.id}-title`);

  const head = h('div', { className: 'products__head' });

  if (isOffers && cfg.sub) {
    head.appendChild(
      h('div', { className: 'offers__heading' },
        h('h2', { id: `${cfg.id}-title`, className: 'products__title', textContent: cfg.title }),
        h('p', { id: `${cfg.id}-sub`, className: 'offers__sub', textContent: cfg.sub })
      )
    );
  } else {
    head.appendChild(
      h('h2', { id: `${cfg.id}-title`, className: 'products__title', textContent: cfg.title })
    );
  }

  const nav = h('nav', { className: 'carousel-nav' });
  nav.setAttribute('aria-label', `ناوبری کاروسل ${cfg.title}`);

  const start = h('a', {
    href: `#${cfg.id}-start`,
    className: 'carousel-nav__btn carousel-nav__btn--start',
  });
  start.setAttribute('aria-label', `رفتن به ابتدای ${cfg.title}`);
  start.appendChild(createSvgIcon('M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z'));

  const end = h('a', {
    href: `#${cfg.id}-end`,
    className: 'carousel-nav__btn carousel-nav__btn--end',
  });
  end.setAttribute('aria-label', `رفتن به انتهای ${cfg.title}`);
  end.appendChild(createSvgIcon('M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z'));

  nav.append(start, end);
  head.appendChild(nav);

  const status = h('div', { className: 'products__status', id: `${cfg.id}-status` });
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;

  const grid = h('ul', { className: 'products__grid', id: `${cfg.id}-grid`, tabIndex: 0 });
  grid.setAttribute('aria-label', cfg.title);
  grid.appendChild(skeletonCards(7));

  const main = h('div', { className: 'products__main' }, head, status, grid);
  const inner = h('div', { className: 'products__inner' }, main);
  const container = h('div', { className: 'container' }, inner);
  section.appendChild(container);
  return section;
}

function productsForCarousel(
  cfg: CarouselConfig,
  products: Product[],
  offerMap: Map<number, Offer>
): Product[] {
  if (cfg.source === 'offers') {
    return [...offerMap.keys()]
      .map((id) => products.find((x) => x.id === id))
      .filter((p): p is Product => p !== undefined)
      .sort((a, b) => (offerMap.get(b.id)?.percent || 0) - (offerMap.get(a.id)?.percent || 0));
  }
  if (cfg.categoryId != null) {
    return products.filter((p) => p.categoryId === cfg.categoryId);
  }
  return [];
}

export function renderCarousels(home: Home | null = state.home): void {
  if (!home) return;
  const stockData = state.stockData;
  if (!stockData) return;
  const root = document.getElementById('carousels-root');
  if (!root) return;

  const products = state.products;
  const stockMap = new Map<number, number>(
    products.map((p) => [p.id, stockData.items[p.id] ?? 0])
  );
  const offerMap = new Map<number, Offer>(state.offers.map((o) => [o.productId, o]));

  for (const cfg of home.carousels) {
    let section = document.getElementById(cfg.id);
    if (!section) {
      section = buildCarouselSection(cfg);
      root.appendChild(section);
    } else {
      if (cfg.title) setText(`${cfg.id}-title`, cfg.title);
      if (cfg.sub) setText(`${cfg.id}-sub`, cfg.sub);
    }

    const list = productsForCarousel(cfg, products, offerMap);
    fillSectionGrid(cfg.id, list, offerMap, stockMap);

    document.getElementById(`${cfg.id}-grid`)?.removeAttribute('aria-busy');
  }
}

export function renderError(sectionId: string, message: string): void {
  const grid = document.getElementById(`${sectionId}-grid`);
  const status = document.getElementById(`${sectionId}-status`);
  if (!grid || !status) return;

  grid.hidden = true;
  grid.replaceChildren();
  grid.removeAttribute('aria-busy');

  status.hidden = false;
  status.className = 'products__status products__status--error';
  status.replaceChildren();

  const icon = h('span', { className: 'products__status-icon', textContent: '⚠️' });
  icon.setAttribute('aria-hidden', 'true');

  status.append(
    icon,
    h('p', { className: 'products__status-title', textContent: 'بارگذاری ناموفق' }),
    h('p', { className: 'products__status-text', textContent: message })
  );
}

export function fillSectionGrid(
  sectionId: string,
  list: Product[],
  offerMap: Map<number, Offer>,
  stockMap: Map<number, number>
): void {
  const grid = document.getElementById(`${sectionId}-grid`);
  const status = document.getElementById(`${sectionId}-status`);
  if (!grid || !status) return;

  if (list.length === 0) {
    renderError(sectionId, 'در حال حاضر محصولی برای نمایش نیست.');
    return;
  }

  status.hidden = true;
  status.replaceChildren();
  grid.hidden = false;
  grid.replaceChildren();

  const frag = document.createDocumentFragment();
  list.forEach((product, i) => {
    const card = renderProductCard(product, offerMap.get(product.id) || null, stockMap.get(product.id) ?? 0);
    card.style.setProperty('--i', String(i));
    if (i === 0) card.id = `${sectionId}-start`;
    if (i === list.length - 1) card.id = `${sectionId}-end`;
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

export function skeletonCards(count: number): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    frag.appendChild(
      h('li', { className: 'products__item' },
        h('article', { className: 'product product--skeleton' },
          h('div', { className: 'product__link' },
            h('span', { className: 'product__img' }),
            h('h3', { className: 'product__name', textContent: '—' })
          ),
          h('div', { className: 'product__footer' },
            h('span', { className: 'product__price' },
              h('span', { className: 'product__current', textContent: '—' })
            ),
            h('span', { className: 'product__add' })
          )
        )
      )
    );
  }
  return frag;
}

// ─── Carousel controls ────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getTrack(btn: HTMLElement): HTMLElement | null {
  if (!(btn instanceof Element)) return null;
  const hero = btn.closest<HTMLElement>('.hero-carousel');
  if (hero) return hero.querySelector<HTMLElement>('.hero-carousel__track');

  const cats = btn.closest<HTMLElement>('.categories');
  if (cats) return cats.querySelector<HTMLElement>('.categories__list');

  const prod = btn.closest<HTMLElement>('.products');
  if (prod) return prod.querySelector<HTMLElement>('.products__grid');

  return null;
}

function updateNavState(track: HTMLElement): void {
  const container = track.closest<HTMLElement>(
    '.hero-carousel, .categories, .products'
  );
  if (!container) return;

  const startBtn = container.querySelector<HTMLElement>(
    '.carousel-nav__btn--start'
  );
  const endBtn = container.querySelector<HTMLElement>(
    '.carousel-nav__btn--end'
  );
  if (!startBtn && !endBtn) return;

  const items = track.children;
  if (!items.length) {
    startBtn?.classList.add('is-disabled');
    endBtn?.classList.add('is-disabled');
    return;
  }

  const first = items[0];
  const last = items[items.length - 1];

  const realBox = (el: Element): DOMRect => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) return r;
    const child = el.firstElementChild;
    return child ? child.getBoundingClientRect() : r;
  };

  const trackRect = track.getBoundingClientRect();
  const firstRect = realBox(first);
  const lastRect = realBox(last);

  const scrollable = track.scrollWidth - track.clientWidth > 2;

  const firstVisibleFromStart =
    firstRect.right <= trackRect.right + 2 &&
    firstRect.left >= trackRect.left - 2;

  const lastVisibleFromEnd =
    lastRect.left >= trackRect.left - 2 &&
    lastRect.right <= trackRect.right + 2;

  startBtn?.classList.toggle(
    'is-disabled',
    !scrollable || firstVisibleFromStart
  );
  endBtn?.classList.toggle(
    'is-disabled',
    !scrollable || lastVisibleFromEnd
  );
}

function scrollTrack(track: HTMLElement, toEnd: boolean): void {
  const items = track.children;
  if (!items.length) return;

  const target = toEnd ? items[items.length - 1] : items[0];
  if (!target) return;

  target.scrollIntoView({
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    block: 'nearest',
    inline: toEnd ? 'end' : 'start',
  });
}

export function setupCarouselControls(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    const btn = e.target.closest<HTMLElement>('.carousel-nav__btn');
    if (!btn) return;
    if (btn.classList.contains('is-disabled')) return;

    const track = getTrack(btn);
    if (!track) return;

    scrollTrack(track, btn.classList.contains('carousel-nav__btn--end'));
  });

  document.addEventListener(
    'scroll',
    (e) => {
      const track = e.target;
      if (!(track instanceof HTMLElement)) return;
      if (
        track.classList.contains('products__grid') ||
        track.classList.contains('categories__list') ||
        track.classList.contains('hero-carousel__track')
      ) {
        updateNavState(track);
      }
    },
    { capture: true, passive: true }
  );

  const root = document.getElementById('carousels-root');
  if (root) {
    new MutationObserver(() => {
      root
        .querySelectorAll<HTMLElement>('.products__grid')
        .forEach(updateNavState);
    }).observe(root, { childList: true, subtree: true });
  }

  document
    .querySelectorAll<HTMLElement>(
      '.hero-carousel__track, .categories__list, .products__grid'
    )
    .forEach(updateNavState);

  const heroTrack = document.querySelector<HTMLElement>('.hero-carousel__track');
  if (heroTrack && 'IntersectionObserver' in window) {
    const slides = heroTrack.querySelectorAll<HTMLElement>('.hero-carousel__slide');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            'is-active',
            entry.intersectionRatio > 0.6
          );
        });
      },
      { root: heroTrack, threshold: [0, 0.6, 1] }
    );
    slides.forEach((slide) => observer.observe(slide));
  }
}