(function () {
  'use strict';

  function getTrack(btn) {
    const hero = btn.closest('.hero-carousel');
    if (hero) return hero.querySelector('.hero-carousel__track');

    const cats = btn.closest('.categories');
    if (cats) return cats.querySelector('.categories__list');

    const prod = btn.closest('.products');
    if (prod) return prod.querySelector('.products__grid');

    return null;
  }

  function scrollTrack(track, toEnd) {
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;

    const isRTL = getComputedStyle(track).direction === 'rtl';
    const sign = isRTL ? -1 : 1;
    const target = toEnd ? sign * maxScroll : 0;

    track.scrollTo({ left: target, behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.carousel-nav__btn');
    if (!btn) return;
    e.preventDefault();

    const track = getTrack(btn);
    if (!track) return;

    const toEnd = btn.classList.contains('carousel-nav__btn--end');
    scrollTrack(track, toEnd);
  });
})();