import { el, makeButton } from '../utils/utils.js';
import { formatPrice } from '../utils/format.js';


const makeCard = (p) => {
    const card = el('article', 'card');
    card.dataset.productId = p.id;

    const top = el('div', 'card-top');

    const media = el('div', 'card-media');
    const emoji = el('span', 'card-emoji');
    emoji.textContent = p.emoji || '🛒';
    media.append(emoji);

    const title = el('h3', 'card-title');
    const titleLink = el('a', null, p.name);
    titleLink.href = `#product-${p.id}`;
    title.append(titleLink);

    const body = el('div', 'card-body');
    body.append(title);

    const price = el('p', 'price');
    const strong = el('strong', null, formatPrice(p.price));
    strong.append(el('small', null, 'تومان'));
    price.append(strong);

    if (p.oldPrice) {
        const del = el('del');
        del.append(
            el('span', 'sr-only', 'قیمت قبل از تخفیف '),
            formatPrice(p.oldPrice)
        );
        price.append(del);
    }

    const pair = el('div', 'act-pair');
    const favBtn = makeButton('act-btn', `افزودن ${p.name} به علاقه‌مندی‌ها`, 'i-heart');
    const cartBtn = makeButton('act-btn act-cart', `افزودن ${p.name} به سبد خرید`, 'i-cart', 'افزودن');

    if (p.stock === 0) {
        const chipOut = el('span', 'chip-out', 'ناموجود');
        card.classList.add('card--out');
        cartBtn.disabled = true;
        media.append(chipOut);
    }

    const actions = el('div', 'card-actions');
    pair.append(favBtn, cartBtn);
    actions.append(price, pair);

    card.append(top, media, body, actions);
    return card;
};

export { makeCard }