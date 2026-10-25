import type { Link } from './types';

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { dataset?: Record<string, string> } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { dataset, ...rest } = props;
  Object.assign(el, rest);
  if (dataset) for (const [k, v] of Object.entries(dataset)) el.dataset[k] = v;
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

export function closestTarget<T extends Element>(e: Event, selector: string): T | null {
  return e.target instanceof Element ? e.target.closest<T>(selector) : null;
}

export function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = Array.from(el.classList)
    .filter((c) => !c.startsWith('skeleton'))
    .join(' ');
  el.removeAttribute('data-skeleton');
  el.removeAttribute('aria-hidden');
}

export function renderLinks(el: HTMLElement, links: Link[], activeIndex = -1): void {
  const wrap = el instanceof HTMLUListElement;
  el.replaceChildren(
    ...links.map((link, i) => {
      const a = h('a', { href: link.href, textContent: link.label });
      if (i === activeIndex) a.setAttribute('aria-current', 'page');
      if (!wrap) return a;
      const li = h('li', {}, a);
      li.style.setProperty('--i', String(i));
      return li;
    }),
  );
}

function makeEmoji(emoji: string, className: string): HTMLSpanElement {
  const span = h('span', { className, textContent: emoji || '🛒' });
  span.setAttribute('aria-hidden', 'true');
  return span;
}

export function renderImageOrEmoji(
  wrap: HTMLElement,
  src: string | undefined,
  alt: string,
  emoji: string,
  opts: {
    plateClass?: string;
    emojiClass?: string;
    width?: number;
    height?: number;
  } = {},
): void {
  const emojiClassName = opts.emojiClass ?? 'product__emoji';
  wrap.replaceChildren();
  if (src) {
    const img = h('img', {
      src,
      alt,
      loading: 'lazy',
      decoding: 'async',
      ...(opts.width != null ? { width: opts.width } : {}),
      ...(opts.height != null ? { height: opts.height } : {}),
    });
    img.onerror = () => {
      img.remove();
      if (opts.plateClass) wrap.classList.add(opts.plateClass);
      wrap.appendChild(makeEmoji(emoji, emojiClassName));
    };
    wrap.appendChild(img);
    return;
  }
  if (opts.plateClass) wrap.classList.add(opts.plateClass);
  wrap.appendChild(makeEmoji(emoji, emojiClassName));
}