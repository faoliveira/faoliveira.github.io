import { describe, expect, it } from "vitest";
import { SITE_DESCRIPTION, SITE_LANGUAGE, SITE_TITLE, SITE_URL } from "../site-config";

describe("site-config", () => {
  it("SITE_URL is a non-empty string", () => {
    expect(typeof SITE_URL).toBe("string");
    expect(SITE_URL.length).toBeGreaterThan(0);
  });

  it("SITE_URL is a valid URL", () => {
    expect(() => new URL(SITE_URL)).not.toThrow();
  });

  it("SITE_TITLE is a non-empty string", () => {
    expect(typeof SITE_TITLE).toBe("string");
    expect(SITE_TITLE.length).toBeGreaterThan(0);
  });

  it("SITE_DESCRIPTION is a non-empty string", () => {
    expect(typeof SITE_DESCRIPTION).toBe("string");
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it("SITE_LANGUAGE is a non-empty string", () => {
    expect(typeof SITE_LANGUAGE).toBe("string");
    expect(SITE_LANGUAGE.length).toBeGreaterThan(0);
  });

  it("SITE_URL points to felipeo.me", () => {
    expect(SITE_URL).toBe("https://felipeo.me");
  });

  it("SITE_TITLE matches site identity", () => {
    expect(SITE_TITLE).toBe("felipeo.me");
  });
});
