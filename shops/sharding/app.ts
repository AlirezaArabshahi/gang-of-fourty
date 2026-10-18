import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import Fuse from 'fuse.js';

import {
  enrichShop,
  enrichCategories,
  enrichHome,
  enrichProduct,
} from './overrides';

const API = {
  products: '/api/products.json',
  stock: '/api/stock.json',
  offers: '/api/offers.json',
  shop: '/api/shop.json',
  categories: '/api/categories.json',
  home: '/api/home.json',
};

const MIN_SKELETON_MS = 300;
const TIMEOUT_MS = 8000;

const priceFmt = new Intl.NumberFormat('fa-IR');
const percentFmt = new Intl.NumberFormat('fa-IR', {
  style: 'percent',
  maximumFractionDigits: 0,
});

const notyf = new Notyf({
  duration: 2200,
  ripple: true,
  position: { x: 'left', y: 'bottom' },
  dismissible: true,
  types: [
    {
      type: 'error',
      background: '#e11d48', 
      icon: false
    }
  ]
});

let productFuse: Fuse<any> | null = null;

function getShopSlug() {
  const parts = location.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('shops');
  return i !== -1 && parts[i + 1] ? parts[i + 1] : 'default';
}

const CART_KEY = `shop:${getShopSlug()}:v1:cart`;

