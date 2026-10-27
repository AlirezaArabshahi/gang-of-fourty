export function getCatParam(): string {
  return new URLSearchParams(location.search).get('cat') || '';
}

export function setCatParam(slug: string): void {
  const url = new URL(location.href);
  if (slug) {
    url.searchParams.set('cat', slug);
    url.hash = slug;
  } else {
    url.searchParams.delete('cat');
    url.hash = '';
  }
  history.pushState({ cat: slug }, '', url);
}

export function clearCatParam(): void {
  const url = new URL(location.href);
  url.searchParams.delete('cat');
  url.hash = ''; 
  history.replaceState({}, '', url);
}