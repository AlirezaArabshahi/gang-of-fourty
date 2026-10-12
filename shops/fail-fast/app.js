
const API_URL = "../../api/products.json";

async function loadDairyProducts() {
  const container = document.querySelector("#dairy");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("دریافت محصولات با خطا مواجه شد");
    }

    const products = await response.json();

    const dairyProducts = products.filter(function (product) {
      return product.categoryId === 2;
    });

    container.textContent = "";

    dairyProducts.forEach(function (product) {
      const card = document.createElement("article");
      card.classList.add("product");

      const image = document.createElement("div");
      image.classList.add("product-emoji");

      const emoji = document.createElement("span");
      emoji.textContent = product.emoji;
      image.appendChild(emoji);

      const info = document.createElement("div");
      info.classList.add("product-info");

      const name = document.createElement("h3");
      name.textContent = product.name;

      const unit = document.createElement("p");
      unit.textContent = product.unit;

      const price = document.createElement("strong");
      price.textContent =
        product.price.toLocaleString("fa-IR") + " تومان";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "+";
      button.setAttribute("aria-label", "افزودن " + product.name);

      info.appendChild(name);
      info.appendChild(unit);
      info.appendChild(price);
      info.appendChild(button);

      card.appendChild(image);
      card.appendChild(info);

      container.appendChild(card);
    });
  } catch (error) {
    container.textContent = "دریافت محصولات ناموفق بود. لطفاً دوباره تلاش کنید.";
    console.error("خطا در دریافت محصولات:", error);
  }
}

loadDairyProducts();


// daily offers

async function loadDailyOffers() {
  const container = document.querySelector("#dailyOffers");

  try {
    const [productsResponse, offersResponse, stockResponse] =
      await Promise.all([
        fetch("../../api/products.json"),
        fetch("../../api/offers.json"),
        fetch("../../api/stock.json")
      ]);

    if (
      !productsResponse.ok ||
      !offersResponse.ok ||
      !stockResponse.ok
    ) {
      throw new Error("دریافت اطلاعات با خطا مواجه شد");
    }

    const [products, offers, stock] = await Promise.all([
      productsResponse.json(),
      offersResponse.json(),
      stockResponse.json()
    ]);

const offerProducts = products
  .map(function (product) {
    const offer = offers.find(function (offer) {
      return offer.productId === product.id;
    });

    if (!offer) {
      return null;
    }

    const quantity = stock.items[product.id];

    return {
      ...product,
      percent: offer.percent,
      label: offer.label,
      quantity: quantity,
      discountedPrice: Math.round(
        product.price * (100 - offer.percent) / 100
      )
    };
  })
  .filter(function (product) {
    return product !== null;
  });

  console.log("Offer products:", offerProducts);


container.replaceChildren();

offerProducts.forEach(function (product, index) {
  const card = document.createElement("article");
  card.classList.add("product");

  if (product.quantity === 0) {
    card.classList.add("out-of-stock");
  }

  if (index === 0) {
    card.id = "offer-first";
  }

  if (index === offerProducts.length - 1) {
    card.id = "offer-last";
  }

  const emoji = document.createElement("span");
  emoji.classList.add("product-emoji");
  emoji.textContent = product.emoji;

  const info = document.createElement("div");
  info.classList.add("product-info");

  const name = document.createElement("h3");
  name.textContent = product.name;

  const unit = document.createElement("p");
  unit.textContent = product.unit;

  const discountBadge = document.createElement("span");
  discountBadge.classList.add("discount-badge");
  discountBadge.textContent = `${product.percent}٪ تخفیف`;

  const oldPrice = document.createElement("small");
  oldPrice.classList.add("off");
  oldPrice.textContent =
    `${new Intl.NumberFormat("fa-IR").format(product.price)} تومان`;

  const newPrice = document.createElement("strong");
  newPrice.textContent =
    `${new Intl.NumberFormat("fa-IR").format(product.discountedPrice)} تومان`;

  const priceContainer = document.createElement("div");
  priceContainer.classList.add("off-content");
  priceContainer.append(oldPrice, newPrice);

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "+";
  button.setAttribute("aria-label", `افزودن ${product.name} به سبد خرید`);

  if (product.quantity === 0) {
    const unavailableBadge = document.createElement("span");
    unavailableBadge.classList.add("unavailable-badge");
    unavailableBadge.textContent = "ناموجود";

    button.disabled = true;

    info.append(name, unit, discountBadge, unavailableBadge, priceContainer, button);
  } else {
    info.append(name, unit, discountBadge, priceContainer, button);
  }

  card.append(emoji, info);
  container.appendChild(card);
});



    // console.log("Products:", products);
    // console.log("Offers:", offers);
    // console.log("Stock:", stock);
  } catch (error) {
    console.error("خطا در دریافت پیشنهادها:", error);

    const errorMessage = document.createElement("p");
    errorMessage.textContent =
      "دریافت پیشنهادها با مشکل مواجه شد. لطفاً دوباره تلاش کنید.";

    container.replaceChildren(errorMessage);
  }
}

loadDailyOffers();
