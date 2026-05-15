import { cubicOut, expoOut } from "svelte/easing";

interface PaperAnimOpts {
  rotate?: number;
  reduced?: boolean;
}

// Paper-stamp entrance: scale up from 0.94 + fade. Rotation folds into the
// keyframes so it doesn't collide with the inline style:transform on rotated
// windows (reading, alert).
export function paperOpen(_node: Element, { rotate = 0, reduced = false }: PaperAnimOpts) {
  if (reduced) return { duration: 0 };
  return {
    duration: 220,
    easing: expoOut,
    css: (t: number) =>
      `transform: rotate(${rotate}deg) scale(${0.94 + 0.06 * t}); opacity: ${t}; transform-origin: 50% 35%;`,
  };
}

// Paper-lift exit: scale down + fade. ~73% of entrance duration.
export function paperClose(_node: Element, { rotate = 0, reduced = false }: PaperAnimOpts) {
  if (reduced) return { duration: 0 };
  return {
    duration: 160,
    easing: cubicOut,
    css: (t: number) =>
      `transform: rotate(${rotate}deg) scale(${0.92 + 0.08 * t}); opacity: ${t}; transform-origin: 50% 35%;`,
  };
}