function readCart(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const out: Record<string, number> = {};
    for (const [id, qty] of Object.entries(data)) {
      const n = Number(qty);
      if (Number.isFinite(n) && n > 0) out[String(id)] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

function writeCart(cart: Record<string, number>) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {}
}

function cartTotal(cart: Record<string, number>): number {
  return Object.values(cart).reduce((sum: number, n: number) => sum + n, 0);
}

function getCartQty(productId: string | number): number {
  return readCart()[String(productId)] || 0;
}

function setCartQty(productId: string | number, qty: number): number {
  const cart = readCart();
  const id = String(productId);
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  if (n <= 0) delete cart[id];
  else cart[id] = n;
  writeCart(cart);
  updateCartUI(cartTotal(cart));
  return n;
}

function updateCartUI(total: number) {
  const badge = document.getElementById('cart-badge');
  const status = document.getElementById('cart-status');
  if (badge) {
    badge.textContent = priceFmt.format(total);
    badge.hidden = total === 0;
  }
  if (status) {
    status.textContent =
      total === 0
        ? 'سبد خرید خالی است'
        : `${priceFmt.format(total)} کالا در سبد خرید`;
  }
}

function makeEmoji(emoji: string) {
  const span = document.createElement('span');
  span.className = 'product__emoji';
  span.textContent = emoji || '🛒';
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function createSvgIcon(pathD: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

function renderCardActions(container: HTMLElement, qty: number) {
  container.replaceChildren();
  const name = container.dataset.productName || 'محصول';

  if (qty <= 0) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'product__add';
    addBtn.dataset.action = 'inc';
    addBtn.setAttribute('aria-label', `افزودن ${name} به سبد خرید`);
    const tpl = document.querySelector<HTMLTemplateElement>('#tpl-icon-plus');
    if (tpl) addBtn.appendChild(tpl.content.cloneNode(true));
    container.appendChild(addBtn);
    return;
  }

  const stepper = document.createElement('div');
  stepper.className = 'product__qty';

  const dec = document.createElement('button');
  dec.type = 'button';
  dec.className = 'product__qty-btn';
  dec.dataset.action = 'dec';
  dec.setAttribute('aria-label', `کم کردن ${name}`);
  dec.textContent = '−';

  const val = document.createElement('span');
  val.className = 'product__qty-val';
  val.textContent = priceFmt.format(qty);
  val.setAttribute('aria-live', 'polite');
  val.setAttribute('aria-label', `تعداد ${name}: ${priceFmt.format(qty)}`);

  const inc = document.createElement('button');
  inc.type = 'button';
  inc.className = 'product__qty-btn';
  inc.dataset.action = 'inc';
  inc.setAttribute('aria-label', `افزودن ${name}`);
  inc.textContent = '+';

  stepper.append(dec, val, inc);
  container.appendChild(stepper);
}

function createCard(
  product: any,
  { offer, stock }: { offer: any; stock: number }
) {
  const outOfStock = stock === 0;
  const hasDiscount = offer && offer.percent > 0 && !outOfStock;

  const li = document.createElement('li');
  li.className = 'products__item';

  const article = document.createElement('article');
  article.className = outOfStock ? 'product product--out-of-stock' : 'product';

  const body = document.createElement('div');
  body.className = 'product__link';

  const imgWrap = document.createElement('span');
  imgWrap.className = 'product__img';

  if (product.image) {
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 200;
    img.height = 150;
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
    const badge = document.createElement('span');
    badge.className = 'product__badge-stock';
    badge.textContent = 'ناموجود';
    imgWrap.appendChild(badge);
  } else if (hasDiscount) {
    const badge = document.createElement('span');
    badge.className = 'product__discount';
    badge.textContent = percentFmt.format(offer.percent / 100);
    badge.setAttribute('aria-label', `${offer.percent} درصد تخفیف`);
    imgWrap.appendChild(badge);
  }

  const name = document.createElement('h3');
  name.className = 'product__name';
  name.textContent = `${product.name} — ${product.unit}`;

  body.append(imgWrap, name);

  const footer = document.createElement('div');
  footer.className = 'product__footer';

  const price = document.createElement('span');
  price.className = 'product__price';

  const finalPrice = hasDiscount
    ? Math.round(product.price * (1 - offer.percent / 100))
    : product.price;

  const current = document.createElement('span');
  current.className = 'product__current';
  current.textContent = priceFmt.format(finalPrice);

  const unit = document.createElement('span');
  unit.className = 'product__unit';
  unit.textContent = 'تومان';

  price.append(current, unit);

  if (hasDiscount) {
    const old = document.createElement('span');
    old.className = 'product__old';
    old.textContent = priceFmt.format(product.price);
    old.setAttribute(
      'aria-label',
      `قیمت قبلی ${priceFmt.format(product.price)} تومان`
    );
    price.appendChild(old);
  }

  const actions = document.createElement('div');
  actions.className = 'product__actions';
  actions.dataset.productId = String(product.id);
  actions.dataset.productName = product.name;

  if (outOfStock) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'product__add';
    addBtn.disabled = true;
    addBtn.setAttribute('aria-label', `${product.name} ناموجود است`);
    const tpl = document.querySelector<HTMLTemplateElement>('#tpl-icon-plus');
    if (tpl) addBtn.appendChild(tpl.content.cloneNode(true));
    actions.appendChild(addBtn);
  } else {
    renderCardActions(actions, getCartQty(product.id));
  }

  footer.append(price, actions);
  article.append(body, footer);
  li.appendChild(article);
  return li;
}

function showError(sectionId: string, message: string) {
  const grid = document.getElementById(`${sectionId}-grid`);
  const status = document.getElementById(`${sectionId}-status`);
  if (!grid || !status) return;

  grid.hidden = true;
  grid.replaceChildren();
  grid.removeAttribute('aria-busy');

  status.hidden = false;
  status.className = 'products__status products__status--error';
  status.replaceChildren();

  const icon = document.createElement('span');
  icon.className = 'products__status-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '⚠️';

  const title = document.createElement('p');
  title.className = 'products__status-title';
  title.textContent = 'بارگذاری ناموفق';

  const text = document.createElement('p');
  text.className = 'products__status-text';
  text.textContent = message;

  status.append(icon, title, text);
}

function showCarouselErrors(message: string) {
  const ids = new Set(['offers', 'fruits', 'dairy']);
  document.querySelectorAll('[id$="-grid"]').forEach((grid) => {
    const id = grid.id.replace(/-grid$/, '');
    if (id) ids.add(id);
  });
  ids.forEach((id) => showError(id, message));
}

function fillSectionGrid(
  sectionId: string,
  list: any[],
  offerMap: Map<number, any>,
  stockMap: Map<number, number>
) {
  const grid = document.getElementById(`${sectionId}-grid`);
  const status = document.getElementById(`${sectionId}-status`);
  if (!grid || !status) return;

  if (list.length === 0) {
    showError(sectionId, 'در حال حاضر محصولی برای نمایش نیست.');
    return;
  }

  status.hidden = true;
  status.replaceChildren();
  grid.hidden = false;
  grid.replaceChildren();

  const frag = document.createDocumentFragment();
  list.forEach((product, i) => {
    const card = createCard(product, {
      offer: offerMap.get(product.id) || null,
      stock: stockMap.get(product.id) ?? 0,
    });
    if (i === 0) card.id = `${sectionId}-start`;
    if (i === list.length - 1) card.id = `${sectionId}-end`;
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

function renderSimpleLinks(el: HTMLElement, links: any[]) {
  el.replaceChildren();
  for (const item of links) {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    el.appendChild(a);
  }
}

function renderListLinks(el: HTMLElement, links: any[]) {
  el.replaceChildren();
  for (const item of links) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    li.appendChild(a);
    el.appendChild(li);
  }
}

function renderNavList(el: HTMLElement, links: any[]) {
  el.replaceChildren();
  for (const item of links) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    if (item.active) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    }
    li.appendChild(a);
    el.appendChild(li);
  }
}

function renderMegaMenu(items: any[]) {
  const ul = document.querySelector<HTMLUListElement>('#dept-menu');
  if (!ul) return;
  ul.replaceChildren();

  for (const item of items) {
    const li = document.createElement('li');
    li.className = `dept-menu__item dept-menu__item--${item.modifier}`;

    const link = document.createElement('a');
    link.className = 'dept-menu__link';
    link.href = item.href;
    link.textContent = item.label;

    const sub = document.createElement('div');
    sub.className = `dept-sub dept-sub--${item.modifier}`;

    const cols = document.createElement('div');
    cols.className = 'dept-sub__cols';

    for (const col of item.columns) {
      const colEl = document.createElement('div');

      const title = document.createElement('h4');
      title.className = 'dept-sub__title';
      title.textContent = col.title;

      const list = document.createElement('ul');
      list.className = 'dept-sub__list';

      for (const text of col.links) {
        const subLi = document.createElement('li');
        const subA = document.createElement('a');
        subA.href = item.href;
        subA.textContent = text;
        subLi.appendChild(subA);
        list.appendChild(subLi);
      }

      colEl.append(title, list);
      cols.appendChild(colEl);
    }

    sub.appendChild(cols);

    const promo = document.createElement('a');
    promo.className = `dept-promo dept-promo--${item.modifier}`;
    promo.href = item.href;

    const media = document.createElement('span');
    media.className = 'dept-promo__media';
    media.setAttribute('aria-hidden', 'true');

    const img = document.createElement('img');
    img.src = item.promo.image;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 400;
    img.height = 600;
    media.appendChild(img);

    const body = document.createElement('span');
    body.className = 'dept-promo__body';

    const pTitle = document.createElement('span');
    pTitle.className = 'dept-promo__title';
    pTitle.textContent = item.promo.title;

    const pDesc = document.createElement('span');
    pDesc.className = 'dept-promo__desc';
    pDesc.textContent = item.promo.desc;

    body.append(pTitle, pDesc);
    promo.append(media, body);

    li.append(link, sub, promo);
    ul.appendChild(li);
  }
}

function renderTopbar(shop: any) {
  const notice = document.querySelector<HTMLElement>('#topbar-notice');
  if (!notice) throw new Error('index.html is missing #topbar-notice');
  notice.textContent = shop.notice;
  notice.classList.remove('skeleton-text', 'skeleton-text--topbar');
  notice.removeAttribute('aria-hidden');

  const links = document.querySelector<HTMLElement>('#topbar-links');
  if (!links) throw new Error('index.html is missing #topbar-links');
  links.removeAttribute('aria-busy');
  renderSimpleLinks(links, shop.topbarLinks);
}

function renderHeader(shop: any, productCount: number) {
  const brand = document.querySelector<HTMLAnchorElement>('#header-brand');
  if (!brand) throw new Error('index.html is missing #header-brand');
  brand.setAttribute('aria-label', `${shop.name} — صفحه اصلی`);

  const name = document.querySelector<HTMLElement>('#brand-name');
  if (!name) throw new Error('index.html is missing #brand-name');
  name.textContent = shop.name;

  const tagline = document.querySelector<HTMLElement>('#brand-tagline');
  if (!tagline) throw new Error('index.html is missing #brand-tagline');
  tagline.textContent = shop.slogan;

  const search = document.querySelector<HTMLInputElement>('#search-input');
  if (!search) throw new Error('index.html is missing #search-input');
  if (typeof productCount === 'number' && productCount > 0) {
    search.placeholder = `جستجو در میان ${priceFmt.format(productCount)} کالا…`;
  } else {
    search.placeholder =
      shop.searchPlaceholder || 'جستجوی محصول، برند یا دسته‌بندی…';
  }

  const location = document.querySelector<HTMLElement>('#label-location');
  if (!location) throw new Error('index.html is missing #label-location');
  location.textContent = shop.labels.location;

  const account = document.querySelector<HTMLElement>('#label-account');
  if (!account) throw new Error('index.html is missing #label-account');
  account.textContent = shop.labels.account;

  const cart = document.querySelector<HTMLElement>('#label-cart');
  if (!cart) throw new Error('index.html is missing #label-cart');
  cart.textContent = shop.labels.cart;
}

function renderNavMenus(shop: any) {
  const btn = document.querySelector<HTMLElement>('#dept-btn-label');
  if (!btn) throw new Error('index.html is missing #dept-btn-label');
  btn.textContent = shop.labels.deptButton;

  const navList = document.querySelector<HTMLUListElement>('#nav-list');
  if (!navList) throw new Error('index.html is missing #nav-list');
  navList.removeAttribute('aria-busy');
  renderNavList(navList, shop.menu);

  const title = document.querySelector<HTMLElement>('#mobile-menu-title');
  if (!title) throw new Error('index.html is missing #mobile-menu-title');
  title.textContent = shop.labels.mobileMenuTitle;

  const mobileList = document.querySelector<HTMLUListElement>('#mobile-menu-list');
  if (!mobileList) throw new Error('index.html is missing #mobile-menu-list');
  mobileList.removeAttribute('aria-busy');
  renderListLinks(mobileList, shop.menu);

  renderMegaMenu(shop.deptMenu || []);
}

function renderContactList(shop: any) {
  const ul = document.querySelector<HTMLUListElement>('#footer-contact-list');
  if (!ul) throw new Error('index.html is missing #footer-contact-list');
  ul.replaceChildren();

  if (shop.phone) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `tel:${shop.phoneLink || shop.phone}`;
    a.dir = 'ltr';
    a.textContent = shop.phone;
    li.appendChild(a);
    ul.appendChild(li);
  }

  if (shop.email) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `mailto:${shop.email}`;
    a.dir = 'ltr';
    a.textContent = shop.email;
    li.appendChild(a);
    ul.appendChild(li);
  }

  if (shop.address) {
    const li = document.createElement('li');
    li.textContent = shop.address;
    ul.appendChild(li);
  }
}

