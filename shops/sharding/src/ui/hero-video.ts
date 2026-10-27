export function startHeroVideo(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(prefers-reduced-data: reduce)').matches) return;
  if (!matchMedia('(min-width: 768px)').matches) return;
  const video = document.querySelector<HTMLVideoElement>('.hero-video__media');
  if (!video) return;
  video.src = '/assets/video/hero.mp4';
  void video.play().catch(() => {});
}