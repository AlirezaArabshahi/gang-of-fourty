const PRODUCTS_URL = "../../api/products.json"
const DAIRY_CATEGORY_ID = 2 
const priceFormatter = new Intl.NumberFormat("fa-IR")


const dairyTrack = document.querySelector('#dairy-track')
const dairyStatus = document.querySelector("#dairy-status")
const dairyControls = document.querySelector("#dairy-controls")


async function loadJSON(url) {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
    }
    return response.json()
}


function showStatus(message, isError = false) {
    dairyStatus.textContent = message
    dairyStatus.classList.toggle("is-error", isError)
}

function createProductCard(product, cardId) {
    const titleId = `${cardId}-name`

    const card = document.createElement("article")
    card.className = "product-card"
    card.id = cardId
    card.setAttribute("aria-labelldby", titleId)

    const imageContainer = document.createElement("div")
    imageContainer.className = "product-image"

    const icon = document.createElement("span")
    icon.className = "product-icon"
    icon.setAttribute("aria-hidden", "true")
    icon.textContent = product.emoji

    imageContainer.append(icon)

    const title = document.createElement("h3")
    title.id = titleId
    title.textContent = product.name
    

    const amount = document.createElement("p")
    amount.className = "product-amount"
    amount.textContent = product.unit

    const prices = document.createElement("div")
    prices.className = "product-prices"

    const currentPrice = document.createElement("p")
    currentPrice.className = "current-price"

    const priceValue = document.createElement("strong")
    priceValue.textContent = priceFormatter.format(product.price)

    currentPrice.append("قیمت: ", priceValue, " تومان")
    prices.append(currentPrice)


    const addButton = document.createElement("button")
    addButton.className = "add-button"
    addButton.type = "button"
    addButton.setAttribute("aria-label", `افزودن ${product.name} به سبد خرید`)

    const plusIcon = document.createElement("span")
    plusIcon.setAttribute("aria-hidden", "true")
    plusIcon.textContent = "+"
    addButton.append("افزودن به سبد", plusIcon)


    card.append(imageContainer, title, amount, prices, addButton)
    
    return card
}

function renderProducts(products) {
    dairyTrack.replaceChildren()
    products.forEach((product, index) => {
        let cardId = `dairy-products-${product.id}`

        if(index === 0)
            cardId = "dairy-first"
        else if (index === products.length - 1)
            cardId = "dairy-last"

        const card = createProductCard(product, cardId)
        dairyTrack.append(card)
    })

    const lastLink = dairyControls.querySelector("a:last-child")
    lastLink.setAttribute("href", products.length === 1 ? "#dairy-first" : "#dairy-last")
}

//load and display carousel
async function initDiaryCarousel() {
    dairyControls.hidden = true
    dairyTrack.setAttribute("aria-busy", "true")

    showStatus("در خال بارگذاری محصولات ...")

    try {
        const products = await loadJSON(PRODUCTS_URL)

        if(!Array.isArray(products)) {
            throw new Error("Expected an array of products.")
        }

        const dairyProducts = products.filter( product => product.categoryId === DAIRY_CATEGORY_ID)
        renderProducts(dairyProducts)

        if (dairyProducts.length === 0){
            showStatus("محصولی در این دسته بندی موجود نیست.")
            return
        }

        showStatus("")
        dairyControls.hidden = false
    } catch (error) {
        console.error(error)
        dairyTrack.replaceChildren()

         showStatus(
            "بارگذاری محصولات انجام نشد. اتصال خود را بررسی کنید و صفحه را دوباره بارگذاری کنید.",
            true
        );
    } finally {
        dairyTrack.setAttribute("aria-busy", "false")
    }

}

initDiaryCarousel()