function renderSchedule(schedule: any[]) {
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

function renderFooter(shop: any) {
  const brand = document.querySelector<HTMLAnchorElement>('#footer-brand');
  if (!brand) throw new Error('index.html is missing #footer-brand');
  brand.setAttribute('aria-label', shop.name);

  const name = document.querySelector<HTMLElement>('#footer-brand-name');
  if (!name) throw new Error('index.html is missing #footer-brand-name');
  name.textContent = shop.name;

  const tagline = document.querySelector<HTMLElement>('#footer-brand-tagline');
  if (!tagline) throw new Error('index.html is missing #footer-brand-tagline');
  tagline.textContent = shop.slogan;

  const about = document.querySelector<HTMLElement>('#footer-about');
  if (!about) throw new Error('index.html is missing #footer-about');
  about.textContent = shop.about;

  const helpTitle = document.querySelector<HTMLElement>('#footer-help-title');
  if (!helpTitle) throw new Error('index.html is missing #footer-help-title');
  helpTitle.textContent = shop.labels.footerHelpTitle;

  const contactTitle = document.querySelector<HTMLElement>('#footer-contact-title');
  if (!contactTitle) throw new Error('index.html is missing #footer-contact-title');
  contactTitle.textContent = shop.labels.footerContactTitle;

  const scheduleTitle = document.querySelector<HTMLElement>('#footer-schedule-title');
  if (!scheduleTitle) throw new Error('index.html is missing #footer-schedule-title');
  scheduleTitle.textContent = shop.labels.footerScheduleTitle;

  const helpList = document.querySelector<HTMLUListElement>('#footer-help-list');
  if (helpList) renderListLinks(helpList, shop.help);

  renderContactList(shop);
  renderSchedule(shop.schedule);

  const copyright = document.querySelector<HTMLElement>('#footer-copyright');
  if (copyright) copyright.textContent = shop.copyright;

  const top = document.querySelector<HTMLElement>('#footer-top-label');
  if (!top) throw new Error('index.html is missing #footer-top-label');
  top.textContent = shop.labels.footerTop;
}

function renderCategories(items: any[]) {
  const ul = document.querySelector<HTMLUListElement>('#categories-list');
  if (!ul) throw new Error('index.html is missing #categories-list');
  ul.replaceChildren();

  items.forEach((cat, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'category';
    a.dataset.catSlug = cat.slug;
    a.dataset.categoryId = String(cat.id);
    a.href = `?cat=${encodeURIComponent(cat.slug)}#${cat.slug}`;

    if (i === 0) a.id = 'cat-start';
    if (i === items.length - 1) a.id = 'cat-end';

    const imgWrap = document.createElement('span');
    imgWrap.className = 'category__img';
    if (cat.color) imgWrap.style.backgroundColor = cat.color;

    if (cat.image) {
      const img = document.createElement('img');
      img.src = cat.image;
      img.alt = cat.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 200;
      img.height = 200;
      imgWrap.appendChild(img);
    } else {
      const emoji = document.createElement('span');
      emoji.className = 'product__emoji';
      emoji.textContent = cat.emoji || '🛒';
      emoji.setAttribute('aria-hidden', 'true');
      imgWrap.appendChild(emoji);
    }

    const name = document.createElement('span');
    name.className = 'category__name';
    name.textContent = cat.name;

    a.append(imgWrap, name);
    li.appendChild(a);
    ul.appendChild(li);
  });
}

function renderFooterCategories(items: any[]) {
  const ul = document.querySelector<HTMLUListElement>('#footer-categories-list');
  if (!ul) return;
  const links = items.map((cat) => ({
    label: cat.name,
    href: `?cat=${encodeURIComponent(cat.slug)}#${cat.slug}`,
  }));
  renderListLinks(ul, links);
}

function renderHero(home: any) {
  const hero = home.hero || {};

  const title = document.querySelector<HTMLElement>('#hero-title');
  if (!title) throw new Error('index.html is missing #hero-title');
  title.textContent = hero.title || '';

  const desc = document.querySelector<HTMLElement>('#hero-desc');
  if (!desc) throw new Error('index.html is missing #hero-desc');
  desc.textContent = hero.desc || hero.text || '';

  const cta = document.querySelector<HTMLAnchorElement>('#hero-cta');
  if (!cta) throw new Error('index.html is missing #hero-cta');
  const ctaHref = hero.ctaHref || (hero.cta && hero.cta.href) || '#fruits';
  const ctaLabel =
    hero.ctaLabel ||
    (typeof hero.cta === 'string' ? hero.cta : hero.cta && hero.cta.label) ||
    '';
  cta.href = ctaHref;
  cta.removeAttribute('aria-hidden');
  cta.removeAttribute('tabindex');

  const label = document.querySelector<HTMLElement>('#hero-cta-label');
  if (!label) throw new Error('index.html is missing #hero-cta-label');
  label.textContent = ctaLabel;

  document.getElementById('hero-video')?.classList.remove('hero-video--skeleton');

  const weekly = document.getElementById('weekly-title');
  if (weekly) {
    weekly.textContent =
      home.weeklyTitle || (home.side && home.side.title) || '';
    weekly.classList.remove('hero-carousel__title--skeleton');
  }

  const catTitle = document.getElementById('categories-title');
  if (catTitle && home.categoriesTitle) {
    catTitle.textContent = home.categoriesTitle;
  }
}

function homeBannerSlides(home: any) {
  if (Array.isArray(home.banners) && home.banners.length) {
    return home.banners.map((b: any) => ({
      image: b.image,
      alt: b.alt || '',
      href: b.href || '#',
    }));
  }
  const slides: any[] = [];
  if (home.side) {
    slides.push({
      text: home.side.title || home.side.text,
      emoji: home.side.emoji || '🛒',
      color: '#f3e5f5',
      href: (home.side.cta && home.side.cta.href) || '#',
    });
  }
  if (Array.isArray(home.promos)) {
    for (const p of home.promos) {
      slides.push({
        text: p.text,
        emoji: p.emoji || '✨',
        color: p.color || '#e3f1e7',
        href: p.href || '#',
      });
    }
  }
  return slides;
}

function renderBanners(home: any) {
  const track = document.getElementById('banner-track');
  if (!track) return;

  const slides = homeBannerSlides(home);
  if (!slides.length) return;

  track.removeAttribute('aria-busy');
  track.replaceChildren();

  slides.forEach((b: any, i: number) => {
    const li = document.createElement('li');
    li.className = 'hero-carousel__slide' + (i === 0 ? ' is-active' : '');
    if (i === 0) li.id = 'banner-start';
    if (i === slides.length - 1) li.id = 'banner-end';

    const a = document.createElement('a');
    a.className = b.image ? 'hero-banner' : 'hero-banner hero-banner--promo';
    a.href = b.href || '#';

    if (b.image) {
      const img = document.createElement('img');
      img.src = b.image;
      img.alt = b.alt || b.text || '';
      img.width = 800;
      img.height = 500;
      img.decoding = 'async';
      if (i === 0) img.fetchPriority = 'high';
      else img.loading = 'lazy';
      a.appendChild(img);
    } else {
      a.style.backgroundColor = b.color || '#e3f1e7';
      const emoji = document.createElement('span');
      emoji.className = 'hero-banner__emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = b.emoji || '✨';
      const text = document.createElement('span');
      text.className = 'hero-banner__text';
      text.textContent = b.text || '';
      a.append(emoji, text);
    }

    li.appendChild(a);
    track.appendChild(li);
  });
}

function skeletonCards(count: number) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const li = document.createElement('li');
    li.className = 'products__item';

    const article = document.createElement('article');
    article.className = 'product product--skeleton';
    article.setAttribute('aria-hidden', 'true');

    const link = document.createElement('div');
    link.className = 'product__link';

    const img = document.createElement('span');
    img.className = 'product__img';

    const name = document.createElement('h3');
    name.className = 'product__name';
    name.textContent = '—';

    link.append(img, name);

    const footer = document.createElement('div');
    footer.className = 'product__footer';

    const price = document.createElement('span');
    price.className = 'product__price';

    const current = document.createElement('span');
    current.className = 'product__current';
    current.textContent = '—';

    price.appendChild(current);

    const add = document.createElement('span');
    add.className = 'product__add';

    footer.append(price, add);
    article.append(link, footer);
    li.appendChild(article);
    frag.appendChild(li);
  }
  return frag;
}

