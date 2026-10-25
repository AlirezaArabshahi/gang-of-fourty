import type { Product, Offer, Stock, Shop, Category, Home, Link } from './types';

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isLink(v: unknown): v is Link {
  if (!isRecord(v)) return false;
  return typeof v.label === 'string' && typeof v.href === 'string';
}

function isProduct(v: unknown): v is Product {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'number' &&
    typeof v.categoryId === 'number' &&
    typeof v.name === 'string' &&
    typeof v.emoji === 'string' &&
    typeof v.unit === 'string' &&
    typeof v.price === 'number' &&
    Array.isArray(v.tags) &&
    v.tags.every((t) => typeof t === 'string')
  );
}

function isCategory(v: unknown): v is Category {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'number' &&
    typeof v.slug === 'string' &&
    typeof v.name === 'string' &&
    typeof v.emoji === 'string'
  );
}

function isOffer(v: unknown): v is Offer {
  if (!isRecord(v)) return false;
  return (
    typeof v.productId === 'number' &&
    typeof v.percent === 'number' &&
    v.percent >= 0 &&
    v.percent <= 100 &&
    typeof v.label === 'string'
  );
}

export function isStock(v: unknown): v is Stock {
  if (!isRecord(v) || !isRecord(v.items)) return false;
  return Object.values(v.items).every((n) => typeof n === 'number' && n >= 0);
}

export function isShop(v: unknown): v is Shop {
  if (!isRecord(v)) return false;
  return (
    typeof v.name === 'string' &&
    typeof v.slogan === 'string' &&
    typeof v.notice === 'string' &&
    typeof v.about === 'string' &&
    typeof v.address === 'string' &&
    typeof v.phone === 'string' &&
    Array.isArray(v.schedule) &&
    v.schedule.every(
      (s) => isRecord(s) && typeof s.days === 'string' && typeof s.time === 'string',
    ) &&
    Array.isArray(v.menu) &&
    v.menu.every(isLink) &&
    Array.isArray(v.help) &&
    v.help.every(isLink) &&
    typeof v.copyright === 'string'
  );
}

export function isHome(v: unknown): v is Home {
  if (!isRecord(v)) return false;
  if (v.hero !== undefined && !isRecord(v.hero)) return false;
  if (v.carousels !== undefined && !Array.isArray(v.carousels)) return false;
  return true;
}

export function isProductArray(v: unknown): v is Product[] {
  return Array.isArray(v) && v.every(isProduct);
}

export function isCategoryArray(v: unknown): v is Category[] {
  return Array.isArray(v) && v.every(isCategory);
}

export function isOfferArray(v: unknown): v is Offer[] {
  return Array.isArray(v) && v.every(isOffer);
}