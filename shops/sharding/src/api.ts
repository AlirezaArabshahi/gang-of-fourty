import {
  isProductArray, isOfferArray, isStock, isShop, isCategoryArray, isHome,
} from './validators';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const TIMEOUT = 8000;

async function load<T>(file: string, check: (v: unknown) => v is T): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${API_BASE}/${file}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!check(data)) throw new Error(`Invalid ${file}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export const fetchProducts = () => load('products.json', isProductArray);
export const fetchOffers = () => load('offers.json', isOfferArray);
export const fetchStock = () => load('stock.json', isStock);
export const fetchShop = () => load('shop.json', isShop);
export const fetchCategories = () => load('categories.json', isCategoryArray);
export const fetchHome = () => load('home.json', isHome);