// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import indexSource from "../../../pages/index.astro?raw";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");
const ISLAND_IMPORT_PATH = "@islands/CurrentlyWidget.svelte";

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

function listAstroFiles(relDir: string): string[] {
  const abs = path.join(PROJECT_ROOT, relDir);
  return walk(abs).filter((f) => f.endsWith(".astro"));
}

describe("Homepage — Story 1.6 Currently widget integration", () => {
  it("imports CurrentlyWidget from the @islands alias", () => {
    expect(indexSource).toContain(`import CurrentlyWidget from "${ISLAND_IMPORT_PATH}"`);
  });

  it("fetches the currently/now content entry at build time and throws when missing", () => {
    expect(indexSource).toContain('await getEntry("currently", "now")');
    expect(indexSource).toMatch(/throw new Error\(\s*"Missing currently\/now entry/);
  });

  it("hydrates the island as client:visible (and never client:load)", () => {
    expect(indexSource).toContain("client:visible");
    expect(indexSource).not.toContain("client:load");
  });

  it("renders an h2 with section-label kb-section-label classes and the literal Currently —— copy", () => {
    expect(indexSource).toContain('class="section-label kb-section-label"');
    expect(indexSource).toMatch(
      /<h2\s+id="currently-heading"\s+class="section-label kb-section-label">Currently ——<\/h2>/,
    );
  });

  it("uses aria-labelledby to bind the section to the heading id", () => {
    expect(indexSource).toContain('aria-labelledby="currently-heading"');
  });

  it("does not attach .reveal to the Currently heading or section", () => {
    expect(indexSource).not.toMatch(/class="[^"]*\breveal\b[^"]*"[^>]*id="currently-heading"/);
    expect(indexSource).not.toMatch(
      /<section[^>]*class="[^"]*\breveal\b[^"]*"[^>]*currently-heading/,
    );
  });
});

describe("Homepage — Story 1.6 single-import audit", () => {
  it("@islands/CurrentlyWidget.svelte appears in exactly one src/pages/*.astro file", () => {
    const pages = listAstroFiles("src/pages");
    const matching = pages
      .filter((f) => readFileSync(f, "utf8").includes(ISLAND_IMPORT_PATH))
      .map((f) => path.basename(f))
      .sort();

    expect(matching).toEqual(["index.astro"]);
  });

  it("@islands/CurrentlyWidget.svelte is not imported from src/components or src/layouts", () => {
    for (const dir of ["src/components", "src/layouts"]) {
      const files = walk(path.join(PROJECT_ROOT, dir));
      const offenders = files.filter((f) => {
        if (!f.endsWith(".astro") && !f.endsWith(".ts") && !f.endsWith(".svelte")) return false;
        return readFileSync(f, "utf8").includes(ISLAND_IMPORT_PATH);
      });
      expect(offenders).toEqual([]);
    }
  });
});
