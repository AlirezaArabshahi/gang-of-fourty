import { changeQty } from './cart';
import { notyf } from './toast';
import { renderCartButton } from './product-card';
import { fireConfetti } from './confetti';
import { closestTarget } from './dom';
import { inStock } from './state';

export function setupCartEvents(): void {
  document.addEventListener('click', (e) => {
    const btn = closestTarget<HTMLButtonElement>(e, '[data-action="inc"], [data-action="dec"]');
    if (!btn || btn.disabled) return;
    const actions = btn.closest<HTMLElement>('.product__actions');
    if (!actions) return;
    const id = actions.dataset.productId;
    if (!id) return;

    e.preventDefault();
    const name = actions.dataset.productName || 'کالا';
    const delta = btn.dataset.action === 'inc' ? 1 : -1;

    if (delta > 0 && !inStock(Number(id))) return;

    updateCartItem(actions, id, name, delta);
  });
}

export function updateCartItem(
  actions: HTMLElement,
  id: string,
  name: string,
  delta: number,
): void {
  const qty = changeQty(id, delta);
  renderCartButton(actions, id, name);

  if (delta > 0) {
    notyf.success(`${name} به سبد اضافه شد`);
    void fireConfetti();
  } else if (qty === 0) {
    notyf.error(`${name} از سبد حذف شد`);
  }

  const card = actions.closest<HTMLElement>('.product');
  if (card) {
    card.classList.remove('product--cart-pulse');
    void card.offsetWidth;
    card.classList.add('product--cart-pulse');
  }
}