function buildCarouselSection(cfg: any) {
  const isOffers = cfg.source === 'offers' || cfg.variant === 'offers';
  const section = document.createElement('section');
  section.className = isOffers ? 'products products--offers' : 'products';
  section.id = cfg.id;
  section.setAttribute('aria-labelledby', `${cfg.id}-title`);

  const container = document.createElement('div');
  container.className = 'container';

  const inner = document.createElement('div');
  inner.className = 'products__inner';

  const main = document.createElement('div');
  main.className = 'products__main';

  const head = document.createElement('div');
  head.className = 'products__head';

  if (isOffers && cfg.sub) {
    const heading = document.createElement('div');
    heading.className = 'offers__heading';
    const h2 = document.createElement('h2');
    h2.id = `${cfg.id}-title`;
    h2.className = 'products__title';
    h2.textContent = cfg.title;
    const sub = document.createElement('p');
    sub.className = 'offers__sub';
    sub.id = `${cfg.id}-sub`;
    sub.textContent = cfg.sub;
    heading.append(h2, sub);
    head.appendChild(heading);
  } else {
    const h2 = document.createElement('h2');
    h2.id = `${cfg.id}-title`;
    h2.className = 'products__title';
    h2.textContent = cfg.title;
    head.appendChild(h2);
  }

  const nav = document.createElement('nav');
  nav.className = 'carousel-nav';
  nav.setAttribute('aria-label', `ناوبری کاروسل ${cfg.title}`);

  const btnStart = document.createElement('a');
  btnStart.href = `#${cfg.id}-start`;
  btnStart.className = 'carousel-nav__btn carousel-nav__btn--start';
  btnStart.setAttribute('aria-label', `رفتن به ابتدای ${cfg.title}`);
  btnStart.appendChild(
    createSvgIcon('M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z')
  );

  const btnEnd = document.createElement('a');
  btnEnd.href = `#${cfg.id}-end`;
  btnEnd.className = 'carousel-nav__btn carousel-nav__btn--end';
  btnEnd.setAttribute('aria-label', `رفتن به انتهای ${cfg.title}`);
  btnEnd.appendChild(
    createSvgIcon('M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z')
  );

  nav.append(btnStart, btnEnd);
  head.appendChild(nav);

  const status = document.createElement('div');
  status.className = 'products__status';
  status.id = `${cfg.id}-status`;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;

  const grid = document.createElement('ul');
  grid.className = 'products__grid';
  grid.id = `${cfg.id}-grid`;
  grid.tabIndex = 0;
  grid.setAttribute('aria-label', cfg.title);
  grid.appendChild(skeletonCards(7));

  main.append(head, status, grid);
  inner.appendChild(main);
  container.appendChild(inner);
  section.appendChild(container);
  return section;
}

