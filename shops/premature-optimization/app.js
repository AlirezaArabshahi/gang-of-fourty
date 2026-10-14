const API_BASE = "../../api/";
const DAIRY_CATEGORY_ID = 2;
const numberFormatter = new Intl.NumberFormat("fa-IR");

const dairy = {
  products: document.querySelector("#dairy-products"),
  viewport: document.querySelector(".dairy-carousel-viewport"),
  status: document.querySelector("#dairy-status"),
  previous: document.querySelector("#dairy-prev"),
  next: document.querySelector("#dairy-next"),
  offset: 0,
};
const special = {
  products: document.querySelector("#special-products"),
  viewport: document.querySelector("#special-viewport"),
  status: document.querySelector("#special-status"),
  previous: document.querySelector("#special-prev"),
  next: document.querySelector("#special-next"),
  offset: 0,
};

function showStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("api-status--error", isError);
  element.hidden = false;
}

function createProductCard(product, { offer = null, stock = null, categoryName = "لبنیات" } = {}) {
  const template = document.querySelector("#product-card-template");
  const card = template.content.firstElementChild.cloneNode(true);
  const discountBadge = card.querySelector(".product-discount");
  const oldPrice = card.querySelector(".item-old-price");
  const price = card.querySelector(".item-price");
  const buyButton = card.querySelector(".buy-button");
  const quantity = stock?.items?.[String(product.id)];
  const isOutOfStock = quantity === 0;
  const finalPrice = offer ? Math.round(product.price * (100 - offer.percent) / 100) : product.price;

  card.querySelector(".product-emoji").textContent = product.emoji ?? "🛒";
  card.querySelector(".item-tag").textContent = categoryName;
  card.querySelector(".item-title").textContent = product.name;
  card.querySelector(".item-description").textContent = product.unit;
  price.textContent = `${numberFormatter.format(finalPrice)} تومان`;
  buyButton.setAttribute("aria-label", `افزودن ${product.name} به سبد خرید`);

  if (offer) {
    discountBadge.hidden = false;
    discountBadge.textContent = `${numberFormatter.format(offer.percent)}٪`;
    oldPrice.hidden = false;
    oldPrice.textContent = `${numberFormatter.format(product.price)} تومان`;
  } else {
    discountBadge.hidden = true;
    oldPrice.hidden = true;
  }

  if (isOutOfStock) {
    card.classList.add("product-item--unavailable");
    const unavailableBadge = document.createElement("span");
    unavailableBadge.className = "product-stock-badge";
    unavailableBadge.textContent = "ناموجود";
    card.querySelector(".item-tag").after(unavailableBadge);
    buyButton.disabled = true;
    buyButton.setAttribute("aria-label", `${product.name} ناموجود است`);
  }
  return card;
}

function renderProducts(container, products, optionsForProduct = () => ({})) {
  const fragment = document.createDocumentFragment();
  products.forEach((product) => fragment.append(createProductCard(product, optionsForProduct(product))));
  container.replaceChildren(fragment);
}

function updateCarousel(carousel) {
  const firstCard = carousel.products.querySelector(".product-item");
  if (!firstCard) {
    carousel.previous.disabled = true;
    carousel.next.disabled = true;
    return;
  }
  const styles = getComputedStyle(carousel.products);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
  const step = firstCard.getBoundingClientRect().width + gap;
  const maxOffset = Math.max(0, carousel.products.scrollWidth - carousel.viewport.clientWidth);
  carousel.offset = Math.min(carousel.offset, maxOffset);
  carousel.products.style.transform = `translateX(${carousel.offset}px)`;
  carousel.previous.disabled = carousel.offset <= 0;
  carousel.next.disabled = carousel.offset >= maxOffset - 1;
}

function moveCarousel(carousel, direction) {
  const firstCard = carousel.products.querySelector(".product-item");
  if (!firstCard) return;
  const styles = getComputedStyle(carousel.products);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
  const step = firstCard.getBoundingClientRect().width + gap;
  const maxOffset = Math.max(0, carousel.products.scrollWidth - carousel.viewport.clientWidth);
  carousel.offset = Math.max(0, Math.min(maxOffset, carousel.offset + direction * step));
  carousel.products.style.transform = `translateX(${carousel.offset}px)`;
  carousel.previous.disabled = carousel.offset <= 0;
  carousel.next.disabled = carousel.offset >= maxOffset - 1;
}

function setupCarousel(carousel) {
  carousel.previous.addEventListener("click", () => moveCarousel(carousel, -1));
  carousel.next.addEventListener("click", () => moveCarousel(carousel, 1));
  window.addEventListener("resize", () => updateCarousel(carousel));
  requestAnimationFrame(() => updateCarousel(carousel));
}

async function loadPageProducts() {
  showStatus(dairy.status, "در حال بارگذاری محصولات...");
  showStatus(special.status, "در حال بارگذاری پیشنهادها...");
  try {
    const [productsResponse, stockResponse, offersResponse] = await Promise.all([
      fetch(`${API_BASE}products.json`),
      fetch(`${API_BASE}stock.json`),
      fetch(`${API_BASE}offers.json`),
    ]);
    for (const response of [productsResponse, stockResponse, offersResponse]) {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    }
    const [products, stock, offers] = await Promise.all([
      productsResponse.json(), stockResponse.json(), offersResponse.json(),
    ]);
    const offersByProductId = new Map(offers.map((offer) => [offer.productId, offer]));

    const dairyProducts = products.filter((product) => product.categoryId === DAIRY_CATEGORY_ID);
    renderProducts(dairy.products, dairyProducts, (product) => ({
      offer: offersByProductId.get(product.id) ?? null,
      stock,
      categoryName: "لبنیات",
    }));
    dairy.status.hidden = dairyProducts.length > 0;
    if (dairyProducts.length === 0) showStatus(dairy.status, "در حال حاضر محصولی برای نمایش وجود ندارد.");

    const specialProducts = products.filter((product) => offersByProductId.has(product.id));
    renderProducts(special.products, specialProducts, (product) => ({
      offer: offersByProductId.get(product.id),
      stock,
      categoryName: product.categoryName ?? "پیشنهاد ویژه",
    }));
    special.status.hidden = specialProducts.length > 0;
    if (specialProducts.length === 0) showStatus(special.status, "در حال حاضر پیشنهاد ویژه‌ای وجود ندارد.");

    setupCarousel(dairy);
    setupCarousel(special);
  } catch (error) {
    dairy.products.replaceChildren();
    special.products.replaceChildren();
    const message = "بارگذاری اطلاعات با مشکل مواجه شد. لطفاً اتصال را بررسی و صفحه را دوباره بارگذاری کنید.";
    showStatus(dairy.status, message, true);
    showStatus(special.status, message, true);
  }
}

loadPageProducts();
