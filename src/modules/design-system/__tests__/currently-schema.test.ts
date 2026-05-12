// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import configSource from "../../../content.config.ts?raw";
import schemaSource from "../../currently/schema.ts?raw";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

describe("Currently schema contract (Story 1.19)", () => {
  it("exports CurrentlySchema, CurrentlyData, CurrentlyEntry, MusicSource", () => {
    expect(schemaSource).toContain("export const CurrentlySchema");
    expect(schemaSource).toContain("export type CurrentlyData");
    expect(schemaSource).toContain("export type CurrentlyEntry");
    expect(schemaSource).toContain("export type MusicSource");
  });

  it("music source is a discriminated union of youtube | spotify | none", () => {
    expect(schemaSource).toContain('z.discriminatedUnion("kind"');
    expect(schemaSource).toContain('z.literal("youtube")');
    expect(schemaSource).toContain('z.literal("spotify")');
    expect(schemaSource).toContain('z.literal("none")');
  });

  it("youtube and spotify source URLs are restricted to https", () => {
    expect(schemaSource).toContain("z.url({ protocol: /^https$/ })");
  });

  it("tabs is non-negative integer", () => {
    expect(schemaSource).toContain(".nonnegative()");
  });

  it("updated uses z.coerce.date()", () => {
    expect(schemaSource).toContain("z.coerce.date()");
  });

  it("reading page and totalPages are optional", () => {
    expect(schemaSource).toContain("page: z.number().int().positive().optional()");
    expect(schemaSource).toContain("totalPages: z.number().int().positive().optional()");
  });

  it("content.config.ts uses file loader for currently", () => {
    expect(configSource).toContain('file("./src/content/currently/now.json")');
    expect(configSource).toContain("CurrentlySchema");
  });

  it("no direct file imports of now.json outside content.config.ts", () => {
    const importPattern = /(?:import|from)\s+['"][^'"]*(?:content\/currently|now\.json)['"]/;
    for (const dir of ["src/pages", "src/components", "src/layouts", "src/islands"]) {
      const files = walk(path.join(PROJECT_ROOT, dir));
      const offenders = files
        .filter(
          (f) =>
            f.endsWith(".astro") || f.endsWith(".ts") || f.endsWith(".svelte") || f.endsWith(".js"),
        )
        .filter((f) => {
          const content = readFileSync(f, "utf8");
          return importPattern.test(content);
        });
      expect(offenders).toEqual([]);
    }
  });
});