function productsForCarousel(
  cfg: any,
  products: any[],
  offerMap: Map<number, any>
) {
  if (cfg.source === 'offers') {
    return [...offerMap.keys()]
      .map((id) => products.find((x) => x.id === id))
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const pa = offerMap.get(a.id)?.percent || 0;
        const pb = offerMap.get(b.id)?.percent || 0;
        return pb - pa;
      });
  }
  if (cfg.categoryId != null) {
    return products.filter((p) => p.categoryId === cfg.categoryId);
  }
  return [];
}

function renderCarousels(
  home: any,
  products: any[],
  stockData: any,
  offers: any[]
) {
  const root = document.getElementById('carousels-root');
  if (!root) return;

  const stockMap = new Map<number, number>(
    products.map((product) => [product.id, stockData.items[product.id] ?? 0])
  );

  const offerMap = new Map<number, any>(offers.map((o) => [o.productId, o]));
  const list = home.carousels;

  for (const cfg of list) {
    let section = document.getElementById(cfg.id);
    if (!section) {
      section = buildCarouselSection(cfg);
      root.appendChild(section);
    } else {
      const titleEl = document.getElementById(`${cfg.id}-title`);
      if (titleEl && cfg.title) titleEl.textContent = cfg.title;
      const subEl = document.getElementById(`${cfg.id}-sub`);
      if (subEl && cfg.sub) subEl.textContent = cfg.sub;
    }

    const productList = productsForCarousel(cfg, products, offerMap);
    fillSectionGrid(cfg.id, productList, offerMap, stockMap);

    const grid = document.getElementById(`${cfg.id}-grid`);
    if (grid) grid.removeAttribute('aria-busy');
  }
}

