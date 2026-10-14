const API = {
  products: './api/products.json',
  stock: './api/stock.json',
  offers: './api/offers.json',
};

const MIN_SKELETON_MS = 700;
const FETCH_TIMEOUT_MS = 8000;

const priceFormatter = new Intl.NumberFormat('fa-IR');
const percentFormatter = new Intl.NumberFormat('fa-IR', {
  style: 'percent',
  maximumFractionDigits: 0,
});

function formatPrice(price) {
  return priceFormatter.format(price);
}

function formatPercent(percent) {
  return percentFormatter.format(percent / 100);
}

function buildOfferMap(offers) {
  const map = new Map();
  for (const offer of offers) {
    map.set(offer.productId, offer);
  }
  return map;
}

function buildStockMap(stockData) {
  const map = new Map();
  const items = stockData.items || {};
  for (const [id, qty] of Object.entries(items)) {
    map.set(Number(id), qty);
  }
  return map;
}

function buildProductMap(products) {
  const map = new Map();
  for (const product of products) {
    map.set(product.id, product);
  }
  return map;
}

function createProductCard(product, options = {}) {
  const {
    isFirst = false,
    isLast = false,
    sectionId = '',
    offer = null,
    stock = 1,
  } = options;

  const outOfStock = stock === 0;
  const hasDiscount = offer != null && offer.percent > 0;

  const li = document.createElement('li');
  li.className = 'products__item';
  if (isFirst && sectionId) li.id = `${sectionId}-start`;
  if (isLast && sectionId) li.id = `${sectionId}-end`;

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
      const emoji = document.createElement('span');
      emoji.className = 'product__emoji';
      emoji.textContent = product.emoji || '🛒';
      emoji.setAttribute('aria-hidden', 'true');
      imgWrap.appendChild(emoji);
    };

    imgWrap.appendChild(img);
  } else {
    imgWrap.classList.add('product__img--emoji');
    const emoji = document.createElement('span');
    emoji.className = 'product__emoji';
    emoji.textContent = product.emoji || '🛒';
    emoji.setAttribute('aria-hidden', 'true');
    imgWrap.appendChild(emoji);
  }

  if (outOfStock) {
    const badge = document.createElement('span');
    badge.className = 'product__badge-stock';
    badge.textContent = 'ناموجود';
    imgWrap.appendChild(badge);
  }

  if (hasDiscount && !outOfStock) {
    const discountBadge = document.createElement('span');
    discountBadge.className = 'product__discount';
    discountBadge.textContent = formatPercent(offer.percent);
    discountBadge.setAttribute('aria-label', `${offer.percent} درصد تخفیف`);
    imgWrap.appendChild(discountBadge);
  }

  const name = document.createElement('h3');
  name.className = 'product__name';
  name.textContent = `${product.name} — ${product.unit}`;

  body.append(imgWrap, name);

  const footer = document.createElement('div');
  footer.className = 'product__footer';

  const priceWrap = document.createElement('span');
  priceWrap.className = 'product__price';

  if (hasDiscount && !outOfStock) {
    const discounted = Math.round(product.price * (1 - offer.percent / 100));

    const oldPrice = document.createElement('span');
    oldPrice.className = 'product__old';
    oldPrice.textContent = formatPrice(product.price);
    oldPrice.setAttribute(
      'aria-label',
      `قیمت قبلی ${formatPrice(product.price)} تومان`
    );

    const current = document.createElement('span');
    current.className = 'product__current';
    current.textContent = formatPrice(discounted);

    const unit = document.createElement('span');
    unit.className = 'product__unit';
    unit.textContent = 'تومان';

    priceWrap.append(current, unit, oldPrice);
  } else {
    const current = document.createElement('span');
    current.className = 'product__current';
    current.textContent = formatPrice(product.price);

    const unit = document.createElement('span');
    unit.className = 'product__unit';
    unit.textContent = 'تومان';

    priceWrap.append(current, unit);
  }

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'product__add';
  addBtn.setAttribute(
    'aria-label',
    outOfStock
      ? `${product.name} ناموجود است`
      : `افزودن ${product.name} به سبد خرید`
  );

  if (outOfStock) {
    addBtn.disabled = true;
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z');
  svg.appendChild(path);
  addBtn.appendChild(svg);

  footer.append(priceWrap, addBtn);
  article.append(body, footer);
  li.appendChild(article);

  return li;
}

