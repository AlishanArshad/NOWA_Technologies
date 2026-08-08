(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || !window.Lenis) return;

  // Slightly lighter touch on phones/tablets; desktop gets the premium wheel easing.
  const lenis = new window.Lenis({
    duration: coarse ? 0.9 : 1.08,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: coarse ? 0.9 : 0.82,
    touchMultiplier: 1,
    syncTouch: false,
    infinite: false
  });

  window.nowaLenis = lenis;
  let rafId = 0;
  const raf = (time) => {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      lenis.stop();
    } else {
      lenis.start();
      if (!rafId) rafId = requestAnimationFrame(raf);
    }
  });

  // Keep scrolling state sane when fullscreen UI is opened/closed.
  const syncLock = () => {
    const locked = document.body.classList.contains('menu-open') || document.body.classList.contains('modal-open');
    locked ? lenis.stop() : lenis.start();
  };
  new MutationObserver(syncLock).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