function renderShell(
  shop: any,
  categories: any[],
  home: any,
  productCount: number
) {
  renderTopbar(shop);
  renderHeader(shop, productCount);
  renderNavMenus(shop);
  renderHero(home);
  renderBanners(home);
  renderFooter(shop);
  renderCategories(categories);
  renderFooterCategories(categories);
  document.title = `${shop.name} | ${shop.slogan}`;
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function waitMinSkeleton(startedAt: number) {
  const remaining = MIN_SKELETON_MS - (performance.now() - startedAt);
  if (remaining > 0) return new Promise((r) => setTimeout(r, remaining));
  return Promise.resolve();
}

function clearShellSkeletons() {
  document.getElementById('hero-video')?.classList.remove('hero-video--skeleton');
  document
    .getElementById('weekly-title')
    ?.classList.remove('hero-carousel__title--skeleton');
}

function setupCart() {
  updateCartUI(cartTotal(readCart()));

  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    const btn = e.target.closest<HTMLButtonElement>(
      '[data-action="inc"], [data-action="dec"]'
    );
    if (!btn || btn.disabled) return;

    const actions = btn.closest<HTMLElement>('.product__actions');
    if (!actions) return;

    const id = actions.dataset.productId;
    if (!id) return;

    e.preventDefault();
    const current = getCartQty(id);
    const next = btn.dataset.action === 'inc' ? current + 1 : current - 1;
    const qty = setCartQty(id, next);
    renderCardActions(actions, qty);

    const name = actions.dataset.productName || 'کالا';
    if (btn.dataset.action === 'inc') {
      notyf.success(`${name} به سبد اضافه شد`);
    } else if (qty === 0) {
      notyf.error(`${name} از سبد حذف شد`);
    }

    const card = actions.closest('.product');
    if (card) {
      card.classList.remove('product--cart-pulse');
      void (card as HTMLElement).offsetWidth;
      card.classList.add('product--cart-pulse');
    }
  });
}

