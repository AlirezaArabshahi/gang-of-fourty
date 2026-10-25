import { isRecord } from './validators';
import { STORAGE_KEYS } from './storage';
import { priceFmt } from './format';
import { state, inStock } from './state';

let cachedCart: Record<string, number> | null = null;

function readFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cart);
    if (!raw) return {};
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return {};
    const out: Record<string, number> = {};
    for (const [id, qty] of Object.entries(data)) {
      const n = Number(qty);
      if (Number.isFinite(n) && n > 0) out[id] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

function loadCart(): Record<string, number> {
  if (!cachedCart) cachedCart = readFromStorage();
  return cachedCart;
}

function saveCart(cart: Record<string, number>): void {
  cachedCart = cart;
  try {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  } catch (err) {
    console.warn('[cart] failed to save', err);
  }
  updateCartBadge();
}

export function getQty(id: string | number): number {
  return loadCart()[String(id)] ?? 0;
}

export function changeQty(id: string | number, delta: number): number {
  const key = String(id);
  const cart = { ...loadCart() };

  const current = cart[key] ?? 0;
  let next = Math.max(0, Math.floor(current + delta));

  const numericId = Number(key);
  if (Number.isFinite(numericId) && inStock(numericId)) {
    const cap = state.stock?.items[numericId] ?? 0;
    if (next > cap) next = cap;
  }

  if (next === 0) delete cart[key];
  else cart[key] = next;
  saveCart(cart);
  return next;
}

function cartTotal(): number {
  return Object.values(loadCart()).reduce((sum, n) => sum + n, 0);
}

export function updateCartBadge(): void {
  const total = cartTotal();
  const badge = document.getElementById('cart-badge');
  const status = document.getElementById('cart-status');

  if (badge) {
    badge.textContent = priceFmt.format(total);
    badge.hidden = total === 0;
  }
  if (status) {
    status.textContent =
      total === 0
        ? 'سبد خرید خالی است'
        : `${priceFmt.format(total)} کالا در سبد خرید`;
  }
}

export function setupCartSync(): void {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEYS.cart) return;
    cachedCart = null;
    updateCartBadge();
  });
}