function showError(statusEl, gridEl, message) {
  gridEl.replaceChildren();
  gridEl.hidden = true;

  statusEl.hidden = false;
  statusEl.className = 'products__status products__status--error';
  statusEl.replaceChildren();

  const icon = document.createElement('span');
  icon.className = 'products__status-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '📡';

  const title = document.createElement('p');
  title.className = 'products__status-title';
  title.textContent = 'محصولات در دسترس نیست';

  const text = document.createElement('p');
  text.className = 'products__status-text';
  text.textContent = message;

  statusEl.append(icon, title, text);
}

function renderCarousel(config) {
  const {
    list,
    gridId,
    statusId,
    sectionId,
    offerMap,
    stockMap,
    emptyMessage,
  } = config;

  const grid = document.getElementById(gridId);
  const status = document.getElementById(statusId);
  if (!grid || !status) return;

  if (list.length === 0) {
    showError(
      status,
      grid,
      emptyMessage || 'در حال حاضر محصولی برای نمایش نیست.'
    );
    return;
  }

  status.hidden = true;
  status.replaceChildren();
  grid.hidden = false;
  grid.replaceChildren();

  list.forEach((product, index) => {
    const card = createProductCard(product, {
      isFirst: index === 0,
      isLast: index === list.length - 1,
      sectionId,
      offer: offerMap.get(product.id) || null,
      stock: stockMap.get(product.id) ?? 1,
    });
    grid.appendChild(card);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, { timeout = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — ${url}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function init() {
  const sectionConfigs = [
    {
      sectionId: 'offers',
      gridId: 'offers-grid',
      statusId: 'offers-status',
      emptyMessage: 'در حال حاضر پیشنهاد ویژه‌ای موجود نیست.',
    },
    {
      sectionId: 'fruits',
      gridId: 'fruits-grid',
      statusId: 'fruits-status',
      emptyMessage: 'در حال حاضر محصولی در این دسته موجود نیست.',
    },
    {
      sectionId: 'dairy',
      gridId: 'dairy-grid',
      statusId: 'dairy-status',
      emptyMessage: 'در حال حاضر محصولی در این دسته موجود نیست.',
    },
  ];

  try {
    const startedAt = performance.now();

    const [products, stockData, offers] = await Promise.all([
      fetchJson(API.products),
      fetchJson(API.stock),
      fetchJson(API.offers),
    ]);

    const remaining = MIN_SKELETON_MS - (performance.now() - startedAt);
    if (remaining > 0) {
      await wait(remaining);
    }

    const offerMap = buildOfferMap(offers);
    const stockMap = buildStockMap(stockData);
    const productMap = buildProductMap(products);

    const offerProducts = [...offers]
      .sort((a, b) => b.percent - a.percent)
      .map((off) => productMap.get(off.productId))
      .filter(Boolean);

    const lists = {
      offers: offerProducts,
      fruits: products.filter((p) => p.categoryId === 1),
      dairy: products.filter((p) => p.categoryId === 2),
    };

    sectionConfigs.forEach((config) => {
      renderCarousel({
        list: lists[config.sectionId] || [],
        gridId: config.gridId,
        statusId: config.statusId,
        sectionId: config.sectionId,
        offerMap,
        stockMap,
        emptyMessage: config.emptyMessage,
      });
    });
  } catch (err) {
    console.error('خطا در دریافت داده:', err);
    const msg =
      'لطفاً اتصال اینترنت را بررسی کنید و صفحه را دوباره بارگذاری کنید.';

    sectionConfigs.forEach(({ gridId, statusId }) => {
      const grid = document.getElementById(gridId);
      const status = document.getElementById(statusId);
      if (grid && status) showError(status, grid, msg);
    });
  }
}

init();