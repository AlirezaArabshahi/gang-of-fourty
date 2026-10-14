const API = {
  products: './api/products.json',
  stock: './api/stock.json',
  offers: './api/offers.json',
  shop: './api/shop.json',
  categories: './api/categories.json',
};

const MIN_SKELETON_MS = 300;
const TIMEOUT_MS = 8000;

const priceFmt = new Intl.NumberFormat('fa-IR');
const percentFmt = new Intl.NumberFormat('fa-IR', {
  style: 'percent',
  maximumFractionDigits: 0,
});

function makeEmoji(emoji) {
  const span = document.createElement('span');
  span.className = 'product__emoji';
  span.textContent = emoji || '🛒';
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function createCard(product, { offer, stock }) {
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
    old.setAttribute('aria-label', `قیمت قبلی ${priceFmt.format(product.price)} تومان`);
    price.appendChild(old);
  }

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'product__add';
  addBtn.disabled = outOfStock;
  addBtn.setAttribute(
    'aria-label',
    outOfStock ? `${product.name} ناموجود است` : `افزودن ${product.name} به سبد خرید`
  );

  const tpl = document.getElementById('tpl-icon-plus');
  if (tpl) addBtn.appendChild(tpl.content.cloneNode(true));

  footer.append(price, addBtn);
  article.append(body, footer);
  li.appendChild(article);
  return li;
}

function showError(sectionId, message) {
  const grid = document.getElementById(`${sectionId}-grid`);
  const status = document.getElementById(`${sectionId}-status`);
  if (!grid || !status) return;
  grid.hidden = true;
  status.hidden = false;
  status.className = 'products__status products__status--error';
  status.textContent = message;
}

function renderSection(sectionId, list, offerMap, stockMap) {
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

  list.forEach((product, i) => {
    const card = createCard(product, {
      offer: offerMap.get(product.id) || null,
      stock: stockMap.get(product.id) ?? 0,
    });
    if (i === 0) card.id = `${sectionId}-start`;
    if (i === list.length - 1) card.id = `${sectionId}-end`;
    grid.appendChild(card);
  });
}

function renderSimpleLinks(el, links) {
  el.replaceChildren();
  for (const item of links) {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    el.appendChild(a);
  }
}

