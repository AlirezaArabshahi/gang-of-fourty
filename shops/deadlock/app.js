
function createProductCard(product){
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
    article.append(div)
    div.append(price)
    div.append(btn)
    return article
}
async function loadProducts(){
    const res = await fetch('../../api/products.json')
    const products = await res.json()
    const pantryProducts = products.filter((n) => n.categoryId === 4)
    const container = document.querySelector('#tents .carousel')
    
    for(let i = 0; i < pantryProducts.length; i++){
        const card = createProductCard(pantryProducts[i])
        container.append(card)
    }

}
loadProducts()