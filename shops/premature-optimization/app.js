const PRODUCTS_API_URL = "../../api/products.json";
const DAIRY_CATEGORY_ID = 2;

const productsContainer = document.querySelector("#dairy-products");
const statusMessage = document.querySelector("#dairy-status");
const numberFormatter = new Intl.NumberFormat("fa-IR");
const dairyViewport = document.querySelector(".dairy-carousel-viewport");
const dairyPreviousButton = document.querySelector("#dairy-prev");
const dairyNextButton = document.querySelector("#dairy-next");
let dairyOffset = 0;

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("api-status--error", isError);
  statusMessage.hidden = false;
}

function createProductCard(product) {
  const template = document.querySelector("#product-card-template");
  const card = template.content.firstElementChild.cloneNode(true);

  card.querySelector(".product-emoji").textContent = product.emoji;
  card.querySelector(".item-title").textContent = product.name;
  card.querySelector(".item-description").textContent = product.unit;
  card.querySelector(".item-price").textContent = `${numberFormatter.format(product.price)} تومان`;
  card.querySelector(".buy-button").setAttribute(
    "aria-label",
    `افزودن ${product.name} به سبد خرید`
  );

  return card;
}

async function loadDairyProducts() {
  showStatus("در حال بارگذاری محصولات...");

  try {
    const response = await fetch(PRODUCTS_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const products = await response.json();
    const dairyProducts = products.filter(
      (product) => product.categoryId === DAIRY_CATEGORY_ID
    );

    if (dairyProducts.length === 0) {
      showStatus("در حال حاضر محصولی برای نمایش وجود ندارد.");
      return;
    }

    const fragment = document.createDocumentFragment();

    dairyProducts.forEach((product) => {
      fragment.append(createProductCard(product));
    });

    productsContainer.replaceChildren(fragment);
    statusMessage.hidden = true;
    dairyOffset = 0;
    requestAnimationFrame(updateDairyCarousel);
    dairyPreviousButton.addEventListener("click", () => moveDairyCarousel(-1));
    dairyNextButton.addEventListener("click", () => moveDairyCarousel(1));
    window.addEventListener("resize", updateDairyCarousel);
  } catch (error) {
    productsContainer.replaceChildren();
    showStatus(
      "بارگذاری محصولات با مشکل مواجه شد. لطفاً اتصال اینترنت را بررسی و صفحه را دوباره بارگذاری کنید.",
      true
    );
  }
}

loadDairyProducts();


// Move exactly one card per click and clamp at the last card on every screen size.
function updateDairyCarousel() {
  const firstCard = productsContainer.querySelector(".product-item");
  if (!firstCard) return;

  const styles = getComputedStyle(productsContainer);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
  const step = firstCard.getBoundingClientRect().width + gap;
  const maxOffset = Math.max(0, productsContainer.scrollWidth - dairyViewport.clientWidth);

  dairyOffset = Math.min(dairyOffset, maxOffset);
  productsContainer.style.transform = `translateX(${dairyOffset}px)`;
  dairyPreviousButton.disabled = dairyOffset <= 0;
  dairyNextButton.disabled = dairyOffset >= maxOffset - 1;
  productsContainer.dataset.carouselStep = String(step);
}

function moveDairyCarousel(direction) {
  const firstCard = productsContainer.querySelector(".product-item");
  if (!firstCard) return;

  const styles = getComputedStyle(productsContainer);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
  const step = firstCard.getBoundingClientRect().width + gap;
  const maxOffset = Math.max(0, productsContainer.scrollWidth - dairyViewport.clientWidth);

  dairyOffset = Math.max(0, Math.min(maxOffset, dairyOffset + direction * step));
  productsContainer.style.transform = `translateX(${dairyOffset}px)`;
  dairyPreviousButton.disabled = dairyOffset <= 0;
  dairyNextButton.disabled = dairyOffset >= maxOffset - 1;
}