function renderListLinks(el, links) {
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

function renderNavList(el, links) {
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

function renderMegaMenu(items) {
  const ul = document.getElementById('dept-menu');
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

function renderTopbar(shop) {
  const notice = document.getElementById('topbar-notice');
  notice.textContent = shop.notice;
  notice.classList.remove('skeleton-text', 'skeleton-text--topbar');
  notice.removeAttribute('aria-hidden');

  const links = document.getElementById('topbar-links');
  links.removeAttribute('aria-busy');
  renderSimpleLinks(links, shop.topbarLinks);
}

function renderHeader(shop) {
  const brand = document.getElementById('header-brand');
  brand.setAttribute('aria-label', `${shop.name} — صفحه اصلی`);
  document.getElementById('brand-name').textContent = shop.name;
  document.getElementById('brand-tagline').textContent = shop.slogan;

  document.getElementById('search-input').placeholder = shop.searchPlaceholder;
  document.getElementById('label-location').textContent = shop.labels.location;
  document.getElementById('label-account').textContent = shop.labels.account;
  document.getElementById('label-cart').textContent = shop.labels.cart;
}

function renderNavMenus(shop) {
  document.getElementById('dept-btn-label').textContent = shop.labels.deptButton;

  const navList = document.getElementById('nav-list');
  navList.removeAttribute('aria-busy');
  renderNavList(navList, shop.menu);

  document.getElementById('mobile-menu-title').textContent = shop.labels.mobileMenuTitle;

  const mobileList = document.getElementById('mobile-menu-list');
  mobileList.removeAttribute('aria-busy');
  renderListLinks(mobileList, shop.menu);

  renderMegaMenu(shop.deptMenu);
}

function renderHero(shop) {
  document.getElementById('hero-title').textContent = shop.hero.title;
  document.getElementById('hero-desc').textContent = shop.hero.desc;
  const cta = document.getElementById('hero-cta');
  cta.href = shop.hero.ctaHref;
  cta.removeAttribute('aria-hidden');
  cta.removeAttribute('tabindex');
  document.getElementById('hero-cta-label').textContent = shop.hero.cta;

  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) heroVideo.classList.remove('hero-video--skeleton');

  const t = shop.sectionTitles;
  const weekly = document.getElementById('weekly-title');
  weekly.textContent = t.weekly;
  weekly.classList.remove('hero-carousel__title--skeleton');

  document.getElementById('offers-title').textContent = t.offers;
  document.getElementById('offers-sub').textContent = t.offersSub;
  document.getElementById('categories-title').textContent = t.categories;
  document.getElementById('fruits-title').textContent = t.fruits;
  document.getElementById('dairy-title').textContent = t.dairy;
}

function setupHeroBannerSkeletons(startedAt) {
  const ready = () => waitMinSkeleton(startedAt || performance.now());

  document.querySelectorAll('[data-hero-banner]').forEach((img) => {
    const slide = img.closest('.hero-carousel__slide');
    if (!slide) return;

    const clear = async () => {
      await ready();
      slide.classList.remove('hero-carousel__slide--skeleton');
    };

    if (img.complete && img.naturalWidth > 0) {
      clear();
      return;
    }

    img.addEventListener('load', clear, { once: true });
    img.addEventListener('error', clear, { once: true });
  });
}

function renderContactList(shop) {
  const ul = document.getElementById('footer-contact-list');
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

function renderSchedule(schedule) {
  const el = document.getElementById('footer-schedule');
  const frag = document.createDocumentFragment();

  schedule.forEach((item, i) => {
    if (i > 0) frag.appendChild(document.createElement('br'));
    frag.appendChild(document.createTextNode(item.days));
    frag.appendChild(document.createElement('br'));
    frag.appendChild(document.createTextNode(item.time));
  });

  el.replaceChildren(frag);
}

function renderFooter(shop) {
  const brand = document.getElementById('footer-brand');
  brand.setAttribute('aria-label', shop.name);
  document.getElementById('footer-brand-name').textContent = shop.name;
  document.getElementById('footer-brand-tagline').textContent = shop.slogan;
  document.getElementById('footer-about').textContent = shop.about;

  document.getElementById('footer-help-title').textContent = shop.labels.footerHelpTitle;
  document.getElementById('footer-contact-title').textContent = shop.labels.footerContactTitle;
  document.getElementById('footer-schedule-title').textContent = shop.labels.footerScheduleTitle;

  renderListLinks(document.getElementById('footer-help-list'), shop.help);
  renderContactList(shop);
  renderSchedule(shop.schedule);

  document.getElementById('footer-copyright').textContent = shop.copyright;
  document.getElementById('footer-top-label').textContent = shop.labels.footerTop;
}

function renderCategories(items) {
  const ul = document.getElementById('categories-list');
  ul.replaceChildren();

  items.forEach((cat, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'category';

    const target = document.getElementById(cat.slug);
    a.href = target ? `#${cat.slug}` : '#offers';

    if (i === 0) a.id = 'cat-start';
    if (i === items.length - 1) a.id = 'cat-end';

    const imgWrap = document.createElement('span');
    imgWrap.className = 'category__img';

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

async function fetchJson(url) {
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

function waitMinSkeleton(startedAt) {
  const remaining = MIN_SKELETON_MS - (performance.now() - startedAt);
  if (remaining > 0) return new Promise((r) => setTimeout(r, remaining));
  return Promise.resolve();
}

function clearShellSkeletons() {
  document.getElementById('hero-video')?.classList.remove('hero-video--skeleton');
  document.getElementById('weekly-title')?.classList.remove('hero-carousel__title--skeleton');
}

function buildStockMap(products, stockData) {
  const stockMap = new Map();
  const items = stockData.items || {};
  for (const product of products) {
    const qty = items[product.id];
    stockMap.set(product.id, typeof qty === 'number' ? qty : 0);
  }
  return stockMap;
}

function renderProductSections(products, stockData, offers) {
  const stockMap = buildStockMap(products, stockData);
  const offerMap = new Map(offers.map((o) => [o.productId, o]));
  const byId = new Map(products.map((p) => [p.id, p]));

  const offerProducts = [...offers]
    .sort((a, b) => b.percent - a.percent)
    .map((o) => byId.get(o.productId))
    .filter(Boolean);

  renderSection('offers', offerProducts, offerMap, stockMap);
  renderSection('fruits', products.filter((p) => p.categoryId === 1), offerMap, stockMap);
  renderSection('dairy', products.filter((p) => p.categoryId === 2), offerMap, stockMap);
}

function renderShell(shop, categories) {
  renderTopbar(shop);
  renderHeader(shop);
  renderNavMenus(shop);
  renderHero(shop);
  renderFooter(shop);
  renderCategories(categories);
  document.title = `${shop.name} | ${shop.slogan}`;
}

async function init() {
  document.querySelector('.search')?.addEventListener('submit', (e) => e.preventDefault());
  const startedAt = performance.now();
  setupHeroBannerSkeletons(startedAt);

  // One pipeline: fetch everything in parallel, one min skeleton, one paint.
  const shellPromise = Promise.all([
    fetchJson(API.shop),
    fetchJson(API.categories),
  ]).then(([shop, categories]) => ({ shop, categories }));

  const catalogPromise = Promise.all([
    fetchJson(API.products),
    fetchJson(API.stock),
    fetchJson(API.offers).catch((err) => {
      console.warn('[shop] offers unavailable:', err);
      return [];
    }),
  ]).then(([products, stockData, offers]) => ({ products, stockData, offers }));

  const [shellSettled, catalogSettled] = await Promise.all([
    shellPromise.then((data) => ({ ok: true, data })).catch((err) => ({ ok: false, err })),
    catalogPromise.then((data) => ({ ok: true, data })).catch((err) => ({ ok: false, err })),
  ]);

  await waitMinSkeleton(startedAt);

  if (shellSettled.ok) {
    renderShell(shellSettled.data.shop, shellSettled.data.categories);
  } else {
    console.error('[shop] shell data failed:', shellSettled.err);
    clearShellSkeletons();
  }

  if (catalogSettled.ok) {
    const { products, stockData, offers } = catalogSettled.data;
    renderProductSections(products, stockData, offers);
  } else {
    console.error('[shop] product data failed:', catalogSettled.err);
    const err = catalogSettled.err;
    const message =
      err && err.name === 'AbortError'
        ? 'زمان انتظار برای دریافت داده به پایان رسید. لطفاً دوباره تلاش کنید.'
        : 'محصولات در دسترس نیست. لطفاً اتصال اینترنت را بررسی کنید.';
    ['offers', 'fruits', 'dairy'].forEach((id) => showError(id, message));
  }
}

init();