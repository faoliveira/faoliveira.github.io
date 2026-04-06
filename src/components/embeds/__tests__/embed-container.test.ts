import { describe, expect, it } from "vitest";
import { buildCodePenLink, buildCodePenUrl } from "../codepen-utils";
import { buildSpotifyLink, buildSpotifyUrl, getSpotifyHeight } from "../spotify-utils";

// EmbedContainer is a pure Astro component (no JS logic to extract).
// These tests verify the embed URL contracts that the container would render.

describe("EmbedContainer — embed URL contracts", () => {
  describe("Spotify embed URLs rendered by Spotify.astro", () => {
    it("track embed URL matches Spotify embed pattern", () => {
      const url = buildSpotifyUrl("track", "4PTG3Z6ehGkBFwjybzWkR8");
      expect(url).toMatch(/^https:\/\/open\.spotify\.com\/embed\/track\//);
    });

    it("album embed URL matches Spotify embed pattern", () => {
      const url = buildSpotifyUrl("album", "1DFixLWuPkv3KT3TnV35m3");
      expect(url).toMatch(/^https:\/\/open\.spotify\.com\/embed\/album\//);
    });

    it("fallback link URL is a canonical Spotify URL", () => {
      const link = buildSpotifyLink("playlist", "37i9dQZF1DXcBWIGoYBM5M");
      expect(link).toMatch(/^https:\/\/open\.spotify\.com\/playlist\//);
    });

    it("track height is 152px (compact)", () => {
      expect(getSpotifyHeight("track")).toBe(152);
    });

    it("album/playlist/episode height is 352px", () => {
      for (const type of ["album", "playlist", "episode"] as const) {
        expect(getSpotifyHeight(type)).toBe(352);
      }
    });
  });

  describe("CodePen embed URLs rendered by CodePen.astro", () => {
    it("embed URL matches CodePen embed pattern", () => {
      const url = buildCodePenUrl("cassie-codes", "abcdef");
      expect(url).toMatch(/^https:\/\/codepen\.io\/[^/]+\/embed\//);
    });

    it("fallback link URL is a canonical CodePen pen URL", () => {
      const link = buildCodePenLink("cassie-codes", "abcdef");
      expect(link).toMatch(/^https:\/\/codepen\.io\/[^/]+\/pen\//);
    });
  });
});
