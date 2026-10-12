(function () {
  'use strict';

  /* ─── Mobile menu drawer ─── */

  const menuBtn = document.querySelector('[data-menu-open]');
  const menuClose = document.querySelector('[data-menu-close]');
  const menu = document.getElementById('mobile-menu');
  const menuOverlay = document.querySelector('.mobile-menu__overlay');
  const menuLinks = menu ? menu.querySelectorAll('a') : [];

  if (menuBtn && menu && menuOverlay) {
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      menuOverlay.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';

      if (open && menuClose) {
        menuClose.focus();
      } else if (!open) {
        menuBtn.focus();
      }
    };

    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    if (menuClose) {
      menuClose.addEventListener('click', () => setOpen(false));
    }

    menuOverlay.addEventListener('click', () => setOpen(false));

    menuLinks.forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false);
      }
    });

    // Auto-close if user resizes to desktop while drawer open
    const mq = window.matchMedia('(min-width: 768px)');
    mq.addEventListener('change', (e) => {
      if (e.matches && menu.classList.contains('is-open')) {
        setOpen(false);
      }
    });
  }

  /* ─── Department mega menu ─── */

  const deptBtn = document.querySelector('.dept-btn[aria-expanded]');
  const dept = deptBtn ? deptBtn.closest('.dept') : null;

  if (deptBtn && dept) {
    const setDeptOpen = (open) => {
      dept.classList.toggle('is-open', open);
      deptBtn.setAttribute('aria-expanded', String(open));
    };

    deptBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = deptBtn.getAttribute('aria-expanded') === 'true';
      setDeptOpen(!isOpen);
    });

    // Close when focus leaves the entire dept
    dept.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!dept.contains(document.activeElement)) {
          setDeptOpen(false);
        }
      }, 0);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!dept.contains(e.target)) {
        setDeptOpen(false);
      }
    });

    // Close on Escape and return focus to button
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dept.classList.contains('is-open')) {
        setDeptOpen(false);
        deptBtn.focus();
      }
    });
  }
})();