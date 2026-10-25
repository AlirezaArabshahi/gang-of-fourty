import { state } from './state';
import { closestTarget } from './dom';

function showCategory(slug: string): void {
  document.querySelectorAll<HTMLElement>('#product-shelves > section').forEach((s) => {
    s.hidden = slug !== '' && s.id !== slug;
  });
  document.querySelectorAll<HTMLElement>('.category[data-cat-slug]').forEach((el) => {
    if (el.dataset.catSlug === slug) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}

function getCat(): string {
  return new URLSearchParams(location.search).get('cat') || '';
}

export function setupCatFilter(): void {
  document.addEventListener('click', (e) => {
    const link = closestTarget<HTMLAnchorElement>(e, 'a[data-cat-slug]');
    if (!link) return;
    const slug = link.dataset.catSlug;
    if (slug === undefined) return;

    e.preventDefault();
    const url = new URL(location.href);
    if (slug) {
      url.searchParams.set('cat', slug);
      url.hash = slug;
    } else {
      url.searchParams.delete('cat');
      url.hash = '';
    }
    history.pushState({ cat: slug }, '', url);
    showCategory(slug);
    if (slug) {
      document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  window.addEventListener('popstate', () => {
    showCategory(getCat());
  });

  window.addEventListener('hashchange', () => {
    const section = document.getElementById(location.hash.slice(1));
    if (!(section instanceof HTMLElement) || !section.hidden) return;

    showCategory('');
    const url = new URL(location.href);
    url.searchParams.delete('cat');
    history.replaceState({}, '', url);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function applyInitialCategory(): void {
  const slug = getCat();
  if (!slug || !state.categories.some((c) => c.slug === slug)) {
    showCategory('');
    return;
  }
  showCategory(slug);
}