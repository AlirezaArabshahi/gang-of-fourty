import type { Offer } from './types';

export const priceFmt = new Intl.NumberFormat('fa-IR');

export const discountPct = new Intl.NumberFormat('fa-IR', {
  style: 'percent',
  maximumFractionDigits: 0,
});

export function hasDiscount(offer: Offer | undefined): offer is Offer {
  return offer != null && offer.percent > 0;
}

function applyDiscount(price: number, offer: Offer): number {
  return Math.round(price * (1 - offer.percent / 100));
}

export function getFinalPrice(price: number, offer: Offer | undefined): number {
  return hasDiscount(offer) ? applyDiscount(price, offer) : price;
}