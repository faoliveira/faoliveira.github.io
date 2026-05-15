/**
 * Hidden-iframe audio sources for the Now Playing window.
 *
 * The widget chrome (▶ / ⏸ / ◀◀ / ▶▶, track strip, progress bar) stays
 * unchanged. Each adapter mounts a 1×1 invisible iframe behind the chrome
 * and exposes a uniform play/pause/seek interface.
 */

export type SourceKind = "youtube" | "spotify" | "none";

export interface AudioSourceSpec {
  kind: SourceKind;
  url?: string;
}

export type AudioEvent = "ready" | "state" | "end";

export interface AudioState {
  playing: boolean;
  position: number; // seconds
  duration: number; // seconds
  /** Some Spotify embeds only have 30s preview; surface so the UI can flag it. */
  preview?: boolean;
}

export interface AudioSource {
  readonly kind: SourceKind;
  mount(target: HTMLElement): Promise<void>;
  play(): void;
  pause(): void;
  toggle(): void;
  seek(seconds: number): void;
  getState(): AudioState;
  on(event: AudioEvent, cb: () => void): () => void;
  destroy(): void;
}

// ── URL parsing ──────────────────────────────────────────────────────────────

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (YT_ID_RE.test(trimmed)) return trimmed;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return YT_ID_RE.test(id) ? id : null;
  }
  if (/(^|\.)youtube\.com$/.test(url.hostname)) {
    const v = url.searchParams.get("v");
    if (v && YT_ID_RE.test(v)) return v;
    const m = url.pathname.match(/\/(?:embed|v|shorts)\/([A-Za-z0-9_-]{11})/);
    if (m && m[1]) return m[1];
  }
  return null;
}

const SPOT_ID_RE = /^[A-Za-z0-9]{22}$/;

export interface SpotifyRef {
  type: "track" | "episode" | "playlist" | "album";
  id: string;
  uri: string;
}

export function parseSpotifyRef(input: string): SpotifyRef | null {
  if (!input) return null;
  const trimmed = input.trim();
  // spotify:track:ID
  const uriMatch = trimmed.match(/^spotify:(track|episode|playlist|album):([A-Za-z0-9]{22})$/);
  if (uriMatch) {
    const [, type, id] = uriMatch as unknown as [string, SpotifyRef["type"], string];
    return { type, id, uri: `spotify:${type}:${id}` };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!/(^|\.)spotify\.com$/.test(url.hostname)) return null;
  const seg = url.pathname.split("/").filter(Boolean);
  // /track/ID, /embed/track/ID, /intl-pt/track/ID, /embed/intl-pt/track/ID
  for (let i = 0; i < seg.length - 1; i++) {
    const t = seg[i];
    const id = seg[i + 1];
    if (
      (t === "track" || t === "episode" || t === "playlist" || t === "album") &&
      SPOT_ID_RE.test(id)
    ) {
      return { type: t as SpotifyRef["type"], id, uri: `spotify:${t}:${id}` };
    }
  }
  return null;
}

// ── Internal: idempotent script loaders ──────────────────────────────────────

let ytApiPromise: Promise<typeof window.YT> | null = null;

function loadYouTubeApi(): Promise<typeof window.YT> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

let spotifyApiPromise: Promise<SpotifyIFrameApi> | null = null;

interface SpotifyIFrameApi {
  createController(
    target: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: SpotifyController) => void,
  ): void;
}
interface SpotifyController {
  play(): void;
  pause(): void;
  togglePlay(): void;
  seek(positionSeconds: number): void;
  addListener(
    event: "ready" | "playback_update",
    cb: (e: { data: SpotifyPlaybackData }) => void,
  ): void;
  removeListener(event: string): void;
  destroy(): void;
}
interface SpotifyPlaybackData {
  isPaused: boolean;
  isBuffering: boolean;
  position: number; // ms
  duration: number; // ms
}

function loadSpotifyApi(): Promise<SpotifyIFrameApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (spotifyApiPromise) return spotifyApiPromise;
  spotifyApiPromise = new Promise((resolve) => {
    window.onSpotifyIframeApiReady = (IFrameAPI: SpotifyIFrameApi) => {
      resolve(IFrameAPI);
    };
    const tag = document.createElement("script");
    tag.src = "https://open.spotify.com/embed/iframe-api/v1";
    tag.async = true;
    document.head.appendChild(tag);
  });
  return spotifyApiPromise;
}

// ── No-op source ─────────────────────────────────────────────────────────────

class NoopSource implements AudioSource {
  readonly kind: SourceKind = "none";
  async mount() {}
  play() {}
  pause() {}
  toggle() {}
  seek() {}
  getState(): AudioState {
    return { playing: false, position: 0, duration: 0 };
  }
  on() {
    return () => {};
  }
  destroy() {}
}

// ── YouTube source ───────────────────────────────────────────────────────────

