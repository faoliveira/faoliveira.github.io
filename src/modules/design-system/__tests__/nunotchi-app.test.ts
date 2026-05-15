// @vitest-environment node
import { describe, expect, it } from "vitest";
import pkg from "../../../../package.json";
import licensesSource from "../../../../public/sprites/LICENSES.md?raw";
import widgetSource from "../../../islands/CurrentlyWidget.svelte?raw";
import nunotchiCardSource from "../../../islands/lib/NunotchiCard.svelte?raw";
import gameSource from "../../../islands/lib/NunotchiGame.svelte?raw";
import atlasSource from "../../../islands/lib/nuno-atlas.ts?raw";
import stateSource from "../../../islands/lib/nunotchi-state.ts?raw";

const COMBINED_GAMES = widgetSource + gameSource + nunotchiCardSource;

const PHASER_RE = /from\s+["'](phaser|pixi\.js|three)["']/;

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = haystack.indexOf(needle);
  while (pos !== -1) {
    count += 1;
    pos = haystack.indexOf(needle, pos + needle.length);
  }
  return count;
}

describe("Nunotchi.app contract (Story 1.21)", () => {
  it("AC1 — Kontra v10, named imports, no other game framework", () => {
    expect(pkg.dependencies.kontra).toMatch(/^\^10\./);
    expect(gameSource).toContain('import("kontra")');
    expect(gameSource).toContain("{ init, loadImage, SpriteSheet, Sprite, GameLoop }");
    expect(PHASER_RE.exec(COMBINED_GAMES)).toBeNull();
  });

  it("AC2 — Single Kenney atlas, single NUNO tile, clean LICENSES", () => {
    expect(gameSource).toContain("ATLAS.image");
    expect(atlasSource).toContain('image: "/sprites/kenney-1bit.png"');
    expect(atlasSource).toContain("NUNO = 367");
    expect(atlasSource).not.toContain("HORSE");
    expect(atlasSource).not.toContain("SHEEP");
    expect(atlasSource).not.toContain("COW");
    expect(atlasSource).not.toContain("CAT");
    expect(licensesSource).toContain("Kenney 1-Bit Pack");
    expect(licensesSource).toContain("CC0");
    expect(licensesSource).not.toContain("Tamagotchi");
    expect(licensesSource).not.toContain("eggs.png");
    expect(licensesSource).not.toContain("food.png");
  });

  it("AC3 — Four action buttons + correct stat math", () => {
    expect(nunotchiCardSource).toContain("A · feed");
    expect(nunotchiCardSource).toContain("B · play");
    expect(nunotchiCardSource).toContain("C · walk");
    expect(nunotchiCardSource).toContain('aria-label="Nap"');
    expect(widgetSource).toContain("pet.hunger = Math.max(0, pet.hunger - 1)");
    expect(widgetSource).toContain("pet.energy = Math.max(0, pet.energy - 12)");
    expect(widgetSource).toContain("pet.walks += 1");
    expect(widgetSource).toContain("pet.energy = Math.min(100, pet.energy + 25)");
  });

  it("AC4 — Pet stats and decay constants", () => {
    expect(widgetSource).toContain("let pet = $state<NunotchiState>");
    expect(stateSource).toContain("STEP_HUNGER_MS = 8 * 60 * 1000");
    expect(stateSource).toContain("STEP_ENERGY_MS = 4 * 60 * 1000");
    expect(stateSource).toContain("STEP_HP_MS = 20 * 60 * 1000");
  });

  it("AC5 — localStorage persistence key + schema mismatch warning + save points", () => {
    expect(stateSource).toContain('STORAGE_KEY = "koubou.nunotchi.state.v1"');
    expect(stateSource).toContain('console.warn("nunotchi: state reset (schema mismatch)")');
    expect(
      countOccurrences(widgetSource, "saveState(getStorage(), pet, Date.now())"),
    ).toBeGreaterThanOrEqual(4);
  });

  it("AC6 — Canvas pauses via loopHandle + bindable + guarded start", () => {
    expect(widgetSource).toContain("loopHandle?.pause()");
    expect(widgetSource).toContain("loopHandle?.resume()");
    expect(gameSource).toContain("loopHandle = $bindable(null)");
    expect(gameSource).toContain("running = false");
    expect(/loop\.start\(\);[^}]*running = true/.test(gameSource)).toBe(true);
  });

  it("AC7 — prefers-reduced-motion handling", () => {
    expect(widgetSource).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
    expect(widgetSource).toContain("queueMicrotask(finish)");
    expect(gameSource).toContain("frameRate: reduced ? 0.001");
  });

  it("AC8 — SSR loading fallback, no egg-hatch artifacts", () => {
    expect(nunotchiCardSource).toContain("loading…");
    expect(nunotchiCardSource).toContain('<NunotchiGame pose={busy ?? "idle"}');
    expect(COMBINED_GAMES).not.toContain("booting");
    expect(COMBINED_GAMES).not.toContain("hatchFrame");
    expect(COMBINED_GAMES).not.toContain("hatchTimer");
    expect(COMBINED_GAMES).not.toContain('"/sprites/eggs.png"');
  });

  it("AC9 — No alert window", () => {
    expect(widgetSource).not.toContain('"alert"');
    expect(widgetSource).not.toContain("wins.alert");
    expect(widgetSource).not.toContain("Walk reminder");
    expect(widgetSource).not.toContain('class="paper-win alert"');
  });
});
