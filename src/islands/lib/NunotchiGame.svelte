<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { ATLAS, type Pose } from "./nuno-atlas";

export interface LoopHandle {
  pause: () => void;
  resume: () => void;
}

interface Props {
  pose?: Pose;
  /** CSS pixel width of the canvas. */
  width?: number;
  /** CSS pixel height of the canvas. */
  height?: number;
  /** Sprite ink color. Default reads --ink from the closest ancestor. */
  ink?: string;
  /** Imperative pause/resume API exposed to the parent via bind:loopHandle. */
  loopHandle?: LoopHandle | null;
}

let {
  pose = "idle",
  width = 240,
  height = 100,
  ink,
  loopHandle = $bindable(null),
}: Props = $props();

let canvas: HTMLCanvasElement;
let setPose: ((p: Pose) => void) | null = null;
let teardown: (() => void) | null = null;

const reduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function tintSheet(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function resolveInk(el: HTMLElement, override?: string): string {
  if (override) return override;
  const v = getComputedStyle(el).getPropertyValue("--ink").trim();
  return v || getComputedStyle(el).color || "#1a1a1a";
}

onMount(() => {
  let alive = true;

  (async () => {
    const { init, loadImage, SpriteSheet, Sprite, GameLoop } = await import("kontra");
    if (!alive) return;

    init(canvas);

    const img = await loadImage(ATLAS.image);
    if (!alive) return;

    const tinted = tintSheet(img, resolveInk(canvas, ink));

    // Translate our atlas into Kontra's animations spec.
    const animations: Record<string, { frames: number[]; frameRate: number; loop?: boolean }> = {};
    for (const [name, def] of Object.entries(ATLAS.poses)) {
      animations[name] = {
        frames: [...def.frames],
        frameRate: reduced ? 0.001 : def.frameRate,
      };
    }

    const sheet = SpriteSheet({
      image: tinted,
      frameWidth: ATLAS.tile,
      frameHeight: ATLAS.tile,
      animations,
    });

    const stageScale = 2;
    const ground = height - 16;
    const sprite = Sprite({
      x: width / 2,
      y: ground,
      anchor: { x: 0.5, y: 1 },
      scaleX: stageScale,
      scaleY: stageScale,
      animations: sheet.animations,
    });
    sprite.playAnimation(pose);

    let currentPose: Pose = pose;
    setPose = (p: Pose) => {
      if (p === currentPose) return;
      currentPose = p;
      sprite.playAnimation(p);
    };

    // Subtle motion: walking drifts horizontally; play makes Nuno hop.
    const baseY = ground;
    let walkPhase = 0;
    let hopPhase = 0;

    const loop = GameLoop({
      update: (dt: number) => {
        sprite.update(dt);
        if (currentPose === "walk") {
          walkPhase += dt;
          sprite.x = width / 2 + Math.sin(walkPhase * 4) * (width / 2 - ATLAS.tile);
        } else {
          sprite.x += (width / 2 - sprite.x) * 0.15;
        }
        if (currentPose === "play") {
          hopPhase += dt;
          sprite.y = baseY - Math.abs(Math.sin(hopPhase * 8)) * 12;
        } else {
          sprite.y = baseY;
        }
      },
      render: () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // dotted ground line
        ctx.fillStyle = resolveInk(canvas, ink);
        ctx.globalAlpha = 0.55;
        for (let x = 4; x < width - 4; x += 4) {
          ctx.fillRect(x, ground + 1, 2, 1);
        }
        ctx.globalAlpha = 1;
        sprite.render();
      },
    });

    // The parent owns start/stop via loopHandle to avoid a double-start race
    // between this onMount and the parent's $effect that fires once the
    // bound handle resolves.
    let running = false;
    loopHandle = {
      pause: () => {
        if (running) {
          loop.stop();
          running = false;
        }
      },
      resume: () => {
        if (alive && !running) {
          loop.start();
          running = true;
        }
      },
    };
    teardown = () => {
      if (running) loop.stop();
      running = false;
      loopHandle = null;
    };
  })().catch((err) => {
    // Loading the lib or image can fail in test envs without a network.
    // Silent-fail is acceptable for a placeholder mini-game.
    // biome-ignore lint/suspicious/noConsole: intentional silent-fail diagnostic
    if (typeof console !== "undefined") console.warn("Nunotchi game disabled:", err);
  });

  return () => {
    alive = false;
  };
});

onDestroy(() => {
  teardown?.();
});

$effect(() => {
  setPose?.(pose);
});
</script>

<canvas
  bind:this={canvas}
  width={width}
  height={height}
  class="nunotchi-canvas"
  style:width={`${width}px`}
  style:height={`${height}px`}
></canvas>

<style>
  .nunotchi-canvas {
    display: block;
    image-rendering: pixelated;
    background: transparent;
  }
</style>
