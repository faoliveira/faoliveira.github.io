/**
 * Nuno sprite atlas — Kenney 1-bit pack as placeholder source.
 *
 * Sheet:    /sprites/kenney-1bit.png  (768x352, transparent bg, white shapes)
 * Grid:     48 cols × 22 rows of 16x16 tiles (tile index = row*48 + col)
 * License:  CC0 (see public/sprites/LICENSES.md)
 *
 * Frame indices were picked by visual inspection. Swap the source PNG by
 * editing `image` + the indices below. Renderer + game code never hard-code
 * frames — they always read this atlas.
 */

export type Pose =
  | "idle"
  | "walk"
  | "sit"
  | "lay"
  | "sleep"
  | "play"
  | "eat"
  | "happy"
  | "alert"
  | "paw";

export interface AtlasPose {
  /** Frame indices on the sheet (row*cols + col). */
  frames: ReadonlyArray<number>;
  /** Animation playback rate. Static poses use 1. */
  frameRate: number;
}

export interface Atlas {
  image: string;
  cols: number;
  rows: number;
  tile: number;
  poses: Readonly<Record<Pose, AtlasPose>>;
}

// Single-tile placeholder: Kenney 1-bit's cat tile (367, row 7 col 31) stands in
// for Nuno's small-quadruped silhouette. Variety comes from position animation
// (NunotchiGame translates sprite.x for walk, sprite.y for play) — not from
// frame alternation.

const NUNO = 367; // Kenney 1-bit "cat" silhouette — closest small-quadruped stand-in for Jack Russell loaf. Replace this constant if a custom Nuno tile lands in a future story.
export const ATLAS: Atlas = {
  image: "/sprites/kenney-1bit.png",
  cols: 48,
  rows: 22,
  tile: 16,
  poses: {
    idle: { frames: [NUNO], frameRate: 1 },
    walk: { frames: [NUNO], frameRate: 1 },
    sit: { frames: [NUNO], frameRate: 1 },
    lay: { frames: [NUNO], frameRate: 1 },
    sleep: { frames: [NUNO], frameRate: 1 },
    play: { frames: [NUNO], frameRate: 1 },
    eat: { frames: [NUNO], frameRate: 1 },
    happy: { frames: [NUNO], frameRate: 1 },
    alert: { frames: [NUNO], frameRate: 1 },
    paw: { frames: [NUNO], frameRate: 1 },
  },
};

export const HEART_FILLED = 522;
export const HEART_EMPTY = 520;

/** Compute tile (col, row) → background-position offset in CSS pixels. */
export function frameOffset(frame: number, atlas: Atlas = ATLAS): { x: number; y: number } {
  const col = frame % atlas.cols;
  const row = Math.floor(frame / atlas.cols);
  return { x: -col * atlas.tile, y: -row * atlas.tile };
}
