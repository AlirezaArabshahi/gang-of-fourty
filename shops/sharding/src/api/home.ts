import type { Home, Shelf, Link } from '../types';
import { getJSON } from './get-json';
import { isRecord } from './is-record';

function isLink(v: unknown): v is Link {
  return isRecord(v) && typeof v.label === 'string' && typeof v.href === 'string';
}

function isShelf(v: unknown): v is Shelf {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    (v.source === undefined || v.source === 'offers') &&
    (v.categoryId === undefined || typeof v.categoryId === 'number')
  );
}

function isHome(v: unknown): v is Home {
  if (!isRecord(v)) return false;
  
  if (v.hero !== undefined) {
    if (!isRecord(v.hero)) return false;
    if (v.hero.title !== undefined && typeof v.hero.title !== 'string') return false;
    if (v.hero.text !== undefined && typeof v.hero.text !== 'string') return false;
    if (v.hero.cta !== undefined && !isLink(v.hero.cta)) return false;
  }
  
  if (v.carousels !== undefined) {
    if (!Array.isArray(v.carousels)) return false;
    if (!v.carousels.every(isShelf)) return false;
  }
  
  return true;
}

export async function loadHome(): Promise<Home> {
  const data = await getJSON('home.json');
  if (!isHome(data)) throw new Error('Invalid home.json');
  return data;
}