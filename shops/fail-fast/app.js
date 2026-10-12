
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


async function dailyOffers() {
  const container = document.querySelector("#dailyOffers");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("دریافت محصولات با خطا مواجه شد");
    }

    const products = await response.json();

    const dailyProducts = products.filter(function (product) {
      return product.categoryId === 7;
    });

    container.textContent = "";

    dailyProducts.forEach(function (product) {
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

dailyOffers();