let appCatalog: {
  products: any[];
  stockData: any;
  offers: any[];
} | null = null;
let appHome: any = null;
let appCategories: any[] | null = null;

function getCatParam() {
  return new URLSearchParams(location.search).get('cat') || '';
}

function applyCategoryFilter(slug: string) {
  if (!appCatalog || !appHome) return;

  const cat = (appCategories || []).find((c) => c.slug === slug);
  const { products, stockData, offers } = appCatalog;

  if (!slug || !cat) {
    renderCarousels(appHome, products, stockData, offers);
    return;
  }

  const filteredHome = {
    ...appHome,
    carousels: [
      {
        id: cat.slug,
        title: cat.name,
        emoji: cat.emoji,
        categoryId: cat.id,
      },
    ],
  };

  const root = document.getElementById('carousels-root');
  if (root) {
    root.querySelectorAll('section.products').forEach((sec) => {
      (sec as HTMLElement).hidden = sec.id !== cat.slug;
    });
  }

  renderCarousels(filteredHome, products, stockData, offers);

  const section = document.getElementById(cat.slug);
  if (section) {
    section.hidden = false;
    if (root) {
      root.querySelectorAll('section.products').forEach((sec) => {
        (sec as HTMLElement).hidden = sec.id !== cat.slug;
      });
    }
  }
}

function clearCategoryFilter() {
  const root = document.getElementById('carousels-root');
  if (root) {
    root.querySelectorAll('section.products').forEach((sec) => {
      (sec as HTMLElement).hidden = false;
    });
  }
  if (appCatalog && appHome) {
    renderCarousels(
      appHome,
      appCatalog.products,
      appCatalog.stockData,
      appCatalog.offers
    );
  }
}

function setupCategoryNavigation() {
  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    const link = e.target.closest<HTMLAnchorElement>(
      'a[data-cat-slug], a.category'
    );
    if (!link) return;
    const slug = link.dataset.catSlug;
    if (!slug) return;

    e.preventDefault();
    const url = new URL(location.href);
    url.searchParams.set('cat', slug);
    url.hash = slug;
    history.pushState({ cat: slug }, '', url);

    applyCategoryFilter(slug);

    const target = document.getElementById(slug);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('popstate', () => {
    const slug = getCatParam();
    if (slug) applyCategoryFilter(slug);
    else clearCategoryFilter();
  });
}

