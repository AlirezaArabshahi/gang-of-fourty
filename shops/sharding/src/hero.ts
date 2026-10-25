import type { Home } from './types';
import { h, setText } from './dom';
import { BANNER_IMAGES } from './content';
import { createCarouselNav } from './shelves';

function renderBasketSlide(track: HTMLElement): void {
  const li = h('li', { className: 'hero-carousel__slide', id: 'banner-start' });
  li.dataset.variant = 'basket';
  li.dataset.state = 'active';

  const link = h('a', { className: 'hero-banner hero-banner--basket', href: '#fruits' });

  const wrap = h('div', { className: 'hero-carousel__basket-wrap' });
  wrap.setAttribute('aria-hidden', 'true');
  wrap.append(
    h('img', {
      className: 'hero-carousel__fruits',
      src: '/assets/images/promos/fruits.webp',
      alt: '', loading: 'eager',
    }),
    h('img', {
      className: 'hero-carousel__basket',
      src: '/assets/images/promos/basket.webp',
      alt: '', loading: 'eager',
    }),
  );

  const content = h('div', { className: 'hero-carousel__basket-content' });
  const title = h('h3', {
    className: 'hero-carousel__basket-title',
    textContent: 'پیشنهادهای ویژه هفته',
  });
  const arrow = h('span', { className: 'hero-carousel__basket-arrow', textContent: '←' });
  arrow.setAttribute('aria-hidden', 'true');
  title.appendChild(arrow);

  content.append(
    h('span', { className: 'hero-carousel__basket-eyebrow', textContent: '✦ تازه از مزرعه' }),
    title,
  );

  link.append(wrap, content);
  li.appendChild(link);
  track.appendChild(li);
}

function renderBannerNav(track: HTMLElement): void {
  const carousel = track.parentElement;
  if (!carousel || carousel.querySelector('.hero-carousel__nav')) return;

  const nav = createCarouselNav('#banner-start', '#banner-end', 'کاروسل پیشنهادها');
  nav.classList.remove('carousel-nav');
  nav.classList.add('hero-carousel__nav');
  nav.querySelectorAll<HTMLAnchorElement>('.carousel-nav__btn').forEach((btn) => {
    btn.classList.remove('carousel-nav__btn');
    btn.classList.add('hero-carousel__nav-btn');
  });
  carousel.appendChild(nav);
}

function renderBanners(): void {
  const track = document.getElementById('banner-track');
  if (!track) return;

  track.removeAttribute('aria-busy');
  track.replaceChildren();

  renderBasketSlide(track);

  BANNER_IMAGES.forEach((src, i) => {
    const li = h('li', { className: 'hero-carousel__slide' });
    li.style.setProperty('--i', String(i + 1));
    if (i === BANNER_IMAGES.length - 1) li.id = 'banner-end';

    const a = h('a', { className: 'hero-banner', href: '#offers' });
    a.appendChild(h('img', {
      src, alt: `بنر ${i + 1}`, width: 800, height: 500,
      decoding: 'async', loading: 'lazy',
    }));
    li.appendChild(a);
    track.appendChild(li);
  });

  renderBannerNav(track);
}

function renderHeroVideo(home: Home): void {
  const hero = home.hero ?? {};
  setText('hero-title', hero.title ?? '');
  setText('hero-desc', hero.text ?? '');

  const cta = document.querySelector<HTMLAnchorElement>('#hero-cta');
  if (cta) {
    cta.href = hero.cta?.href ?? '#fruits';
    cta.removeAttribute('aria-hidden');
    cta.removeAttribute('tabindex');
    setText('hero-cta-label', hero.cta?.label ?? '');
  }

  document.getElementById('hero-video')?.classList.remove('hero-video--skeleton');
}

export function renderHero(home: Home): void {
  renderHeroVideo(home);
  renderBanners();
}

export function startHeroVideo(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(prefers-reduced-data: reduce)').matches) return;
  if (!matchMedia('(min-width: 768px)').matches) return;

  const video = document.querySelector<HTMLVideoElement>('.hero-video__media');
  if (!video) return;
  video.src = '/assets/video/hero.mp4';
  void video.play().catch(() => { });
}