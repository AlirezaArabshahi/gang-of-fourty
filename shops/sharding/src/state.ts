import type { Product, Offer, Stock, Shop, Category, Home } from './types';

export interface AppState {
  shop: Shop | null;
  home: Home | null;
  categories: Category[];
  products: Product[];
  stock: Stock | null;
  offerMap: Map<number, Offer>;
}

export const state: AppState = {
  shop: null,
  home: null,
  categories: [],
  products: [],
  stock: null,
  offerMap: new Map(),
};

export function inStock(id: number): boolean {
  return (state.stock?.items[id] ?? 0) > 0;
}