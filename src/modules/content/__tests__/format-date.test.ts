import { describe, expect, it } from "vitest";
import { formatDate, toISODateString } from "../format-date";

describe("formatDate()", () => {
  it("formats a date in short month format", () => {
    const date = new Date("2026-03-18T00:00:00Z");
    expect(formatDate(date)).toBe("Mar 18, 2026");
  });

  it("formats January correctly", () => {
    const date = new Date("2026-01-05T00:00:00Z");
    expect(formatDate(date)).toBe("Jan 5, 2026");
  });

  it("formats December correctly", () => {
    const date = new Date("2025-12-31T00:00:00Z");
    expect(formatDate(date)).toBe("Dec 31, 2025");
  });

  it("uses UTC to avoid timezone shifts", () => {
    // Midnight UTC — should not shift to previous day in any timezone
    const date = new Date("2026-06-01T00:00:00Z");
    expect(formatDate(date)).toBe("Jun 1, 2026");
  });

  it("does not shift date for UTC+5 offset input (real timezone boundary)", () => {
    // 2026-06-01T01:00:00+05:00 = 2026-05-31T20:00:00Z — should render May 31, not Jun 1
    const date = new Date("2026-05-31T20:00:00Z");
    expect(formatDate(date)).toBe("May 31, 2026");
  });

  it("formats Unix epoch correctly", () => {
    const date = new Date(0); // 1970-01-01T00:00:00Z
    expect(formatDate(date)).toBe("Jan 1, 1970");
  });
});

describe("toISODateString()", () => {
  it("returns YYYY-MM-DD format", () => {
    const date = new Date("2026-03-18T00:00:00Z");
    expect(toISODateString(date)).toBe("2026-03-18");
  });

  it("pads single-digit months and days", () => {
    const date = new Date("2026-01-05T00:00:00Z");
    expect(toISODateString(date)).toBe("2026-01-05");
  });

  it("uses UTC to avoid timezone shifts", () => {
    const date = new Date("2026-06-01T00:00:00Z");
    expect(toISODateString(date)).toBe("2026-06-01");
  });

  it("does not shift date for UTC+5 offset input (real timezone boundary)", () => {
    // Same wall-clock moment as above: May 31 UTC, not Jun 1
    const date = new Date("2026-05-31T20:00:00Z");
    expect(toISODateString(date)).toBe("2026-05-31");
  });

  it("formats Unix epoch correctly", () => {
    const date = new Date(0);
    expect(toISODateString(date)).toBe("1970-01-01");
  });
});
