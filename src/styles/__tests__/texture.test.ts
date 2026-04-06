// @vitest-environment node
// src/styles/__tests__/texture.test.ts
// Enforces static asset constraints from Story 1.1 — Risograph Warmth Layer
// Uses node environment so import.meta.url resolves as file:// (not jsdom http://)
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Resolve relative to this file, not process.cwd(), so the test is
// invariant to the working directory from which Vitest is invoked.
const grainPath = fileURLToPath(new URL("../../../public/textures/grain.webp", import.meta.url));

describe("texture assets", () => {
  it("grain.webp exists at expected path", () => {
    expect(() => statSync(grainPath)).not.toThrow();
  });

  it("grain.webp is at most 4096 bytes (AC #6: ≤ 4KB)", () => {
    const { size } = statSync(grainPath);
    expect(size).toBeLessThanOrEqual(4 * 1024);
  });
});
