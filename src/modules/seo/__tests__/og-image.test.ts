import { describe, expect, it } from "vitest";
import { generateOgImage } from "../og-image";

describe("generateOgImage", () => {
  it("returns a non-empty Uint8Array", async () => {
    const result = await generateOgImage({ title: "Test Post" });
    expect(ArrayBuffer.isView(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns a valid PNG (magic bytes)", async () => {
    const result = await generateOgImage({ title: "PNG Check" });
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(result[0]).toBe(0x89);
    expect(result[1]).toBe(0x50); // P
    expect(result[2]).toBe(0x4e); // N
    expect(result[3]).toBe(0x47); // G
  });

  it("handles long titles without error", async () => {
    const longTitle = "A".repeat(200);
    const result = await generateOgImage({ title: longTitle });
    expect(ArrayBuffer.isView(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles missing description gracefully", async () => {
    const result = await generateOgImage({ title: "No Description" });
    expect(ArrayBuffer.isView(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles HTML-special characters in title, description, and type without error", async () => {
    const result = await generateOgImage({
      title: `<script>alert("xss")</script> & "quoted"`,
      description: "A post with <b>bold</b> & special chars",
      type: "data-essay",
    });
    expect(ArrayBuffer.isView(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles all post types", { timeout: 30000 }, async () => {
    for (const type of ["log", "project", "data-essay", undefined]) {
      const result = await generateOgImage({
        title: `Post type: ${type ?? "none"}`,
        description: "A test description",
        type,
      });
      expect(ArrayBuffer.isView(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
