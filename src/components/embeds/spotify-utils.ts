// spotify-utils.ts — Pure functions extracted for unit testing

export type SpotifyType = "track" | "album" | "playlist" | "episode";

/**
 * Sanitizes a Spotify ID to alphanumeric characters only.
 * Strips anything that isn't [a-zA-Z0-9] to prevent injection in iframe URLs.
 */
export function sanitizeSpotifyId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Builds the Spotify embed iframe URL.
 * Expects a pre-sanitized ID (call `sanitizeSpotifyId` at the call site).
 */
export function buildSpotifyUrl(type: SpotifyType, id: string): string {
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
}

/**
 * Builds the Spotify canonical link URL.
 * Expects a pre-sanitized ID (call `sanitizeSpotifyId` at the call site).
 */
export function buildSpotifyLink(type: SpotifyType, id: string): string {
  return `https://open.spotify.com/${type}/${id}`;
}

/**
 * Returns the iframe height in pixels for the given Spotify content type.
 * Track uses compact height (152px); album/playlist/episode use expanded height (352px).
 */
export function getSpotifyHeight(type: SpotifyType): number {
  return type === "track" ? 152 : 352;
}
