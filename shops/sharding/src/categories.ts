import type { Category } from './types';
import { h, renderImageOrEmoji } from './dom';
import { createIcon } from './icons';

function renderAllCategory(ul: HTMLUListElement): void {
  const li = h('li');
  li.style.setProperty('--i', '0');

  const a = h('a', {
    className: 'category',
    href: '#',
    dataset: { catSlug: '' },
  });
  a.dataset.category = 'all';
  a.id = 'cat-start';

  const imgWrap = h('span', { className: 'category__img category__img--all' });
  imgWrap.setAttribute('aria-hidden', 'true');
  imgWrap.appendChild(createIcon('grid', 'category__all-icon'));

  a.append(
    imgWrap,
    h('span', { className: 'category__name', textContent: 'همه' }),
  );

  li.appendChild(a);
  ul.appendChild(li);
}

export function renderCategories(categories: Category[]): void {
  const ul = document.querySelector<HTMLUListElement>('#categories-list');
  if (!ul) return;

  ul.replaceChildren();
  renderAllCategory(ul);

  categories.forEach((cat, i) => {
    const li = h('li');
    li.style.setProperty('--i', String(i + 1));

    const a = h('a', {
      className: 'category',
      href: `?cat=${encodeURIComponent(cat.slug)}#${cat.slug}`,
      dataset: { catSlug: cat.slug, categoryId: String(cat.id) },
    });
    if (i === categories.length - 1) a.id = 'cat-end';

    const img = h('span', { className: 'category__img' });
    if (cat.color) img.style.backgroundColor = cat.color;

    renderImageOrEmoji(img, cat.image, cat.name, cat.emoji, { width: 200, height: 200 });

    a.append(img, h('span', { className: 'category__name', textContent: cat.name }));
    li.appendChild(a);
    ul.appendChild(li);
  });
}