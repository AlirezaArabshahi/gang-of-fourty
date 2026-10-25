import type { Product, Offer } from './types';
import { getQty } from './cart';
import { h, renderImageOrEmoji } from './dom';
import { createIcon } from './icons';
import { priceFmt, discountPct, getFinalPrice, hasDiscount } from './format';

function mkBtn(className: string, label: string, action?: string, text?: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  if (action) btn.dataset.action = action;
  btn.setAttribute('aria-label', label);
  if (text !== undefined) btn.textContent = text;
  return btn;
}

export function renderCartButton(
  container: HTMLElement,
  productId: string | number,
  name: string,
): void {
  container.replaceChildren();
  container.dataset.productId = String(productId);
  container.dataset.productName = name;

  const qty = getQty(productId);
  if (qty <= 0) {
    const addBtn = mkBtn('product__add', `افزودن ${name} به سبد خرید`, 'inc');
    addBtn.appendChild(createIcon('plus'));
    container.appendChild(addBtn);
    return;
  }

  const dec = mkBtn('product__qty-btn', `کم کردن ${name}`, 'dec', '−');
  const value = priceFmt.format(qty);
  const val = h('span', { className: 'product__qty-val', textContent: value });
  val.setAttribute('aria-live', 'polite');
  val.setAttribute('aria-label', `تعداد ${name}: ${value}`);
  const inc = mkBtn('product__qty-btn', `افزودن ${name}`, 'inc', '+');
  const stepper = h('div', { className: 'product__qty' });
  stepper.append(dec, val, inc);
  container.appendChild(stepper);
}

export function renderProductCard(
  product: Product,
  offer: Offer | undefined,
  stock: number,
): HTMLLIElement {
  const outOfStock = stock === 0;
  const discounted = hasDiscount(offer) && !outOfStock;

  const li = h('li', { className: 'product-item' });
  const article = h('article', { className: 'product' });
  article.dataset.stock = outOfStock ? 'out' : 'in';

  const body = h('div', { className: 'product__link' });
  const imgWrap = h('span', { className: 'product__img' });
  renderImageOrEmoji(imgWrap, product.image, product.name, product.emoji, {
    plateClass: 'product__img--emoji',
    width: 200,
    height: 150,
  });

  if (outOfStock) {
    imgWrap.appendChild(h('span', { className: 'product__badge-stock', textContent: 'ناموجود' }));
  } else if (discounted && offer) {
    const badge = h('span', {
      className: 'product__discount',
      textContent: discountPct.format(offer.percent / 100),
    });
    badge.setAttribute('aria-label', `${offer.percent} درصد تخفیف`);
    imgWrap.appendChild(badge);
  }

  const name = h('h3', {
    className: 'product__name',
    textContent: `${product.name} — ${product.unit}`,
  });

  body.append(imgWrap, name);

  const footer = h('div', { className: 'product__footer' });
  const price = h('span', { className: 'product__price' });
  const final = getFinalPrice(product.price, offer);

  price.append(
    h('span', { className: 'product__current', textContent: priceFmt.format(final) }),
    h('span', { className: 'product__unit', textContent: 'تومان' }),
  );

  if (discounted) {
    const old = h('span', {
      className: 'product__old',
      textContent: priceFmt.format(product.price),
    });
    old.setAttribute('aria-label', `قیمت قبلی ${priceFmt.format(product.price)} تومان`);
    price.appendChild(old);
  }

  const actions = h('div', {
    className: 'product__actions',
    dataset: { productId: String(product.id), productName: product.name },
  });

  if (outOfStock) {
    const addBtn = mkBtn('product__add', `${product.name} ناموجود است`);
    addBtn.disabled = true;
    addBtn.appendChild(createIcon('plus'));
    actions.appendChild(addBtn);
  } else {
    renderCartButton(actions, product.id, product.name);
  }

  footer.append(price, actions);
  article.append(body, footer);
  li.appendChild(article);
  return li;
}