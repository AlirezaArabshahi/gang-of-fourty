import type { Shop, Link } from '../types';
import { getJSON } from './get-json';
import { isRecord } from './is-record';

function isLink(v: unknown): v is Link {
  return isRecord(v) && typeof v.label === 'string' && typeof v.href === 'string';
}

function isShop(v: unknown): v is Shop {
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

export async function loadShop(): Promise<Shop> {
  const data = await getJSON('shop.json');
  if (!isShop(data)) throw new Error('Invalid shop.json');
  return data;
}