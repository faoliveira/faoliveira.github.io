<script lang="ts">
import type { Post } from "@modules/content";
import type { CurrentlyData } from "@modules/currently/schema";
import { onDestroy, onMount, untrack } from "svelte";
import { type AudioSource, type AudioState, createAudioSource } from "./lib/audio-source";
import CyberdeckLayout from "./lib/CyberdeckLayout.svelte";
import type { Mood, PetAction, TerminalEntry } from "./lib/currently-types";
import DesktopLayout from "./lib/DesktopLayout.svelte";
import type { LoopHandle } from "./lib/NunotchiGame.svelte";
import { lookupCommand, matchesKonami } from "./lib/nuno-commands";
import {
  applyOfflineDecay,
  loadState,
  type NunotchiState,
  DEFAULTS as PET_DEFAULTS,
  saveState,
  tickDecay,
} from "./lib/nunotchi-state";
import { createWindowState } from "./lib/window-state.svelte";

interface Props {
  data: CurrentlyData;
  /** Show the dev/preview toolbar above the desktop. */
  dev?: boolean;
  /** Compact mode for homepage — smaller surface, tighter layout. */
  compact?: boolean;
  /** Posts data for Posts.app */
  posts?: Post[];
}

let { data, dev = false, compact = false, posts = [] }: Props = $props();

const getStorage = (): Storage | null =>
  typeof globalThis !== "undefined" && "localStorage" in globalThis
    ? globalThis.localStorage
    : null;

// ── Game state ───────────────────────────────────────────────────────────────
let pet = $state<NunotchiState>({ ...PET_DEFAULTS });
let busy = $state<Mood | null>(null);
let msg = $state(untrack(() => data.mood));

// ── Terminal history (scrollback) ────────────────────────────────────────────
let terminalHistory = $state<TerminalEntry[]>([]);

// ── Boot / mount gate ────────────────────────────────────────────────────────
let mounted = $state(false);
let reduced = $state(false);
let coarsePointer = $state(false);
// Initial value 0 ensures the cyberdeck branch wins on hydration until the
// resize listener reports a real width. With Infinity, mobile hydrated to the
// desktop layout for one frame before swapping.
let viewportWidth = $state(0);

// ── Loop pause/resume + visibility tracking ──────────────────────────────────
let loopHandle = $state<LoopHandle | null>(null);
let docVisible = $state(true);

// ── Terminal state ───────────────────────────────────────────────────────────
let askInput = $state("");
// Per-command call counter — drives reply rotation so repeated `sit` stays alive.
const cmdCounts = new Map<string, number>();
const KONAMI_LEN = 10;
let konamiBuffer: string[] = [];

// ── Clock ────────────────────────────────────────────────────────────────────

// ── Sound state ────────────────────────────────────────────────────────────
let soundMuted = $state(false);
const STORAGE_KEY_MUTE = "nunotchi:v1:mute";
function onToggleMute() {
  soundMuted = !soundMuted;
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY_MUTE, JSON.stringify(soundMuted));
  }
}
let clock = $state("");
let now = $state("");

// ── Window manager ───────────────────────────────────────────────────────────
const winState = createWindowState({ coarsePointer: () => coarsePointer });

let surface = $state<HTMLDivElement | undefined>(undefined);

// ── Game actions (also reachable from terminal commands) ─────────────────────
function animate(label: Mood, after?: () => void) {
  busy = label;
  msg = label === "eat" ? "nom nom" : `${label}!`;
  const finish = () => {
    busy = null;
    after?.();
    msg = "idle · loaf";
    saveState(getStorage(), pet, Date.now());
  };
  if (reduced) queueMicrotask(finish);
  else setTimeout(finish, 900);
}
function feed() {
  if (busy) return;
  animate("eat", () => {
    pet.hunger = Math.max(0, pet.hunger - 1);
    pet.hp = Math.min(4, pet.hp + 1);
  });
}
function play() {
  if (busy) return;
  animate("play", () => {
    pet.hp = Math.min(4, pet.hp + 1);
    pet.hunger = Math.min(4, pet.hunger + 1);
    pet.energy = Math.max(0, pet.energy - 6);
  });
}
function walk() {
  if (busy) return;
  animate("walk", () => {
    pet.hp = Math.min(4, pet.hp + 1);
    pet.walks += 1;
    pet.energy = Math.max(0, pet.energy - 12);
  });
}
function nap() {
  if (busy) return;
  animate("sleep", () => {
    pet.energy = Math.min(100, pet.energy + 25);
  });
}
function runAction(action: PetAction | null) {
  if (action === "feed") feed();
  else if (action === "play") play();
  else if (action === "walk") walk();
  else if (action === "nap") nap();
}

