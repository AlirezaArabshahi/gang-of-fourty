(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  function getTrack(btn: HTMLElement): HTMLElement | null {
    if (!(btn instanceof Element)) return null;
    const hero = btn.closest<HTMLElement>('.hero-carousel');
    if (hero) return hero.querySelector<HTMLElement>('.hero-carousel__track');

    const cats = btn.closest<HTMLElement>('.categories');
    if (cats) return cats.querySelector<HTMLElement>('.categories__list');

    const prod = btn.closest<HTMLElement>('.products');
    if (prod) return prod.querySelector<HTMLElement>('.products__grid');

    return null;
  }

  function scrollTrack(track: HTMLElement, toEnd: boolean): void {
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;

    const isRTL = getComputedStyle(track).direction === 'rtl';
    const sign = isRTL ? -1 : 1;
    const target = toEnd ? sign * maxScroll : 0;

    track.scrollTo({
      left: target,
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    });
  }

  document.addEventListener('click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    const btn = e.target.closest<HTMLElement>('.carousel-nav__btn');
    if (!btn) return;

    const track = getTrack(btn);
    if (!track) return;

    const toEnd = btn.classList.contains('carousel-nav__btn--end');
    scrollTrack(track, toEnd);
  });

  function setupHeroActiveSlide(): void {
    const track = document.querySelector<HTMLElement>('.hero-carousel__track');
    if (!track || !('IntersectionObserver' in window)) return;

    const slides = track.querySelectorAll<HTMLElement>('.hero-carousel__slide');
    if (!slides.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            'is-active',
            entry.intersectionRatio > 0.6
          );
        });
      },
      { root: track, threshold: [0, 0.6, 1] }
    );

    slides.forEach((slide) => observer.observe(slide));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHeroActiveSlide, {
      once: true,
    });
  } else {
    setupHeroActiveSlide();
  }
})();