class YouTubeSource implements AudioSource {
  readonly kind: SourceKind = "youtube";
  private player: YTPlayer | null = null;
  private state: AudioState = { playing: false, position: 0, duration: 0 };
  private listeners: Map<AudioEvent, Set<() => void>> = new Map();
  private wantPlay = false;

  constructor(private videoId: string) {}

  async mount(target: HTMLElement) {
    const YT = await loadYouTubeApi();
    if (!YT) throw new Error("YouTube IFrame API failed to load");
    const host = document.createElement("div");
    host.id = `np-yt-${Math.random().toString(36).slice(2, 8)}`;
    target.appendChild(host);
    await new Promise<void>((resolve) => {
      this.player = new YT.Player(host, {
        videoId: this.videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            this.state.duration = this.player?.getDuration?.() ?? 0;
            this.emit("ready");
            if (this.wantPlay) this.player?.playVideo?.();
            resolve();
          },
          onStateChange: (e: { data: number }) => {
            this.state.playing = e.data === 1;
            if (e.data === 0) this.emit("end");
            this.emit("state");
          },
        },
      });
    });
  }
  play() {
    this.wantPlay = true;
    this.player?.playVideo?.();
  }
  pause() {
    this.wantPlay = false;
    this.player?.pauseVideo?.();
  }
  toggle() {
    this.state.playing ? this.pause() : this.play();
  }
  seek(s: number) {
    this.player?.seekTo?.(s, true);
  }
  getState() {
    if (this.player) {
      this.state.position = this.player.getCurrentTime?.() ?? 0;
      this.state.duration = this.player.getDuration?.() ?? this.state.duration;
    }
    return { ...this.state };
  }
  on(event: AudioEvent, cb: () => void) {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb);
    return () => set!.delete(cb);
  }
  destroy() {
    try {
      this.player?.destroy?.();
    } catch {
      // player may already be torn down by the iframe
    }
    this.player = null;
    this.listeners.clear();
  }
  private emit(event: AudioEvent) {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) cb();
    }
  }
}

// ── Spotify source ───────────────────────────────────────────────────────────

class SpotifySource implements AudioSource {
  readonly kind: SourceKind = "spotify";
  private controller: SpotifyController | null = null;
  private state: AudioState = { playing: false, position: 0, duration: 0, preview: false };
  private listeners: Map<AudioEvent, Set<() => void>> = new Map();
  private wantPlay = false;

  constructor(private ref: SpotifyRef) {}

  async mount(target: HTMLElement) {
    const api = await loadSpotifyApi();
    const host = document.createElement("div");
    target.appendChild(host);
    await new Promise<void>((resolve) => {
      api.createController(host, { uri: this.ref.uri, width: "100%", height: 80 }, (controller) => {
        this.controller = controller;
        controller.addListener("ready", () => {
          this.emit("ready");
          if (this.wantPlay) controller.togglePlay();
          resolve();
        });
        controller.addListener("playback_update", (e) => {
          const d = e.data;
          this.state.playing = !d.isPaused;
          this.state.position = d.position / 1000;
          this.state.duration = d.duration / 1000;
          // 30s exactly = preview clip
          if (this.state.duration > 0 && this.state.duration <= 30.5) this.state.preview = true;
          if (d.position > 0 && d.position >= d.duration && d.duration > 0) this.emit("end");
          this.emit("state");
        });
      });
    });
  }
  play() {
    this.wantPlay = true;
    if (!this.state.playing) this.controller?.togglePlay?.();
  }
  pause() {
    this.wantPlay = false;
    if (this.state.playing) this.controller?.togglePlay?.();
  }
  toggle() {
    this.controller?.togglePlay?.();
  }
  seek(s: number) {
    this.controller?.seek?.(s);
  }
  getState() {
    return { ...this.state };
  }
  on(event: AudioEvent, cb: () => void) {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb);
    return () => set!.delete(cb);
  }
  destroy() {
    try {
      this.controller?.destroy?.();
    } catch {
      // controller may have lost its iframe already
    }
    this.controller = null;
    this.listeners.clear();
  }
  private emit(event: AudioEvent) {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) cb();
    }
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createAudioSource(spec: AudioSourceSpec): AudioSource {
  if (spec.kind === "youtube" && spec.url) {
    const id = parseYouTubeId(spec.url);
    if (id) return new YouTubeSource(id);
  }
  if (spec.kind === "spotify" && spec.url) {
    const ref = parseSpotifyRef(spec.url);
    if (ref) return new SpotifySource(ref);
  }
  return new NoopSource();
}

// ── Ambient types ────────────────────────────────────────────────────────────

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
interface YTPlayerCtor {
  new (el: HTMLElement | string, options: YTPlayerOptions): YTPlayer;
}
interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
    onStateChange?: (e: { data: number }) => void;
  };
}

declare global {
  interface Window {
    YT?: { Player: YTPlayerCtor };
    onYouTubeIframeAPIReady?: () => void;
    onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void;
  }
}
