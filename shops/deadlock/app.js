
function createProductCard(product, offer, stockCount){
    const article = document.createElement('article')
    const span = document.createElement('span')
    span.setAttribute('aria-hidden', 'true')
    span.classList.add('product-emoji')
    span.textContent = product.emoji
    const div = document.createElement('div')
    const btn = document.createElement('button')
    btn.textContent= "+"
    btn.classList.add('add-to-cart')
    btn.setAttribute('type','button')
    btn.setAttribute('aria-label','افزودن به سبد خرید')
    const p = document.createElement('p')
    p.textContent = product.unit
    const price = document.createElement('p')

    price.textContent = new Intl.NumberFormat('fa-IR').format(product.price )+" تومان"
    article.classList.add('tent-article')
    const h3Item = document.createElement('h3')
    h3Item.textContent=product.name
    
    article.append(span)
    article.append(h3Item)
    article.append(p)
    // if product has discount we use this condition
    if(offer){
        const discountSpan = document.createElement('span')
        discountSpan.classList.add('discount-badge')
        discountSpan.textContent = new Intl.NumberFormat('fa-IR').format(offer.percent )+'٪'
        
        article.append(discountSpan)

        const discountPrice = document.createElement('p')
        discountPrice.classList.add('discount-price')
        discountPrice.textContent = new Intl.NumberFormat('fa-IR').format(product.price) + " تومان"
        article.append(discountPrice)

        const newPrice = Math.round((100 - offer.percent) * product.price / 100)
        price.textContent = new Intl.NumberFormat('fa-IR').format(newPrice)+" تومان"
    }
    if(stockCount === 0){
        article.classList.add('out-of-stock')
        const outOfstock= document.createElement('p')
        p.classList.add('stock-label')
        p.textContent = "ناموجود"
        article.append(outOfstock)
        btn.setAttribute('disabled', 'true')
        btn.setAttribute('aria-label','ناموجود')
    }
    article.append(div)
    div.append(price)
    div.append(btn)
    return article
}
async function getJSON(fileName) {
    const res = await fetch(`../../api/${fileName}.json`)
    if(!res.ok){
        throw new Error(`something went wrong with ${fileName}`)
        }
    return await res.json()
}
async function loadProducts(){
    const container = document.querySelector('#tents .carousel')
    const loadingMessage = document.createElement('p')
    loadingMessage.classList.add('carousel-message')
    loadingMessage.textContent = "در حال بارگذاری..."
    container.append(loadingMessage) 
    try {
        const[products, stock, offers] = await Promise.all([getJSON('products'), getJSON('stock'), getJSON('offers')])
        const pantryProducts = products.filter((n) => n.categoryId === 4)
        loadingMessage.remove()
        for(let i = 0; i < pantryProducts.length; i++){
            const product = pantryProducts[i]
            const stockCount = stock.items[product.id]
            const offer = offers.find((o) => o.productId === product.id)
            console.log(product, stockCount, offer)
            const card = createProductCard(product, offer, stockCount)
            container.append(card)
            
        }
       
        
    } catch (error) {
        loadingMessage.remove()
        console.log(error.message)

        const errorMessage = document.createElement('p')
        errorMessage.classList.add('carousel-message')
        errorMessage.textContent = 'متأسفانه محصولات بارگذاری نشد. لطفاً دوباره تلاش کنید.'
        container.append(errorMessage)
    }
    
    
    
}
loadProducts()