function setupSearch() {
  const search = document.querySelector<HTMLInputElement>('#search-input');
  const box = document.getElementById('search-results');
  if (!search || !box) return;

  const close = () => {
    box.hidden = true;
    box.replaceChildren();
  };

  search.addEventListener('input', () => {
    if (!productFuse || !appCatalog) return;

    const q = search.value.trim();
    if (!q) {
      close();
      return;
    }

    const hits = productFuse.search(q).map((r) => r.item).slice(0, 8);
    box.replaceChildren();

    if (hits.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'search-results__empty';
      empty.textContent = 'نتیجه‌ای یافت نشد';
      box.appendChild(empty);
      box.hidden = false;
      return;
    }

    hits.forEach((p) => {
      const offer = appCatalog?.offers.find((o) => o.productId === p.id);
      const hasDiscount = offer && offer.percent > 0;
      const finalPrice = hasDiscount
        ? Math.round(p.price * (1 - offer.percent / 100))
        : p.price;

      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'search-results__item';
      itemWrapper.dataset.productId = String(p.id);

      const imgWrap = document.createElement('div');
      imgWrap.className = 'search-results__img';
      
      if (p.image) {
        const img = document.createElement('img');
        img.src = p.image;
        img.alt = p.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.onerror = () => {
          img.remove();
          imgWrap.textContent = p.emoji || '🛒';
          imgWrap.style.display = 'grid';
          imgWrap.style.placeItems = 'center';
          imgWrap.style.fontSize = '1.5rem';
        };
        imgWrap.appendChild(img);
      } else {
        imgWrap.textContent = p.emoji || '🛒';
        imgWrap.style.display = 'grid';
        imgWrap.style.placeItems = 'center';
        imgWrap.style.fontSize = '1.5rem';
      }

      const info = document.createElement('div');
      info.className = 'search-results__info';

      const nameEl = document.createElement('span');
      nameEl.className = 'search-results__name';
      nameEl.textContent = p.name;

      const priceEl = document.createElement('span');
      priceEl.className = 'search-results__price';
      priceEl.textContent = `${priceFmt.format(finalPrice)} تومان`;

      info.append(nameEl, priceEl);

      const actions = document.createElement('div');
      actions.className = 'product__actions search-results__actions';
      actions.dataset.productId = String(p.id);
      actions.dataset.productName = p.name;

      const currentQty = getCartQty(p.id);
      renderCardActions(actions, currentQty);

      actions.addEventListener('click', (e) => {
        if (!(e.target instanceof Element)) return;
        const btn = e.target.closest<HTMLButtonElement>('[data-action="inc"], [data-action="dec"]');
        if (!btn || btn.disabled) return;

        e.stopPropagation(); 

        const current = getCartQty(p.id);
        const next = btn.dataset.action === 'inc' ? current + 1 : current - 1;
        const qty = setCartQty(p.id, next);
        renderCardActions(actions, qty);

        if (btn.dataset.action === 'inc') {
          notyf.success(`${p.name} به سبد اضافه شد`);
        } else if (qty === 0) {
          notyf.error(`${p.name} از سبد حذف شد`); 
        }
      });

      itemWrapper.append(imgWrap, info, actions);
      box.appendChild(itemWrapper);
    });

    box.hidden = false;
  });

  box.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    
    const item = e.target.closest<HTMLElement>('.search-results__item');
    if (!item) return;

    if (e.target.closest('.search-results__actions')) return;

    const productId = item.dataset.productId;
    if (!productId) return;

    const next = getCartQty(productId) + 1;
    setCartQty(productId, next);
    
    const productName = item.querySelector('.search-results__name')?.textContent || 'کالا';
    notyf.success(`${productName} به سبد اضافه شد`);

    const actions = item.querySelector<HTMLElement>('.search-results__actions');
    if (actions) renderCardActions(actions, next);

    item.style.backgroundColor = 'var(--lime-soft)';
    setTimeout(() => { item.style.backgroundColor = ''; }, 300);
  });

  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Node)) return;
    if (!box.contains(e.target) && e.target !== search) close();
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  });
}
function showSlowConnection(show: boolean) {
  const el = document.getElementById('slow-connection');
  if (!el) return;
  if (show) {
    el.hidden = false;
    el.setAttribute('data-visible', 'true');
  } else {
    el.hidden = true;
    el.removeAttribute('data-visible');
  }
}

function errorMessage(err: unknown) {
  if (
    err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'AbortError'
  ) {
    return 'زمان انتظار برای دریافت داده به پایان رسید. لطفاً دوباره تلاش کنید.';
  }
  return 'داده‌ها در دسترس نیست. لطفاً اتصال اینترنت را بررسی کنید.';
}

async function init() {
  document
    .querySelector('.search')
    ?.addEventListener('submit', (e) => e.preventDefault());
  setupCart();
  setupCategoryNavigation();
  setupSearch();

  const startedAt = performance.now();
  const slowTimer = setTimeout(() => showSlowConnection(true), 3000);

  try {
    const [shopRaw, categoriesRaw, homeRaw, productsRaw, stockData, offers] =
      await Promise.all([
        fetchJson(API.shop),
        fetchJson(API.categories),
        fetchJson(API.home),
        fetchJson(API.products),
        fetchJson(API.stock),
        fetchJson(API.offers),
      ]);

    const shop = enrichShop(shopRaw);
    const categories = enrichCategories(categoriesRaw);
    const home = enrichHome(homeRaw);
    const products = productsRaw.map(enrichProduct);

    productFuse = new Fuse(products, {
      keys: ['name', 'tags'],
      threshold: 0.4,
      ignoreLocation: true,
    });

    clearTimeout(slowTimer);
    showSlowConnection(false);
    await waitMinSkeleton(startedAt);

    appHome = home;
    appCategories = categories;
    appCatalog = { products, stockData, offers };

    renderShell(shop, categories, home, products.length);
    renderCarousels(home, products, stockData, offers);

    const catSlug = getCatParam();
    if (catSlug) applyCategoryFilter(catSlug);
  } catch (err) {
    clearTimeout(slowTimer);
    showSlowConnection(false);
    console.error('[shop] data failed:', err);
    await waitMinSkeleton(startedAt);
    clearShellSkeletons();
    showCarouselErrors(errorMessage(err));
  }
}

init();