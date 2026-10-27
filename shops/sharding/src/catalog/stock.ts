import type { Stock } from '../types';

export function inStock(id: number, stock: Stock | null): boolean {
  return (stock?.items[id] ?? 0) > 0;
}

export function stockOf(id: number, stock: Stock | null): number {
  return stock?.items[id] ?? 0;
}