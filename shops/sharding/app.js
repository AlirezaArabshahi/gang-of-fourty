const API_URL = './api/products.json';
const MIN_SKELETON_MS = 700;

function formatPrice(price) {
  return new Intl.NumberFormat('fa-IR').format(price);
}

function createProductCard(product, isFirst, isLast, sectionId) {
  const li = document.createElement('li');
  li.className = 'products__item';

  if (isFirst) li.id = `${sectionId}-start`;
  if (isLast)  li.id = `${sectionId}-end`;

  const article = document.createElement('article');
  article.className = 'product';

  const link = document.createElement('a');
  link.href = '#';
  link.className = 'product__link';

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

  const name = document.createElement('h3');
  name.className = 'product__name';
  name.textContent = `${product.name} — ${product.unit}`;

  link.append(imgWrap, name);

  const footer = document.createElement('div');
  footer.className = 'product__footer';

  const priceWrap = document.createElement('span');
  priceWrap.className = 'product__price';

  const current = document.createElement('span');
  current.className = 'product__current';
  current.textContent = formatPrice(product.price);

  const unit = document.createElement('span');
  unit.className = 'product__unit';
  unit.textContent = 'تومان';

  priceWrap.append(current, unit);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'product__add';
  addBtn.setAttribute('aria-label', `افزودن ${product.name} به سبد خرید`);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z');
  svg.appendChild(path);
  addBtn.appendChild(svg);

  footer.append(priceWrap, addBtn);
  article.append(link, footer);
  li.appendChild(article);

  return li;
}

function showError(statusEl, gridEl, message) {
  gridEl.replaceChildren();
  gridEl.hidden = true;
  gridEl.style.minHeight = '0';

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

function renderCarousel(products, categoryId, gridId, statusId, sectionId) {
  const grid = document.getElementById(gridId);
  const status = document.getElementById(statusId);
  if (!grid || !status) return;

  const filtered = products.filter((p) => p.categoryId === categoryId);

  if (filtered.length === 0) {
    showError(status, grid, 'در حال حاضر محصولی در این دسته ثبت نشده است.');
    return;
  }

  status.hidden = true;
  status.replaceChildren();
  grid.hidden = false;
  grid.style.minHeight = '';
  grid.replaceChildren();

  filtered.forEach((product, index) => {
    const card = createProductCard(
      product,
      index === 0,
      index === filtered.length - 1,
      sectionId
    );
    grid.appendChild(card);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function init() {
  const sections = [
    { gridId: 'fruits-grid', statusId: 'fruits-status', categoryId: 1, sectionId: 'fruits' },
    { gridId: 'dairy-grid',  statusId: 'dairy-status',  categoryId: 2, sectionId: 'dairy'  },
  ];

  try {
    const [res] = await Promise.all([
      fetch(API_URL),
      wait(MIN_SKELETON_MS),
    ]);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const products = await res.json();

    sections.forEach(({ gridId, statusId, categoryId, sectionId }) => {
      renderCarousel(products, categoryId, gridId, statusId, sectionId);
    });

  } catch (err) {
    console.error('خطا در دریافت محصولات:', err);
    const msg = 'لطفاً اتصال اینترنت را بررسی کنید و صفحه را رفرش کنید.';

    sections.forEach(({ gridId, statusId }) => {
      const grid = document.getElementById(gridId);
      const status = document.getElementById(statusId);
      if (grid && status) showError(status, grid, msg);
    });
  }
}

document.addEventListener('DOMContentLoaded', init);