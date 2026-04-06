import { describe, expect, it } from "vitest";
import type { SpotifyType } from "../spotify-utils";
import {
  buildSpotifyLink,
  buildSpotifyUrl,
  getSpotifyHeight,
  sanitizeSpotifyId,
} from "../spotify-utils";

describe("sanitizeSpotifyId()", () => {
  it("passes through clean alphanumeric IDs unchanged", () => {
    expect(sanitizeSpotifyId("4PTG3Z6ehGkBFwjybzWkR8")).toBe("4PTG3Z6ehGkBFwjybzWkR8");
  });

  it("strips hyphens", () => {
    expect(sanitizeSpotifyId("4PTG-3Z6e")).toBe("4PTG3Z6e");
  });

  it("strips underscores", () => {
    expect(sanitizeSpotifyId("abc_def")).toBe("abcdef");
  });

  it("strips special characters that could enable injection", () => {
    expect(sanitizeSpotifyId('abc"def')).toBe("abcdef");
    expect(sanitizeSpotifyId("abc?query=1")).toBe("abcquery1");
    expect(sanitizeSpotifyId("abc/../../etc")).toBe("abcetc");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeSpotifyId("")).toBe("");
  });
});

describe("buildSpotifyUrl()", () => {
  const types: SpotifyType[] = ["track", "album", "playlist", "episode"];

  for (const type of types) {
    it(`builds correct embed URL for type: ${type}`, () => {
      const url = buildSpotifyUrl(type, "4PTG3Z6ehGkBFwjybzWkR8");
      expect(url).toBe(
        `https://open.spotify.com/embed/${type}/4PTG3Z6ehGkBFwjybzWkR8?utm_source=generator`,
      );
    });
  }

  it("URL includes utm_source=generator", () => {
    const url = buildSpotifyUrl("track", "abc123");
    expect(url).toContain("utm_source=generator");
  });
});

describe("buildSpotifyLink()", () => {
  it("builds canonical Spotify link for track", () => {
    const link = buildSpotifyLink("track", "4PTG3Z6ehGkBFwjybzWkR8");
    expect(link).toBe("https://open.spotify.com/track/4PTG3Z6ehGkBFwjybzWkR8");
  });

  it("builds canonical Spotify link for album", () => {
    const link = buildSpotifyLink("album", "1DFixLWuPkv3KT3TnV35m3");
    expect(link).toBe("https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3");
  });

  it("builds canonical Spotify link for playlist", () => {
    const link = buildSpotifyLink("playlist", "37i9dQZF1DXcBWIGoYBM5M");
    expect(link).toBe("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M");
  });
});

describe("getSpotifyHeight()", () => {
  it("returns 152 for track (compact height)", () => {
    expect(getSpotifyHeight("track")).toBe(152);
  });

  it("returns 352 for album", () => {
    expect(getSpotifyHeight("album")).toBe(352);
  });

  it("returns 352 for playlist", () => {
    expect(getSpotifyHeight("playlist")).toBe(352);
  });

  it("returns 352 for episode", () => {
    expect(getSpotifyHeight("episode")).toBe(352);
  });
});
