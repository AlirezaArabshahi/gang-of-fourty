import { closestTarget } from './dom';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function setupMenu(): void {
  setupMobileMenu();
  setupMegaMenu();
}

function setupMobileMenu(): void {
  const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const menu = document.getElementById('mobile-menu');
  if (!menuBtn || !menu) return;

  const setOpen = (open: boolean): void => {
    menu.dataset.state = open ? 'open' : 'closed';
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      const first = menu.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    } else {
      menuBtn.focus();
    }
  };

  menu.dataset.state = 'closed';

  menuBtn.addEventListener('click', () => {
    setOpen(menu.dataset.state !== 'open');
  });

  menu.addEventListener('click', (e) => {
    if (closestTarget(e, 'a, [data-menu-close]')) setOpen(false);
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (menu.dataset.state !== 'open') return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (e.key === 'Tab') {
      const focusables = Array.from(
        menu.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);

      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', (e: MediaQueryListEvent) => {
    if (e.matches && menu.dataset.state === 'open') setOpen(false);
  });
}

function setupMegaMenu(): void {
  const trigger = document.querySelector<HTMLButtonElement>('.mega-menu__trigger');
  const menu = trigger?.closest<HTMLElement>('.mega-menu');
  if (!trigger || !menu) return;

  const setExpanded = (open: boolean): void => {
    trigger.setAttribute('aria-expanded', String(open));
  };

  menu.addEventListener('pointerenter', () => setExpanded(true));
  menu.addEventListener('pointerleave', () => {
    if (menu.dataset.state !== 'open') {
      setExpanded(menu.matches(':focus-within'));
    }
  });

  menu.addEventListener('focusin', () => setExpanded(true));
  menu.addEventListener('focusout', (e) => {
    if (!(e.relatedTarget instanceof Node) || !menu.contains(e.relatedTarget)) {
      if (menu.dataset.state !== 'open') {
        setExpanded(menu.matches(':hover'));
      }
    }
  });

  trigger.addEventListener('click', () => {
    if (menu.matches(':hover') && menu.dataset.state !== 'open') {
      menu.dataset.state = 'open';
      setExpanded(true);
      return;
    }

    if (menu.dataset.state === 'open') {
      delete menu.dataset.state;
      setExpanded(menu.matches(':hover, :focus-within'));
    } else {
      menu.dataset.state = 'open';
      setExpanded(true);
    }
  });

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Node)) return;
    if (!menu.contains(e.target)) {
      delete menu.dataset.state;
      setExpanded(false);
    }
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && menu.dataset.state === 'open') {
      delete menu.dataset.state;
      setExpanded(false);
      trigger.focus();
    }
  });

  const list = menu.querySelector<HTMLElement>('.mega-menu__categories');
  if (!list) return;

  const activate = (e: Event): void => {
    const item = closestTarget<HTMLElement>(e, '.mega-menu__item');
    if (!item) return;
    list.querySelectorAll<HTMLElement>('.mega-menu__item[data-state="active"]')
      .forEach((el) => delete el.dataset.state);
    item.dataset.state = 'active';
  };

  list.addEventListener('mouseover', activate);
  list.addEventListener('focusin', activate);
}