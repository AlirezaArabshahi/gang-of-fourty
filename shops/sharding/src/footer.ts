import type { Shop, Category } from './types';
import { h, setText, renderLinks } from './dom';

function renderContact(shop: Shop): void {
  const ul = document.querySelector<HTMLUListElement>('#footer-contact-list');
  if (!ul) return;
  ul.replaceChildren();

  if (shop.phone) {
    const a = h('a', { href: `tel:${shop.phone}`, textContent: shop.phone, dir: 'ltr' });
    ul.appendChild(h('li', {}, a));
  }
  if (shop.address) {
    ul.appendChild(h('li', { textContent: shop.address }));
  }
}

function renderSchedule(schedule: { days: string; time: string }[]): void {
  const el = document.getElementById('footer-schedule');
  if (!el) return;
  const frag = document.createDocumentFragment();
  schedule.forEach((item, i) => {
    if (i > 0) frag.appendChild(document.createElement('br'));
    frag.appendChild(document.createTextNode(item.days));
    frag.appendChild(document.createElement('br'));
    frag.appendChild(document.createTextNode(item.time));
  });
  el.replaceChildren(frag);
}

function renderFooterCategories(categories: Category[]): void {
  const cats = document.querySelector<HTMLUListElement>('#footer-categories-list');
  if (!cats) return;
  cats.replaceChildren();
  categories.forEach((c, i) => {
    const a = h('a', {
      href: `?cat=${encodeURIComponent(c.slug)}#${c.slug}`,
      textContent: c.name,
      dataset: { catSlug: c.slug },
    });
    const li = h('li');
    li.style.setProperty('--i', String(i));
    li.appendChild(a);
    cats.appendChild(li);
  });
}

export function renderFooter(shop: Shop, categories: Category[]): void {
  const fIdentity = document.querySelector<HTMLAnchorElement>('#footer-identity');
  fIdentity?.setAttribute('aria-label', shop.name);
  setText('footer-brand-name', shop.name);
  setText('footer-brand-tagline', shop.slogan);
  setText('footer-about', shop.about);

  const help = document.querySelector<HTMLUListElement>('#footer-help-list');
  if (help) renderLinks(help, shop.help);

  renderContact(shop);
  renderSchedule(shop.schedule);
  setText('footer-copyright', shop.copyright);
  renderFooterCategories(categories);
}