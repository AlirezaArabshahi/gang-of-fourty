import type { Product, Category, Offer, Stock, Shop, Home } from './types';
import {
  isProduct, isCategoryArray, isOfferArray, isStock, isShop, isHome,
} from './validators';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const TIMEOUT = 8000;

export async function getJSON(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${API_BASE}/${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadProducts(): Promise<Product[]> {
  const data = await getJSON('products.json');
  if (!Array.isArray(data)) throw new Error('Invalid products.json');
  const products = data.filter(isProduct);
  const dropped = data.length - products.length;
  if (dropped > 0) console.warn(`[api] ${dropped} invalid product(s) removed`);
  return products;
}

export async function loadCategories(): Promise<Category[]> {
  const data = await getJSON('categories.json');
  if (!isCategoryArray(data)) throw new Error('Invalid categories.json');
  return data;
}

export async function loadOffers(): Promise<Offer[]> {
  const data = await getJSON('offers.json');
  if (!isOfferArray(data)) throw new Error('Invalid offers.json');
  return data;
}

export async function loadStock(): Promise<Stock> {
  const data = await getJSON('stock.json');
  if (!isStock(data)) throw new Error('Invalid stock.json');
  return data;
}

export async function loadShop(): Promise<Shop> {
  const data = await getJSON('shop.json');
  if (!isShop(data)) throw new Error('Invalid shop.json');
  return data;
}

export async function loadHome(): Promise<Home> {
  const data = await getJSON('home.json');
  if (!isHome(data)) throw new Error('Invalid home.json');
  return data;
}