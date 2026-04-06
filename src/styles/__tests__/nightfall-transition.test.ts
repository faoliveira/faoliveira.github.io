// @vitest-environment node
// src/styles/__tests__/nightfall-transition.test.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tokensPath = fileURLToPath(new URL("../tokens.css", import.meta.url));
const nightfallPath = fileURLToPath(new URL("../nightfall.css", import.meta.url));

const tokensCss = readFileSync(tokensPath, "utf8");
const nightfallCss = readFileSync(nightfallPath, "utf8");

function normalizeCssValue(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+\//g, " /")
    .trim();
}

function getPropertyInitialValues(css: string): Map<string, string> {
  const properties = new Map<string, string>();
  const propertyPattern = /@property\s+(--[\w-]+)\s*\{[\s\S]*?initial-value:\s*([^;]+);[\s\S]*?\}/g;

  for (const match of css.matchAll(propertyPattern)) {
    properties.set(match[1], normalizeCssValue(match[2]));
  }

  return properties;
}

function getRootValues(css: string): Map<string, string> {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!rootMatch) {
    throw new Error("Could not find :root block in tokens.css");
  }

  const values = new Map<string, string>();
  const valuePattern = /^(\s*)(--[\w-]+):\s*([^;]+);/gm;

  for (const match of rootMatch[1].matchAll(valuePattern)) {
    values.set(match[2], normalizeCssValue(match[3]));
  }

  return values;
}

function getThemeAnimatedProperties(css: string): string[] {
  const themeAnimatedMatch = css.match(
    /html\[data-theme\]\.theme-animated\s*\{[\s\S]*?transition:\s*([\s\S]*?);\s*\}/,
  );
  if (!themeAnimatedMatch) {
    throw new Error("Could not find html[data-theme].theme-animated transition block");
  }

  return themeAnimatedMatch[1]
    .split(",")
    .map((entry) => entry.trim())
    .map((entry) => entry.match(/^(--[\w-]+)/)?.[1])
    .filter((entry): entry is string => Boolean(entry));
}

describe("nightfall transition tokens", () => {
  it("keeps registered token initial-values in sync with day-mode root values", () => {
    const propertyInitialValues = getPropertyInitialValues(tokensCss);
    const rootValues = getRootValues(tokensCss);

    expect(propertyInitialValues.size).toBe(10);

    for (const [propertyName, initialValue] of propertyInitialValues) {
      expect(rootValues.get(propertyName)).toBe(initialValue);
    }
  });

  it("transitions exactly the registered nightfall color tokens", () => {
    const propertyNames = [...getPropertyInitialValues(tokensCss).keys()].sort();
    const transitionPropertyNames = getThemeAnimatedProperties(nightfallCss).sort();

    expect(transitionPropertyNames).toEqual(propertyNames);
    expect(transitionPropertyNames).not.toContain("background-color");
    expect(transitionPropertyNames).not.toContain("color");
  });
});
