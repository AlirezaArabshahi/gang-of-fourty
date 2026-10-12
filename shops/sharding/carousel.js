(function () {
  'use strict';

  /* Find the scrollable track associated with a nav button */
  function getTrack(btn) {
    const hero = btn.closest('.hero-carousel');
    if (hero) return hero.querySelector('.hero-carousel__track');

    const cats = btn.closest('.categories');
    if (cats) return cats.querySelector('.categories__list');

    const prod = btn.closest('.products');
    if (prod) return prod.querySelector('.products__grid');

    return null;
  }

  /* Scroll the track to its logical start or end.
     Handles RTL correctly: in modern browsers RTL scrollLeft is 0 at the
     right edge and goes negative leftward, so "end" uses a negative value. */
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

    // Prevent the browser from hijacking the URL hash and scrolling the page
    e.preventDefault();

    const track = getTrack(btn);
    if (!track) return;

    const toEnd = btn.classList.contains('carousel-nav__btn--end');
    scrollTrack(track, toEnd);
  });
})();