import type { Product, Card } from '../types';
import { closestTarget } from './dom';
import { renderSearchResults } from './search-results';

type SearchDeps = {
  products: Product[];
  toCard: (p: Product) => Card;
};

export function setupSearch(deps: SearchDeps): void {
  const input = document.querySelector<HTMLInputElement>('#search-input');
  const box = document.getElementById('search-results');
  if (!input || !box) return;

  let fusePromise: Promise<import('fuse.js').default<Product>> | null = null;
  const getFuse = () => {
    if (!fusePromise) {
      fusePromise = import('fuse.js').then(({ default: Fuse }) =>
        new Fuse(deps.products, { keys: ['name', 'tags'], threshold: 0.4, ignoreLocation: true }),
      );
    }
    return fusePromise;
  };

  input.addEventListener('focus', () => void getFuse(), { once: true });

  const close = () => { box.hidden = true; box.replaceChildren(); };

  input.addEventListener('input', async () => {
    const q = input.value.trim();
    if (!q) return close();
    const fuse = await getFuse();
    if (input.value.trim() !== q) return;
    const hits = fuse.search(q).map(r => r.item).slice(0, 8);
    renderSearchResults(box, hits, deps.toCard);
  });

  box.addEventListener('click', (e) => {
    const item = closestTarget<HTMLElement>(e, '.search-results__item');
    if (!item || item.dataset.stock === 'out') return;
    if (closestTarget(e, '.search-results__actions')) return;
    
    const pid = item.dataset.productId;
    if (pid) {
      close();
      document.querySelector(`[data-product-id="${pid}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.composedPath().includes(box) && e.target !== input) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}