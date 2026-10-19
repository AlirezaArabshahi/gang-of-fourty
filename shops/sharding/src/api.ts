import type { Product, Offer, StockData, Shop, Category, Home } from './types';

const API_BASE = import.meta.env.VITE_API_URL;

export const API = {
  products: `${API_BASE}/products.json`,
  stock: `${API_BASE}/stock.json`,
  offers: `${API_BASE}/offers.json`,
  shop: `${API_BASE}/shop.json`,
  categories: `${API_BASE}/categories.json`,
  home: `${API_BASE}/home.json`,
};

const TIMEOUT_MS = 8000;

export async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}