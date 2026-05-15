import { describe, expect, it } from "vitest";
import { createAudioSource, parseSpotifyRef, parseYouTubeId } from "../audio-source";

describe("parseYouTubeId", () => {
  it("accepts watch URLs", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=8ID1plssS4s")).toBe("8ID1plssS4s");
    expect(parseYouTubeId("http://youtube.com/watch?v=dQw4w9WgXcQ&t=30s")).toBe("dQw4w9WgXcQ");
  });
  it("accepts youtu.be short URLs", () => {
    expect(parseYouTubeId("https://youtu.be/8ID1plssS4s")).toBe("8ID1plssS4s");
    expect(parseYouTubeId("https://youtu.be/8ID1plssS4s?t=12")).toBe("8ID1plssS4s");
  });
  it("accepts /embed/ and /shorts/ paths", () => {
    expect(parseYouTubeId("https://www.youtube.com/embed/8ID1plssS4s")).toBe("8ID1plssS4s");
    expect(parseYouTubeId("https://youtube.com/shorts/8ID1plssS4s")).toBe("8ID1plssS4s");
  });
  it("accepts a raw 11-char id", () => {
    expect(parseYouTubeId("8ID1plssS4s")).toBe("8ID1plssS4s");
  });
  it("rejects non-YouTube hosts and malformed input", () => {
    expect(parseYouTubeId("https://example.com/watch?v=abc")).toBeNull();
    expect(parseYouTubeId("https://www.youtube.com/watch")).toBeNull();
    expect(parseYouTubeId("not a url")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
  });
});

describe("parseSpotifyRef", () => {
  it("accepts spotify: URIs", () => {
    expect(parseSpotifyRef("spotify:track:4iV5W9uYEdYUVa79Axb7Rh")).toEqual({
      type: "track",
      id: "4iV5W9uYEdYUVa79Axb7Rh",
      uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
    });
  });
  it("accepts open.spotify.com URLs (track / episode / playlist / album)", () => {
    expect(parseSpotifyRef("https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh")?.type).toBe(
      "track",
    );
    expect(parseSpotifyRef("https://open.spotify.com/episode/4iV5W9uYEdYUVa79Axb7Rh")?.type).toBe(
      "episode",
    );
    expect(parseSpotifyRef("https://open.spotify.com/playlist/4iV5W9uYEdYUVa79Axb7Rh")?.type).toBe(
      "playlist",
    );
    expect(parseSpotifyRef("https://open.spotify.com/album/4iV5W9uYEdYUVa79Axb7Rh")?.type).toBe(
      "album",
    );
  });
  it("accepts /embed/ and /intl-* prefixed URLs", () => {
    expect(parseSpotifyRef("https://open.spotify.com/embed/track/4iV5W9uYEdYUVa79Axb7Rh")?.id).toBe(
      "4iV5W9uYEdYUVa79Axb7Rh",
    );
    expect(
      parseSpotifyRef("https://open.spotify.com/intl-pt/track/4iV5W9uYEdYUVa79Axb7Rh")?.id,
    ).toBe("4iV5W9uYEdYUVa79Axb7Rh");
  });
  it("rejects non-Spotify hosts and short ids", () => {
    expect(parseSpotifyRef("https://example.com/track/abc")).toBeNull();
    expect(parseSpotifyRef("spotify:track:short")).toBeNull();
    expect(parseSpotifyRef("")).toBeNull();
  });
});

describe("createAudioSource", () => {
  it("returns a no-op source when kind=none", () => {
    const s = createAudioSource({ kind: "none" });
    expect(s.kind).toBe("none");
    expect(s.getState().playing).toBe(false);
    // No throw on calls.
    s.play();
    s.pause();
    s.toggle();
    s.seek(10);
    s.destroy();
  });
  it("returns a no-op source when YouTube URL is invalid", () => {
    expect(createAudioSource({ kind: "youtube", url: "not a url" }).kind).toBe("none");
  });
  it("returns a YouTube source when URL is valid", () => {
    expect(createAudioSource({ kind: "youtube", url: "https://youtu.be/8ID1plssS4s" }).kind).toBe(
      "youtube",
    );
  });
  it("returns a Spotify source when URI is valid", () => {
    expect(
      createAudioSource({ kind: "spotify", url: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" }).kind,
    ).toBe("spotify");
  });
});
