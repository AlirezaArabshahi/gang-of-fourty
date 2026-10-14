const PRODUCTS_URL = "../../api/products.json"
const STOCK_URL = "../../api/stock.json";
const OFFERS_URL = "../../api/offers.json";

const DAIRY_CATEGORY_ID = 2 
const priceFormatter = new Intl.NumberFormat("fa-IR")

//prefix helps produce unique card IDs. Milk appears in both carousels, so its two cards must not share the same HTML ID.
const dairyCarousel = {
  prefix: "dairy",
  track: document.querySelector("#dairy-track"),
  status: document.querySelector("#dairy-status"),
  controls: document.querySelector("#dairy-controls")
};
const offersCarousel = {
  prefix: "offers",
  track: document.querySelector("#offers-track"),
  status: document.querySelector("#offers-status"),
  controls: document.querySelector("#offers-controls")
};
const carousels = [dairyCarousel, offersCarousel];


async function loadJSON(url) {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`)
    }
    return response.json()
}


function showStatus(carousel, message, isError = false) {
    carousel.status.textContent = message;
    carousel.status.classList.toggle("is-error", isError);
}

function createProductCard(product, cardId, quantity, offer) {
    const titleId = `${cardId}-name`
    const statusId = `${cardId}-status`;

    const isUnavailable = quantity === 0

    let finalPrice = product.price
    if (offer) {
        finalPrice = Math.round(product.price * (1 - offer.percent / 100))
    }

    const card = document.createElement("article")
    card.className = "product-card"
    card.id = cardId
    card.setAttribute("aria-labelledby", titleId)
    card.classList.toggle("is-unavailable", isUnavailable);

    const imageContainer = document.createElement("div")
    imageContainer.className = "product-image"

    const icon = document.createElement("span")
    icon.className = "product-icon"
    icon.setAttribute("aria-hidden", "true")
    icon.textContent = product.emoji

    imageContainer.append(icon)

    //discount badge
    if (offer) {
        const discountBadge = document.createElement("span")
        discountBadge.className = "discount-badge"
        discountBadge.textContent = `${priceFormatter.format(offer.percent)} % تخفیف`
        imageContainer.append(discountBadge)
    }

    //unavailable badge
    if (isUnavailable) {
        const stockBadge = document.createElement("span")
        stockBadge.className = "stock-badge"
        stockBadge.textContent = "ناموجود"
        stockBadge.setAttribute("aria-hidden", "true");
        imageContainer.append(stockBadge)
    }

    const title = document.createElement("h3")
    title.id = titleId
    title.textContent = product.name
    
    //price
    const prices = document.createElement("div")
    prices.className = "product-prices"

    if(offer) {
        const previousPrice = document.createElement("p")
        previousPrice.className = "previous-price";

        const oldPriceValue = document.createElement("del");
        oldPriceValue.textContent =`${priceFormatter.format(product.price)} تومان`;

        previousPrice.append("قیمت قبلی: ", oldPriceValue);
        prices.append(previousPrice);
    }
    const currentPrice = document.createElement("p")
    currentPrice.className = "current-price"

    const priceValue = document.createElement("strong")
    priceValue.textContent = priceFormatter.format(finalPrice)
    
    const priceLabel = offer ? "قیمت با تخفیف: " : "قیمت: ";

    currentPrice.append(priceLabel, priceValue, " تومان")
    prices.append(currentPrice)


    //amount
    const amount = document.createElement("p")
    amount.className = "product-amount"
    amount.textContent = product.unit

    if(isUnavailable) {
        const stockStatus = document.createElement("p")
        stockStatus.className = "stock-status"
        stockStatus.id = statusId
        stockStatus.textContent = "ناموجود"

        prices.append(stockStatus);
        card.setAttribute("aria-describedby", statusId);
    }

    const addButton = document.createElement("button")
    addButton.className = "add-button"
    addButton.type = "button"
    addButton.setAttribute("aria-label", `افزودن ${product.name} به سبد خرید`)
    addButton.disabled = isUnavailable;

    const buttonIcon = document.createElement("span");
    buttonIcon.setAttribute("aria-hidden", "true");
    buttonIcon.textContent = isUnavailable ? "×" : "+";

    addButton.append("افزودن به سبد ", buttonIcon);


    card.append(imageContainer, title, amount, prices, addButton)
    
    return card
}

function renderProducts(carousel, products, stock, offers) {
    carousel.track.replaceChildren()
    carousel.controls.hidden = true

    if (products.length === 0) {
        showStatus(carousel, "محصولی برای نمایش وجود ندارد.")
        return
    }

    products.forEach((product, index) => {
        let cardId = `${carousel.prefix}-product-${product.id}`

        if(index === 0)
            cardId = `${carousel.prefix}-first`
        else if (index === products.length - 1)
            cardId = `${carousel.prefix}-last`

        const quantity = stock.items[product.id]

        if (!Number.isInteger(quantity) || quantity < 0){
            throw new Error(`Invalid stock for product ${product.id}`)
        }

        const offer = offers.find(item => item.productId === product.id)

        const card = createProductCard(product, cardId, quantity, offer)

        carousel.track.append(card)

    })

    const firstLink =
        carousel.controls.querySelector("a:first-child");

    const lastLink =
        carousel.controls.querySelector("a:last-child");

    firstLink.setAttribute(
        "href",
        `#${carousel.prefix}-first`
    );

    lastLink.setAttribute(
        "href",
        products.length === 1
        ? `#${carousel.prefix}-first`
        : `#${carousel.prefix}-last`
    );

    showStatus(carousel, "");
    carousel.controls.hidden = false;
}

//load and display carousel
async function initcarousels() {
    carousels.forEach(carousel => {
        carousel.track.replaceChildren();
        carousel.controls.hidden = true;
        carousel.track.setAttribute("aria-busy", "true");

        showStatus(carousel, "در حال بارگذاری محصولات...");
    });

    try {
        const [products, stock, offers] = await Promise.all([
            loadJSON(PRODUCTS_URL),
            loadJSON(STOCK_URL),
            loadJSON(OFFERS_URL)
        ])

        if(!Array.isArray(products) || !Array.isArray(offers)) {
            throw new Error("Expected products and offers to be arrays.")
        }

        if (
            !stock ||
            !stock.items ||
            typeof stock.items !== "object" ||
            Array.isArray(stock.items)
        ) {
            throw new Error("Expected a stock.items object.");
        }

        const dairyProducts = products.filter( product => product.categoryId === DAIRY_CATEGORY_ID)
        const discountedProducts = products.filter(product => offers.some(offer => offer.productId === product.id))

        renderProducts(
            dairyCarousel,
            dairyProducts,
            stock,
            offers
        );

        renderProducts(
            offersCarousel,
            discountedProducts,
            stock,
            offers
        );

    } catch (error) {

        console.error(error)
        carousels.forEach(carousel => {
            carousel.track.replaceChildren();
            carousel.controls.hidden = true;

            showStatus(
                carousel,
                "بارگذاری اطلاعات محصولات انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.",
                true
                );
        });
    } finally {
       carousels.forEach(carousel => {
        carousel.track.setAttribute("aria-busy", "false")
       }) 

    }

}

initcarousels()