import { describe, expect, it } from "vitest";
import type { SearchConfig, SearchResult, SubResult } from "../index";
import { SEARCH_CONFIG } from "../index";

describe("SEARCH_CONFIG", () => {
  it("has correct excerptLength", () => {
    expect(SEARCH_CONFIG.excerptLength).toBe(30);
  });

  it("has correct maxResults", () => {
    expect(SEARCH_CONFIG.maxResults).toBe(5);
  });

  it("has correct debounceMs", () => {
    expect(SEARCH_CONFIG.debounceMs).toBe(300);
  });
});

describe("SearchResult type", () => {
  it("can be constructed with required fields", () => {
    const result: SearchResult = {
      url: "/posts/hello",
      title: "Hello World",
      excerpt: "This is an <mark>excerpt</mark>",
    };
    expect(result.url).toBe("/posts/hello");
    expect(result.title).toBe("Hello World");
    expect(result.subResults).toBeUndefined();
  });

  it("can include subResults", () => {
    const sub: SubResult = { url: "/posts/hello#section", title: "Section", excerpt: "Sub text" };
    const result: SearchResult = {
      url: "/posts/hello",
      title: "Hello World",
      excerpt: "Main excerpt",
      subResults: [sub],
    };
    expect(result.subResults).toHaveLength(1);
    expect(result.subResults?.[0].url).toBe("/posts/hello#section");
  });
});

describe("SearchConfig type", () => {
  it("can be constructed with required fields", () => {
    const config: SearchConfig = {
      excerptLength: 50,
      maxResults: 10,
      debounceMs: 200,
    };
    expect(config.excerptLength).toBe(50);
    expect(config.maxResults).toBe(10);
    expect(config.debounceMs).toBe(200);
  });
});
