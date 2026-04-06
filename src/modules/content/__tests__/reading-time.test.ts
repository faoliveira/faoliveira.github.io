import { describe, expect, it } from "vitest";
import { calculateReadingTime } from "../reading-time";

describe("calculateReadingTime()", () => {
  it("returns 1 for empty content", () => {
    expect(calculateReadingTime("")).toBe(1);
  });

  it("returns 1 for whitespace-only content", () => {
    expect(calculateReadingTime("   \n\t  ")).toBe(1);
  });

  it("returns 1 for short content (fewer than 238 words)", () => {
    const shortContent = "hello world this is a short post";
    expect(calculateReadingTime(shortContent)).toBe(1);
  });

  it("returns 1 for exactly 238 words", () => {
    const content = Array(238).fill("word").join(" ");
    expect(calculateReadingTime(content)).toBe(1);
  });

  it("returns 2 for 476 words (238 * 2)", () => {
    const content = Array(476).fill("word").join(" ");
    expect(calculateReadingTime(content)).toBe(2);
  });

  it("rounds to nearest minute", () => {
    // 357 words = 357/238 ≈ 1.5 → rounds to 2
    const content = Array(357).fill("word").join(" ");
    expect(calculateReadingTime(content)).toBe(2);
  });

  it("handles single word", () => {
    expect(calculateReadingTime("hello")).toBe(1);
  });

  it("counts words separated by multiple spaces correctly", () => {
    const content = "word1   word2\tword3\nword4";
    expect(calculateReadingTime(content)).toBe(1);
  });

  it("strips fenced code blocks before counting", () => {
    // 10 prose words + a large code block that would otherwise inflate count
    const codeBlock = Array(500).fill("token").join(" ");
    const content = `Here are ten words of prose that we want to count.\n\`\`\`ts\n${codeBlock}\n\`\`\``;
    expect(calculateReadingTime(content)).toBe(1);
  });

  it("strips frontmatter before counting", () => {
    const content = `---\ntitle: "Hello"\ndate: 2026-03-18\ndraft: false\n---\nJust one sentence of real content here.`;
    expect(calculateReadingTime(content)).toBe(1);
  });

  it("strips MDX import lines before counting", () => {
    const content = `import Component from './Component'\nimport { something } from 'lib'\nActual prose content here.`;
    expect(calculateReadingTime(content)).toBe(1);
  });
});
