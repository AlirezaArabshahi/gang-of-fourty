import type { Product } from './types';
import type FuseType from 'fuse.js';
import { state, inStock } from './state';
import { updateCartItem } from './cart-actions';
import { h, renderImageOrEmoji, closestTarget } from './dom';
import { renderCartButton } from './product-card';
import { priceFmt, getFinalPrice } from './format';

export function setupSearch(products: Product[]): void {
  const input = document.querySelector<HTMLInputElement>('#search-input');
  const box = document.getElementById('search-results');
  if (!input || !box) return;

  let fusePromise: Promise<FuseType<Product>> | null = null;

  const getFuse = (): Promise<FuseType<Product>> => {
    if (!fusePromise) {
      fusePromise = import('fuse.js').then(({ default: Fuse }) =>
        new Fuse(products, {
          keys: ['name', 'tags'],
          threshold: 0.4,
          ignoreLocation: true,
        }),
      );
    }
    return fusePromise;
  };

  input.addEventListener('focus', () => void getFuse(), { once: true });

  const close = (): void => {
    box.hidden = true;
    box.replaceChildren();
  };

  input.addEventListener('input', async () => {
    const q = input.value.trim();
    if (!q) return close();

    const fuse = await getFuse();
    if (input.value.trim() !== q) return; 

    const hits = fuse.search(q).map((r) => r.item).slice(0, 8);
    box.replaceChildren();

    if (hits.length === 0) {
      const empty = h('p', { className: 'search-results__empty', textContent: 'نتیجه‌ای یافت نشد' });
      empty.setAttribute('role', 'status');
      box.appendChild(empty);
      box.hidden = false;
      return;
    }

    for (const p of hits) {
      const offer = state.offerMap.get(p.id);
      const final = getFinalPrice(p.price, offer);
      const available = inStock(p.id);

      const imgWrap = h('div', { className: 'search-results__img' });
      renderImageOrEmoji(imgWrap, p.image, p.name, p.emoji);

      const info = h('div', { className: 'search-results__info' },
        h('span', { className: 'search-results__name', textContent: p.name }),
        h('span', {
          className: 'search-results__price',
          textContent: `${priceFmt.format(final)} تومان`,
        }),
      );

      const actions = h('div', {
        className: 'product__actions search-results__actions',
        dataset: { productId: String(p.id), productName: p.name },
      });

      if (available) {
        renderCartButton(actions, p.id, p.name);
      } else {
        actions.appendChild(
          h('span', { className: 'search-results__out', textContent: 'ناموجود' }),
        );
      }

      const item = h('div', { className: 'search-results__item', role: 'listitem' });
      item.dataset.productId = String(p.id);
      item.dataset.stock = available ? 'in' : 'out';
      item.append(imgWrap, info, actions);
      box.appendChild(item);
    }

    box.hidden = false;
  });

  box.addEventListener('click', (e) => {
    const item = closestTarget<HTMLElement>(e, '.search-results__item');
    if (!item) return;
    if (item.dataset.stock === 'out') return;
    if (closestTarget(e, '.search-results__actions')) return;
    const pid = item.dataset.productId;
    if (!pid) return;

    const name = item.querySelector('.search-results__name')?.textContent || 'کالا';
    const actions = item.querySelector<HTMLElement>('.search-results__actions');
    if (!actions) return;

    updateCartItem(actions, pid, name, 1);

    item.dataset.state = 'added';
    setTimeout(() => delete item.dataset.state, 300);
  });

  document.addEventListener('click', (e) => {
    if (!e.composedPath().includes(box) && e.target !== input) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}