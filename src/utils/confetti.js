import confetti from 'canvas-confetti';

const DEFAULT_PALETTE = ['#7A8B6E', '#C9A97E', '#F2ECE1'];

/**
 * Verifica se o dispositivo do usuário solicita redução de movimento.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Dispara um confete editorial contido na paleta do evento, respeitando prefers-reduced-motion.
 */
export function triggerEditorialConfetti(colors = DEFAULT_PALETTE) {
  if (prefersReducedMotion()) return;

  try {
    confetti({
      particleCount: 48,
      spread: 64,
      origin: { y: 0.68 },
      colors,
      scalar: 0.95,
      ticks: 180,
      gravity: 0.95,
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Confetti indisponível:', err);
  }
}