// ── Terminal ─────────────────────────────────────────────────────────────────
function ask(e: Event) {
  e.preventDefault();
  const q = askInput.trim();
  if (!q) return;
  const key = q.toLowerCase();
  const count = cmdCounts.get(key) ?? 0;
  const lookup = lookupCommand(q, { count, now: new Date() });
  if (lookup.clear) {
    askInput = "";
    terminalHistory = [];
    return;
  }
  cmdCounts.set(key, count + 1);
  runAction(lookup.result.action);
  terminalHistory = [...terminalHistory, { q, reply: lookup.result.reply }];
  askInput = "";
}

// Konami: ↑↑↓↓←→←→BA anywhere on the page while the widget is mounted.
function triggerKonami() {
  pet.energy = Math.min(100, pet.energy + 25);
  pet.hp = Math.min(4, pet.hp + 1);
  pet.walks += 1;
  const reply = "koubou code accepted.";
  terminalHistory = [...terminalHistory, { q: "konami", reply }];
  // Clear the "ba" the user typed at the end — terminal listener doesn't
  // preventDefault, so those letters land in the input. Wipe on match.
  askInput = "";
  msg = "★ koubou code ★";
  if (reduced) {
    saveState(getStorage(), pet, Date.now());
    return;
  }
  busy = "play";
  setTimeout(() => {
    busy = null;
    msg = "idle · loaf";
    saveState(getStorage(), pet, Date.now());
  }, 1200);
}

function onKonamiKey(e: KeyboardEvent) {
  const k = e.key;
  if (!k) return;
  konamiBuffer.push(k);
  if (konamiBuffer.length > KONAMI_LEN) {
    konamiBuffer = konamiBuffer.slice(konamiBuffer.length - KONAMI_LEN);
  }
  if (matchesKonami(konamiBuffer)) {
    konamiBuffer = [];
    triggerKonami();
  }
}

// ── Now Playing audio adapter ────────────────────────────────────────────────
let audio: AudioSource | null = null;
let audioMounted = $state(false);
let audioState = $state<AudioState>({ playing: false, position: 0, duration: 0 });
let audioHost = $state<HTMLDivElement | undefined>(undefined);

async function ensureAudio() {
  if (audio || data.music.source.kind === "none") return;
  audio = createAudioSource(data.music.source);
  if (audio.kind === "none") return;
  audio.on("state", () => {
    audioState = audio?.getState() ?? audioState;
  });
  audio.on("end", () => {
    audioState = audio?.getState() ?? audioState;
  });
  if (!audioHost) return;
  await audio.mount(audioHost);
  audioMounted = true;
  audioState = audio.getState();
}

async function togglePlay() {
  if (soundMuted) {
    soundMuted = false;
  }
  await ensureAudio();
  if (!audio || audio.kind === "none") return;
  audio.toggle();
}

async function seekFromBar(e: PointerEvent) {
  if (!playable) return;
  e.stopPropagation();
  // Capture before await — currentTarget becomes null after the event handler yields.
  const bar = e.currentTarget as HTMLElement;
  const clientX = e.clientX;
  await ensureAudio();
  if (!audio || audio.kind === "none") return;
  const rect = bar.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const dur = audio.getState().duration || 0;
  if (dur > 0) audio.seek(ratio * dur);
}

