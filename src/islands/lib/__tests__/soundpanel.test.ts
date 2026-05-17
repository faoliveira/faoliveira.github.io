import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CyberdeckLayout from "../CyberdeckLayout.svelte";
import DesktopLayout from "../DesktopLayout.svelte";
import type { WindowState } from "../window-state.svelte";

const MOCK_DATA = {
  music: {
    title: "Test Track",
    artist: "Test Artist",
    duration: "3:45",
    source: { kind: "none" as const },
  },
  reading: {
    title: "Test Book",
    author: "Test Author",
  },
  mood: "idle · loaf",
  tabs: 3,
  status: "online",
  updated: new Date(),
};

function mockWindowState(): WindowState {
  const wins = {
    currently: { open: true, minimized: false, x: 0, y: 0, z: 1 },
    nunotchi: { open: false, minimized: false, x: 0, y: 0, z: 0 },
    reading: { open: false, minimized: false, x: 0, y: 0, z: 0, rotate: 0 },
    nowplaying: { open: false, minimized: false, x: 0, y: 0, z: 0 },
    terminal: { open: false, minimized: false, x: 0, y: 0, z: 0 },
    posts: { open: false, minimized: false, x: 0, y: 0, z: 0 },
  };
  return {
    wins,
    focusWin: vi.fn(),
    startDrag: vi.fn(),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    closeWin: vi.fn(),
    toggleWin: vi.fn(),
    minimizeWin: vi.fn(),
    resetDesktop: vi.fn(),
    resetDragState: vi.fn(),
    pocketOpen: vi.fn(),
    pocketSwap: vi.fn(),
    pocketClose: vi.fn(),
    pocketOpenOnly: vi.fn(),
    pocketHome: vi.fn(),
    enterCyberdeck: vi.fn(),
    enterDesktop: vi.fn(),
  } as unknown as WindowState;
}

const COMMON_PROPS = {
  data: MOCK_DATA,
  pet: { hp: 4, hunger: 0, energy: 100, walks: 0, bornAt: Date.now() },
  hearts: "♥♥♥♥",
  hungerBar: "████",
  busy: null,
  msg: "idle · loaf",
  mounted: true,
  readingLine: "Test Book — Test Author",
  trackLine: "Test Track — Test Artist",
  playable: false,
  audioState: { playing: false, position: 0, duration: 0 },
  audioMounted: false,
  audioPos: 0,
  audioDuration: 0,
  audioRatio: 0,
  history: [],
  onFeed: vi.fn(),
  onPlay: vi.fn(),
  onWalk: vi.fn(),
  onNap: vi.fn(),
  onAsk: vi.fn(),
  onKonamiKey: vi.fn(),
  onRestart: vi.fn(),
  onSkip: vi.fn(),
  onTogglePlay: vi.fn(),
  onSeekBar: vi.fn(),
  onSeekArrow: vi.fn(),
};

describe("DesktopLayout SoundPanel", () => {
  let container: HTMLDivElement;
  let instance: Record<string, unknown> | undefined;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (instance) {
      unmount(instance);
      instance = undefined;
    }
    container.remove();
  });

  it("renders muted icon and label when soundMuted is true", () => {
    instance = mount(DesktopLayout, {
      target: container,
      props: {
        ...COMMON_PROPS,
        reduced: false,
        compact: false,
        coarsePointer: false,
        clock: "12:00 PM",
        winState: mockWindowState(),
        soundMuted: true,
        onToggleMute: vi.fn(),
      },
    });

    const btn = container.querySelector<HTMLButtonElement>(".sound-toggle");
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute("aria-label")).toBe("Unmute audio");
    expect(btn?.querySelector("svg")).toBeTruthy();
  });

  it("renders unmuted icon and label when soundMuted is false", () => {
    instance = mount(DesktopLayout, {
      target: container,
      props: {
        ...COMMON_PROPS,
        reduced: false,
        compact: false,
        coarsePointer: false,
        clock: "12:00 PM",
        winState: mockWindowState(),
        soundMuted: false,
        onToggleMute: vi.fn(),
      },
    });

    const btn = container.querySelector<HTMLButtonElement>(".sound-toggle");
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute("aria-label")).toBe("Mute audio");
  });

  it("calls onToggleMute when clicked", () => {
    const onToggleMute = vi.fn();
    instance = mount(DesktopLayout, {
      target: container,
      props: {
        ...COMMON_PROPS,
        reduced: false,
        compact: false,
        coarsePointer: false,
        clock: "12:00 PM",
        winState: mockWindowState(),
        soundMuted: false,
        onToggleMute,
      },
    });

    const btn = container.querySelector<HTMLButtonElement>(".sound-toggle");
    btn?.click();
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });
});

describe("CyberdeckLayout SoundPanel", () => {
  let container: HTMLDivElement;
  let instance: Record<string, unknown> | undefined;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (instance) {
      unmount(instance);
      instance = undefined;
    }
    container.remove();
  });

  it("renders muted icon and label when soundMuted is true", () => {
    instance = mount(CyberdeckLayout, {
      target: container,
      props: {
        ...COMMON_PROPS,
        compact: false,
        clock: "12:00 PM",
        now: "May 17",
        winState: mockWindowState(),
        soundMuted: true,
        onToggleMute: vi.fn(),
      },
    });

    const btn = container.querySelector<HTMLButtonElement>(".sound-toggle");
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute("aria-label")).toBe("Unmute audio");
  });

  it("renders unmuted icon and label when soundMuted is false", () => {
    instance = mount(CyberdeckLayout, {
      target: container,
      props: {
        ...COMMON_PROPS,
        compact: false,
        clock: "12:00 PM",
        now: "May 17",
        winState: mockWindowState(),
        soundMuted: false,
        onToggleMute: vi.fn(),
      },
    });

    const btn = container.querySelector<HTMLButtonElement>(".sound-toggle");
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute("aria-label")).toBe("Mute audio");
  });
});
