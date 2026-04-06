import { describe, expect, it } from "vitest";
import { buildProjectStructuredData } from "../structured-data";

describe("buildProjectStructuredData", () => {
  it("returns base fields with title only", () => {
    const result = buildProjectStructuredData({ title: "My Project" });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("CreativeWork");
    expect(result.name).toBe("My Project");
    expect(result.author).toEqual({
      "@type": "Person",
      name: "Felipe Oliveira",
      url: "https://felipeo.me",
    });
    expect(result.description).toBeUndefined();
    expect(result.url).toBeUndefined();
    expect(result.codeRepository).toBeUndefined();
  });

  it("includes description when provided", () => {
    const result = buildProjectStructuredData({
      title: "Test",
      description: "A test project",
    });
    expect(result.description).toBe("A test project");
  });

  it("includes url when liveUrl is provided", () => {
    const result = buildProjectStructuredData({
      title: "Test",
      liveUrl: "https://example.com",
    });
    expect(result.url).toBe("https://example.com");
  });

  it("includes codeRepository when repo is provided", () => {
    const result = buildProjectStructuredData({
      title: "Test",
      repo: "https://github.com/user/repo",
    });
    expect(result.codeRepository).toBe("https://github.com/user/repo");
  });

  it("includes all optional fields when fully provided", () => {
    const result = buildProjectStructuredData({
      title: "Full Project",
      description: "All fields present",
      repo: "https://github.com/user/repo",
      liveUrl: "https://example.com/live",
    });

    expect(result.name).toBe("Full Project");
    expect(result.description).toBe("All fields present");
    expect(result.codeRepository).toBe("https://github.com/user/repo");
    expect(result.url).toBe("https://example.com/live");
  });

  it("produces valid JSON when serialized", () => {
    const result = buildProjectStructuredData({
      title: 'Project with "quotes"',
      description: "Has <html> & special chars",
      repo: "https://github.com/user/repo",
    });

    const json = JSON.stringify(result);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('Project with "quotes"');
    expect(parsed.description).toBe("Has <html> & special chars");
  });
});
