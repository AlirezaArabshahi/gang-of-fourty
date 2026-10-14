// Fetches one JSON file and returns its parsed data.
// Throws if the request fails or the response is not ok (e.g. 404),
// so the caller can show an error message.
// url: path to the JSON file, objectName: used in the error message.
async function getDataObjects(url, objectName) {
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Failed to fetch ${objectName}`);
    }

    const resData = await res.json();
    return resData;
}


// Loads categories and products in parallel with Promise.all,
// so total wait time is the slowest request, not the sum.
// Returns { categories, products }. Any failure is rethrown to the caller.
async function getData() {
    const [categories, products, offeredProducts, stock] = await Promise.all([
        getDataObjects('../../api/categories.json', "categories"),
        getDataObjects('../../api/products.json', "products"),
        getDataObjects('../../api/offers.json', "offeredProducts"),
        getDataObjects('../../api/stock.json', "stock")]);
    return { categories, products, offeredProducts, stock };
}   


// Finds a category by its name and returns its id.
// categories: array from categories.json, name: the category to look for.
// Note: find() returns undefined if nothing matches.
function getCategoryID(name, categories) {
    const categoryItem = categories.find(element => element.name === name);
    return categoryItem.id;
}


// Returns only the products that belong to the given category.
// id: category id (a number), products: array from products.json.
function filterProductsByCategoryID(id, products) {
    const filteredProducts = products.filter(item => item.categoryId === id);
    return filteredProducts;
}


// Builds one product card element from a product object and returns it.
function createProductCard(product, label , percent) {
    const carouselItem = document.createElement("li");

    const card = document.createElement("article");
    card.classList.add("product-card");

    const img = document.createElement("span");
    img.textContent = product.emoji;
    img.classList.add("product-img");


    const title = document.createElement("h3");
    title.textContent = product.name;
    title.id = `product-${product.id}`;

    const unit = document.createElement("p");
    unit.textContent = product.unit;

    const cardFooter = document.createElement("div");
    cardFooter.classList.add("card-footer");

    const priceBox = document.createElement("div");
    priceBox.classList.add("price");

  
    
    if(percent) {
        const price = document.createElement("del");
        price.textContent = `${new Intl.NumberFormat('fa-IR').format(product.price)} تومان`;

        const offeredPrice = document.createElement("strong");
        offeredPrice.textContent = `${new Intl.NumberFormat('fa-IR').format(Math.round(product.price - (percent*product.price)/100))} تومان`;
        priceBox.append(price,offeredPrice);

    }
    else {
        const price = document.createElement("strong");
        price.textContent = `${new Intl.NumberFormat('fa-IR').format(product.price)} تومان`;
        priceBox.append(price);
    }
   

    

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-describedby", title.id);
    cardFooter.append(priceBox, button);

    const plus = document.createElement("span");
    plus.textContent = "+";
    plus.setAttribute("aria-hidden", "true");
    const plusContent = document.createElement("span");
    plusContent.textContent = "افزودن به سبد خرید";
    plusContent.classList.add("visually-hidden");
    button.append(plus, plusContent);
    
    if(label) {
        let badge = document.createElement("span");
        badge.classList.add("discount-badge");

        let badgeReader = document.createElement("span");
        badgeReader.classList.add("visually-hidden");

        if(label === "ناموجود") {
            badge.textContent = label;
            badgeReader.textContent = label;
        }
        else {
            badge.textContent = `${new Intl.NumberFormat('fa-IR').format(percent)} ٪`;
            badgeReader.textContent = "تخفیف";
        }

        badge.append(badgeReader);

        card.append(img,badge, title, unit, cardFooter);
    }
    else {
        card.append(img, title, unit, cardFooter);
    }
    
    carouselItem.append(card);

    return carouselItem;
}


// Renders a list of product cards inside the carousel with the given id.
// The first and last cards get ids (first-<id>, last-<id>) so the arrows can jump to them.
// data: array of products, queryId: id of the section (a string).
function renderProducts(data, queryId, offeredProducts, stock) {
    const productList = data.map((item, index) => {
        const offered = offeredProducts.find(offered => offered.productId == item.id);
        const productNumber = stock.items[item.id];
        let label;
        let percent;
       
        if(productNumber === 0 ) {
            label = "ناموجود";
        }
        else if (offered) {
            label = offered.label;
            percent = offered.percent
        }
        const productCard = createProductCard(item,label, percent);
        if (index === 0) {
            productCard.id = `first-${queryId}`;
        }
        if (index === data.length - 1) {
            productCard.id = `last-${queryId}`;
        }
        return productCard;
        
    });
    const htmlTag = document.querySelector(`#${queryId}`);
    htmlTag.querySelector("ul").append(...productList);
}


// Show message for loading data and errors
// container: html tag which message be shown in that, text : the content of message, type: load or error
function showMessage(container, text, type) {
    const content = document.createElement("p");
    content.textContent = text;
    content.classList.add("msg");
    
    if (type === "load") {
        content.classList.add("load-msg");
        content.setAttribute("role", "status");
    }
    else {
        content.classList.add("error-msg");
        content.setAttribute("role", "alert");
    }
    document.querySelector(container).append(content);
}

// Removes the message (loading or error) shown by showMessage.
// container: CSS selector of the section that holds it (e.g. "#dairy").
// Does nothing if there is no message.
function clearMessage(container) {
    const box = document.querySelector(container);
    const message = box.querySelector(".msg");
    message?.remove();
}

// Entry point: loads the data, picks the dairy products
// and renders them. Errors are caught here, because this is
// the one place that knows about the page.
async function init() {
    try {
        showMessage("#dairy", "در حال بارگذاری…", "load");
        const { categories, products, offeredProducts, stock } = await getData();
        clearMessage("#dairy");
        //Get "لبنیات" products
        const categoryId = getCategoryID("لبنیات", categories);
        const filteredProducts = filterProductsByCategoryID(categoryId, products);

        // Render the dairy carousel
        renderProducts(filteredProducts, "dairy",offeredProducts, stock);

    } catch (error) {
        clearMessage("#dairy");
        showMessage("#dairy", "بارگذاری محصولات ممکن نشد. اینترنت را بررسی کنید.", "error");
        console.error(error);
    }
}

init();