function restartAudio() {
  audio?.seek(0);
}
async function skipAudio() {
  await ensureAudio();
  audio?.seek(Math.max(0, audioDuration - 1));
}
function seekArrow(deltaSec: number) {
  if (!audio) return;
  const next = Math.max(0, (audioPos || 0) + deltaSec);
  audio.seek(next);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
let clockTimer: ReturnType<typeof setInterval>;
let decayTimer: ReturnType<typeof setInterval> | undefined;
let onVisibility: (() => void) | undefined;
let onPageHide: (() => void) | undefined;
let onViewportResize: (() => void) | undefined;
let pointerMedia: MediaQueryList | undefined;
let onPointerChange: ((e: MediaQueryListEvent) => void) | undefined;

onMount(() => {
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  docVisible = document.visibilityState === "visible";
  pointerMedia = window.matchMedia("(pointer: coarse)");
  coarsePointer = pointerMedia.matches;
  onPointerChange = (e: MediaQueryListEvent) => {
    coarsePointer = e.matches;
  };
  pointerMedia.addEventListener("change", onPointerChange);

  // Persistence: hydrate pet from localStorage and apply offline decay
  // BEFORE flipping the SSR branch off, so the egg-hatch frame never paints
  // with the default pet during the gap between mount and load.
  const loaded = loadState(getStorage());
  pet = applyOfflineDecay(loaded.state, Date.now());
  mounted = true;

  const storedMute = getStorage()?.getItem(STORAGE_KEY_MUTE);
  soundMuted = storedMute ? JSON.parse(storedMute) : false;
  viewportWidth = window.innerWidth;
  onViewportResize = () => {
    viewportWidth = window.innerWidth;
  };
  window.addEventListener("resize", onViewportResize, { passive: true });

  const updateClock = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h < 12 ? "AM" : "PM";
    const hh = ((h + 11) % 12) + 1;
    clock = `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
    now = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  updateClock();
  clockTimer = setInterval(updateClock, 60_000);

  onVisibility = () => {
    docVisible = document.visibilityState === "visible";
    if (!docVisible) saveState(getStorage(), pet, Date.now());
  };
  onPageHide = () => {
    saveState(getStorage(), pet, Date.now());
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);

  // DevTools signature — paper-and-matcha tag for tinkerers who open the console.
  // biome-ignore lint/suspicious/noConsole: intentional DevTools signature
  console.log(
    "%c fa.workshop %c felipeo.me · the koubou ",
    "background:oklch(0.45 0.10 155);color:oklch(0.97 0.012 82);padding:2px 6px;font:600 11px ui-monospace,monospace;border-radius:3px;",
    "color:oklch(0.45 0.02 60);padding:2px 6px;font:11px ui-monospace,monospace;",
  );
  // biome-ignore lint/suspicious/noConsole: intentional DevTools signature
  console.log(
    "%ctry typing help in the terminal. nuno knows more than he lets on.",
    "color:oklch(0.40 0.04 40);font:italic 13px Caveat,cursive;",
  );
});

onDestroy(() => {
  // Svelte 5 SSR runs onDestroy after server render to release effect cleanups
  // (renderer.js#close_render). Skip browser-API cleanup on the server side.
  if (typeof window === "undefined") return;
  clearInterval(clockTimer);
  if (decayTimer) clearInterval(decayTimer);
  if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
  if (onPageHide) window.removeEventListener("pagehide", onPageHide);
  audio?.destroy();
  if (onViewportResize) window.removeEventListener("resize", onViewportResize);
  if (pointerMedia && onPointerChange) pointerMedia.removeEventListener("change", onPointerChange);
});

// Poll audio position only while the tab is visible and audio is actually playing.
// Audio "state"/"end" events keep audioState.playing in sync, so the effect re-runs
// when playback stops or the tab hides, releasing the 1Hz wake.
$effect(() => {
  if (!docVisible || !audioState.playing || !audioMounted || !audio) return;
  const src = audio;
  const id = setInterval(() => {
    audioState = src.getState();
  }, 1000);
  return () => clearInterval(id);
});

// ── Pause/resume audio on mute toggle ──────────────────────────────────────
$effect(() => {
  if (soundMuted && audioState.playing && audio) {
    audio.pause();
  }
});

// ── Pause / resume the Kontra loop + run the active-time decay tick ──────────
// `wins.nunotchi.minimized` is honored in both layouts — on cyberdeck the
// minimize control collapses the card body and stops the loop too.
$effect(() => {
  const open = winState.wins.nunotchi.open && !winState.wins.nunotchi.minimized;
  const visible = docVisible;
  if (!open || !visible) {
    loopHandle?.pause();
    if (decayTimer) {
      clearInterval(decayTimer);
      decayTimer = undefined;
    }
    return;
  }
  loopHandle?.resume();
  if (!decayTimer) {
    decayTimer = setInterval(() => {
      pet = tickDecay(pet, 60_000);
      saveState(getStorage(), pet, Date.now());
    }, 60_000);
  }
});

// ── Branch swap cleanup ──────────────────────────────────────────────────────
// When the layout flips between desktop and cyberdeck (viewport resize across
// 720px, rotation, hardware pointer attach/detach on iPadOS), `bind:this`
// targets in the unmounting branch detach. Active drag pointer-capture and the
// mounted audio iframe would otherwise survive on stale nodes. Reset both so
// the next interaction re-attaches cleanly.
// `_firstSwap` distinguishes the initial-mount transition from a true resize.
// We always normalize the wins state on entry (mount or resize) so the pocket
// layout's single-window invariant holds.
let _lastIsCyberdeck = false;
let _firstSwap = true;
$effect(() => {
  if (!mounted) return;
  const isCyberdeck = coarsePointer || viewportWidth < 720;
  if (!_firstSwap && isCyberdeck === _lastIsCyberdeck) return;
  _lastIsCyberdeck = isCyberdeck;
  _firstSwap = false;
  winState.resetDragState();
  if (isCyberdeck) winState.enterCyberdeck();
  else winState.enterDesktop();
  if (audioMounted) {
    audio?.destroy();
    audio = null;
    audioMounted = false;
    audioState = { playing: false, position: 0, duration: 0 };
  }
});

// ── Derived display helpers ──────────────────────────────────────────────────
const hearts = $derived("♥".repeat(pet.hp) + "♡".repeat(4 - pet.hp));
const hungerBar = $derived("█".repeat(4 - pet.hunger) + "░".repeat(pet.hunger));
const trackLine = $derived(`${data.music.title} — ${data.music.artist}`);
const readingLine = $derived(`${data.reading.title} — ${data.reading.author}`);
const audioDuration = $derived(audioState.duration || 0);
const audioPos = $derived(audioState.position || 0);
const audioRatio = $derived(audioDuration > 0 ? Math.min(1, audioPos / audioDuration) : 0);
const playable = $derived(data.music.source.kind !== "none");
const isCyberdeck = $derived(mounted && (coarsePointer || viewportWidth < 720));
</script>

<div class="widget-frame" data-busy={busy} data-compact={compact}>
  {#if dev}
    <div class="widget-toolbar">
      <span class="widget-title">System-1 paper · widget preview</span>
      <div class="widget-toolbar-actions">
        <button type="button" class="tb" onclick={() => winState.resetDesktop(window.innerWidth)}>↺ reset desktop</button>
      </div>
    </div>
  {/if}
  {#if isCyberdeck}
    <CyberdeckLayout
      {data}
      {pet}
      {hearts}
      {hungerBar}
      {busy}
      {msg}
      {mounted}
      {compact}
      {clock}
      {now}
      {readingLine}
      {trackLine}
      {playable}
      {audioState}
      {audioMounted}
      {audioPos}
      {audioDuration}
      {audioRatio}
      bind:audioHost
      history={terminalHistory}
      bind:askInput
      bind:loopHandle
      {winState}
      onFeed={feed}
      onPlay={play}
      onWalk={walk}
      onNap={nap}
      onAsk={ask}
      {onKonamiKey}
      onRestart={restartAudio}
      onSkip={skipAudio}
      onTogglePlay={togglePlay}
      onSeekBar={seekFromBar}
      onSeekArrow={seekArrow}
      onToggleMute={onToggleMute}
      {soundMuted}
      {posts}
      {coarsePointer}
    />
  {:else}
    <DesktopLayout
      {data}
      {pet}
      {hearts}
      {hungerBar}
      {busy}
      {msg}
      {mounted}
      {reduced}
      {compact}
      {coarsePointer}
      {clock}
      {readingLine}
      {trackLine}
      {playable}
      {audioState}
      {audioMounted}
      {audioPos}
      {audioDuration}
      {audioRatio}
      bind:audioHost
      bind:surface
      history={terminalHistory}
      bind:askInput
      bind:loopHandle
      {winState}
      onFeed={feed}
      onPlay={play}
      onWalk={walk}
      onNap={nap}
      onAsk={ask}
      {onKonamiKey}
      onRestart={restartAudio}
      onSkip={skipAudio}
      onTogglePlay={togglePlay}
      onSeekBar={seekFromBar}
      onSeekArrow={seekArrow}
      onToggleMute={onToggleMute}
      {soundMuted}
      {posts}
    />
  {/if}
</div>

<svelte:window onpointermove={winState.onDragMove} onpointerup={winState.onDragEnd} />
