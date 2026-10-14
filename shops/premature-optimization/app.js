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

function createProductCard(product, { offer = null, stock = null, categoryName = "لبنیات", templateId = "dairy-product-template" } = {}) {
  const template = document.querySelector(`#${templateId}`);
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
    const [productsResponse, stockResponse, offersResponse, categoriesResponse, shopResponse] = await Promise.all([
      fetch(`${API_BASE}products.json`),
      fetch(`${API_BASE}stock.json`),
      fetch(`${API_BASE}offers.json`),
      fetch(`${API_BASE}categories.json`),
      fetch(`${API_BASE}shop.json`),
    ]);
    for (const response of [productsResponse, stockResponse, offersResponse, categoriesResponse, shopResponse]) {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    }
    const [products, stock, offers, categories, shop] = await Promise.all([
      productsResponse.json(), stockResponse.json(), offersResponse.json(),
      categoriesResponse.json(), shopResponse.json(),
    ]);
    renderShopDetails(shop);
    renderCategories(categories);
    const offersByProductId = new Map(offers.map((offer) => [offer.productId, offer]));

    const dairyProducts = products.filter((product) => product.categoryId === DAIRY_CATEGORY_ID);
    renderProducts(dairy.products, dairyProducts, (product) => ({
      offer: offersByProductId.get(product.id) ?? null,
      stock,
      categoryName: "لبنیات",
      templateId: "dairy-product-template",
    }));
    dairy.status.hidden = dairyProducts.length > 0;
    if (dairyProducts.length === 0) showStatus(dairy.status, "در حال حاضر محصولی برای نمایش وجود ندارد.");

    const specialProducts = products.filter((product) => offersByProductId.has(product.id));
    renderProducts(special.products, specialProducts, (product) => ({
      offer: offersByProductId.get(product.id),
      stock,
      categoryName: product.categoryName ?? "پیشنهاد ویژه",
      templateId: "special-product-template",
    }));
    special.status.hidden = specialProducts.length > 0;
    if (specialProducts.length === 0) showStatus(special.status, "در حال حاضر پیشنهاد ویژه‌ای وجود ندارد.");

    renderCategorySections(categories, products, stock, offersByProductId);
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

function makeElement(tag, className, text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function appendLink(container, label, href, className = "") {
  const link = makeElement("a", className, label);
  link.href = href || "#";
  container.append(link);
  return link;
}

function renderShopDetails(shop) {
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value != null) element.textContent = value;
  };
  setText("#shop-notice", shop.notice);
  setText("#shop-name", "سوپرینو");
  setText("#footer-shop-name", "سوپرینو");
  setText("#shop-slogan", shop.slogan);
  setText("#shop-about", shop.about);
  setText("#shop-address", shop.address);
  setText("#shop-phone", shop.phone);
  const copyrightText = String(shop.copyright || "").replace(/سوپرمارکت\s*مینا/g, "سوپرینو").trim();
  setText("#shop-copyright", copyrightText);

  const menu = document.querySelector("#shop-menu-links");
  menu.replaceChildren();
  (shop.menu || []).forEach((item) => appendLink(menu, item.label, item.href, "menu-texts"));

  const hours = document.querySelector("#shop-hours");
  hours.replaceChildren();
  (shop.schedule || []).forEach((item) => {
    hours.append(makeElement("p", "", `${item.days}: ${item.time}`));
  });
}

function renderCategories(categories) {
  const categoryMenu = document.querySelector("#category-menu-links");
  const categoryCards = document.querySelector("#category-cards");
  const footerCategories = document.querySelector("#footer-category-links");
  categoryMenu.replaceChildren();
  categoryCards.replaceChildren();
  footerCategories.replaceChildren();

  categories.forEach((category) => {
    const href = `#${category.slug}`;
    const menuLink = appendLink(categoryMenu, category.name, href, "hidden-content-links");
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.classList.add("left-icon");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "./svgs/left.svg");
    arrow.append(use);
    menuLink.append(arrow);

    const card = appendLink(categoryCards, "", href, "categories-box");
    const icon = makeElement("span", "categories-icon category-emoji", category.emoji || "🛒");
    icon.style.backgroundColor = category.color || "var(--light-blue)";
    card.append(icon, makeElement("p", "categories-name", category.name));
    appendLink(footerCategories, category.name, href);
  });
}

function renderCategorySections(categories, products, stock, offersByProductId) {
  const container = document.querySelector("#category-product-sections");
  container.replaceChildren();
  categories.filter((category) => category.slug !== "dairy").forEach((category) => {
    const categoryProducts = products.filter((product) => product.categoryId === category.id);
    const section = makeElement("section", "recommendation category-products-section");
    section.id = category.slug;
    const title = makeElement("h2", "recommendation-title", `${category.emoji || "🛒"} ${category.name}`);
    section.append(title);

    const carouselElement = makeElement("div", "dairy-carousel category-carousel");
    const viewport = makeElement("div", "dairy-carousel-viewport");
    const list = makeElement("ul", "products category-products-list");
    list.id = `${category.slug}-products`;
    const previous = makeElement("button", "dairy-prev-button");
    previous.type = "button";
    previous.textContent = "→";
    previous.disabled = true;
    previous.id = `${category.slug}-prev`;
    const next = makeElement("button", "dairy-next-button");
    next.type = "button";
    next.textContent = "←";
    next.type = "button";
    next.id = `${category.slug}-next`;

    const fragment = document.createDocumentFragment();
    categoryProducts.forEach((product) => {
      fragment.append(createProductCard(product, {
        offer: offersByProductId.get(product.id) || null,
        stock,
        categoryName: category.name,
        templateId: "category-product-template",
      }));
    });
    list.append(fragment);
    viewport.append(list);
    const controls = makeElement("div", "dairy-carousel-controls");
    controls.append(previous, next);
    carouselElement.append(viewport, controls);
    section.append(carouselElement);

    if (categoryProducts.length === 0) {
      viewport.append(makeElement("p", "api-status", "محصولی برای این دسته وجود ندارد."));
      previous.disabled = true;
      next.disabled = true;
    } else {
      setupCarousel({ products: list, viewport, previous, next, offset: 0 });
    }
    container.append(section);
  });
}
