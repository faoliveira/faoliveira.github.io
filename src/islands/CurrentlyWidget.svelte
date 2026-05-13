<script lang="ts">
import type { CurrentlyData } from "@modules/currently/schema";
import FileText from "phosphor-svelte/lib/FileText";
import PawPrint from "phosphor-svelte/lib/PawPrint";
import Terminal from "phosphor-svelte/lib/Terminal";
import Trash from "phosphor-svelte/lib/Trash";
import VinylRecord from "phosphor-svelte/lib/VinylRecord";
import { onDestroy, onMount, untrack } from "svelte";
import { cubicOut, expoOut } from "svelte/easing";
import { type AudioSource, type AudioState, createAudioSource } from "./lib/audio-source";
import type { LoopHandle } from "./lib/NunotchiGame.svelte";
import NunotchiGame from "./lib/NunotchiGame.svelte";
import { lookupCommand, matchesKonami } from "./lib/nuno-commands";
import {
  applyOfflineDecay,
  loadState,
  type NunotchiState,
  DEFAULTS as PET_DEFAULTS,
  saveState,
  tickDecay,
} from "./lib/nunotchi-state";

interface Props {
  data: CurrentlyData;
  /** Show the dev/preview toolbar above the desktop. */
  dev?: boolean;
  /** Compact mode for homepage — smaller surface, tighter layout. */
  compact?: boolean;
}

let { data, dev = false, compact = false }: Props = $props();

type Mood = "idle" | "eat" | "play" | "walk" | "sleep";
type WinId = "currently" | "nowplaying" | "reading" | "nunotchi" | "terminal";
type TabId = "currently" | "nowplaying" | "nunotchi" | "terminal";
interface Win {
  x: number;
  y: number;
  z: number;
  rotate?: number;
  open: boolean;
  minimized: boolean;
}

const getStorage = (): Storage | null =>
  typeof localStorage !== "undefined" ? localStorage : null;

// ── Game state ───────────────────────────────────────────────────────────────
let pet = $state<NunotchiState>({ ...PET_DEFAULTS });
let busy = $state<Mood | null>(null);
let msg = $state(untrack(() => data.mood));

// ── Terminal history (scrollback) ────────────────────────────────────────────
let terminalHistory = $state<Array<{ q: string; reply: string }>>([]);

// ── Boot / mount gate ────────────────────────────────────────────────────────
let mounted = $state(false);
let reduced = $state(false);
let coarsePointer = $state(false);
let activeTab = $state<TabId>("currently");
let surfaceWidth = $state(Infinity);
// ── Loop pause/resume + visibility tracking ──────────────────────────────────
let loopHandle = $state<LoopHandle | null>(null);
let docVisible = $state(true);

// ── Terminal state ───────────────────────────────────────────────────────────
let askInput = $state("");
// Per-command call counter — drives reply rotation so repeated `sit` stays alive.
const cmdCounts = new Map<string, number>();
// Konami detector: ring buffer of the last keydowns, matched against the canonical sequence.
const KONAMI_LEN = 10;
let konamiBuffer: string[] = [];

// ── Clock ────────────────────────────────────────────────────────────────────
let clock = $state("");
let now = $state("");

// ── Window manager ───────────────────────────────────────────────────────────
let topZ = $state(20);
const initialWins: Record<WinId, Win> = {
  currently: { x: 24, y: 28, z: 1, open: true, minimized: false },
  nowplaying: { x: 380, y: 22, z: 2, open: true, minimized: false },
  reading: { x: 28, y: 320, z: 3, rotate: -1.5, open: true, minimized: false },
  nunotchi: { x: 410, y: 220, z: 4, open: true, minimized: false },
  terminal: { x: 24, y: 260, z: 5, open: true, minimized: false },
};
let wins = $state<Record<WinId, Win>>(structuredClone(initialWins));

let dragId: WinId | null = null;
let dragOffset = { x: 0, y: 0 };
let surfaceRect: DOMRect | null = null;
let surface = $state<HTMLDivElement | undefined>(undefined);
let frame = $state<HTMLDivElement | undefined>(undefined);

function focusWin(id: WinId) {
  topZ += 1;
  wins[id].z = topZ;
}
// Drag is decorative repositioning — window position carries no information.
// Keyboard users reach every action via close buttons, in-window controls, and the terminal.
function startDrag(e: PointerEvent, id: WinId) {
  if (e.button !== 0 || coarsePointer) return;
  dragId = id;
  focusWin(id);
  surfaceRect = surface?.getBoundingClientRect() ?? null;
  const w = wins[id];
  dragOffset = { x: e.clientX - w.x, y: e.clientY - w.y };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}
function onDragMove(e: PointerEvent) {
  if (coarsePointer || !dragId) return;
  const nx = e.clientX - dragOffset.x;
  const ny = e.clientY - dragOffset.y;
  if (surfaceRect) {
    wins[dragId].x = Math.max(-40, Math.min(surfaceRect.width - 60, nx));
    wins[dragId].y = Math.max(-4, Math.min(surfaceRect.height - 40, ny));
  } else {
    wins[dragId].x = nx;
    wins[dragId].y = ny;
  }
}
function onDragEnd() {
  if (coarsePointer || !dragId) return;
  dragId = null;
  surfaceRect = null;
}
function closeWin(id: WinId) {
  wins[id].open = false;
  // Redirect focus to the matching desktop icon, or the surface as fallback.
  const iconMap: Record<string, string> = {
    nunotchi: "Nunotchi",
    reading: "Reading.txt",
    nowplaying: "Music",
    terminal: "Terminal",
  };
  const label = iconMap[id];
  if (label && surface) {
    const icons = surface.querySelectorAll(".icon-btn");
    for (const btn of icons) {
      if (btn.querySelector(".icon-label")?.textContent?.trim() === label) {
        (btn as HTMLElement).focus();
        break;
      }
    }
  } else if (surface) {
    surface.focus();
  }
}
function toggleWin(id: WinId) {
  wins[id].open = !wins[id].open;
  if (wins[id].open) {
    wins[id].minimized = false;
    focusWin(id);
  }
}
function minimizeWin(id: WinId) {
  wins[id].minimized = !wins[id].minimized;
  if (!wins[id].minimized) focusWin(id);
}

// Paper-stamp entrance: scale up from 0.94 + fade. Confident, no bounce.
// Rotation is folded into the keyframes so it doesn't collide with the
// inline style:transform on rotated windows (reading, alert).
function paperOpen(
  _node: Element,
  { rotate = 0, reduced: r = false }: { rotate?: number; reduced?: boolean },
) {
  if (r) return { duration: 0 };
  return {
    duration: 220,
    easing: expoOut,
    css: (t: number) =>
      `transform: rotate(${rotate}deg) scale(${0.94 + 0.06 * t}); opacity: ${t}; transform-origin: 50% 35%;`,
  };
}
// Paper-lift exit: scale down + fade. ~73% of entrance duration.
function paperClose(
  _node: Element,
  { rotate = 0, reduced: r = false }: { rotate?: number; reduced?: boolean },
) {
  if (r) return { duration: 0 };
  return {
    duration: 160,
    easing: cubicOut,
    css: (t: number) =>
      `transform: rotate(${rotate}deg) scale(${0.92 + 0.08 * t}); opacity: ${t}; transform-origin: 50% 35%;`,
  };
}

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
function runAction(action: "feed" | "play" | "walk" | "nap" | null) {
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
    // `clear` wipes the scrollback.
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
// Rewards curiosity with a small energy bump + walks++. Not advertised.
function triggerKonami() {
  pet.energy = Math.min(100, pet.energy + 25);
  pet.hp = Math.min(4, pet.hp + 1);
  pet.walks += 1;
  const reply = "koubou code accepted.";
  terminalHistory = [...terminalHistory, { q: "konami", reply }];
  // Clear the "ba" that the user typed at the end of the sequence — the
  // terminal-scoped listener doesn't preventDefault, so those letters land in
  // the input. Wipe them on a successful match for a clean terminal echo.
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
  await ensureAudio();
  if (!audio || audio.kind === "none") return;
  audio.toggle();
  audioState = audio.getState();
}

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmtSpoken(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0 seconds";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  if (m === 0) return `${r} seconds`;
  return `${m} minute${m === 1 ? "" : "s"} ${r} seconds`;
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
  audioState = audio.getState();
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
let clockTimer: ReturnType<typeof setInterval>;
let decayTimer: ReturnType<typeof setInterval> | undefined;
let onVisibility: (() => void) | undefined;
let onPageHide: (() => void) | undefined;
let resizeObserver: ResizeObserver | undefined;
let pointerMedia: MediaQueryList | undefined;
let onPointerChange: ((e: MediaQueryListEvent) => void) | undefined;

onMount(() => {
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  docVisible = document.visibilityState === "visible";
  coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  onPointerChange = (e: MediaQueryListEvent) => {
    coarsePointer = e.matches;
  };
  window.matchMedia("(pointer: coarse)").addEventListener("change", onPointerChange);

  // Persistence: hydrate pet from localStorage and apply offline decay
  // BEFORE flipping the SSR branch off, so the egg-hatch frame never paints
  // with the default pet during the gap between mount and load.
  const loaded = loadState(getStorage());
  pet = applyOfflineDecay(loaded.state, Date.now());
  mounted = true;

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      surfaceWidth = entry.contentRect.width;
    }
  });
  if (frame) {
    surfaceWidth = frame.getBoundingClientRect().width;
    resizeObserver.observe(frame);
  }

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
  // Konami listener is attached to the terminal input via onkeydown directly —
  // easter eggs only fire when the user is actively typing in the widget terminal.

  // DevTools signature — paper-and-matcha tag for tinkerers who open the console.
  // Encouraged by the Currently widget being the most poked-at island.
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
  resizeObserver?.disconnect();
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

// ── Pause / resume the Kontra loop + run the active-time decay tick ──────────
$effect(() => {
  const isCyberdeck = coarsePointer || surfaceWidth < 720;
  const open = isCyberdeck ? true : wins.nunotchi.open && !wins.nunotchi.minimized;
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

// ── Derived display helpers ──────────────────────────────────────────────────
const hearts = $derived("♥".repeat(pet.hp) + "♡".repeat(4 - pet.hp));
const hungerBar = $derived("█".repeat(4 - pet.hunger) + "░".repeat(pet.hunger));
const trackLine = $derived(`${data.music.title} — ${data.music.artist}`);
const readingLine = $derived(`${data.reading.title} — ${data.reading.author}`);
const audioDuration = $derived(audioState.duration || 0);
const audioPos = $derived(audioState.position || 0);
const audioRatio = $derived(audioDuration > 0 ? Math.min(1, audioPos / audioDuration) : 0);
const playable = $derived(data.music.source.kind !== "none");
</script>

<svelte:window onpointermove={onDragMove} onpointerup={onDragEnd} />

<div class="widget-frame" data-busy={busy} data-compact={compact} bind:this={frame}>
  {#if dev}
    <div class="widget-toolbar">
      <span class="widget-title">System-1 paper · widget preview</span>
		<div class="widget-toolbar-actions">
			<button type="button" class="tb" onclick={() => { wins = structuredClone(initialWins); topZ = 20; }}>↺ reset desktop</button>
		</div>
    </div>
  {/if}
	{#if mounted && (coarsePointer || 720 > surfaceWidth)}
		<!-- Cyberdeck layout (Palm-style) -->
		<!-- Cyberdeck layout (Palm-style) -->
		<div class="cyberdeck">
			<div class="cyberdeck-top">
				<span class="cyberdeck-brand">★ {now} · {clock}</span>
			</div>
			<div class="cyberdeck-stack">
				<!-- Currently card -->
				<div class="paper-win cyberdeck-card">
					<div class="title-bar" role="presentation">
						<span class="title">System</span>
					</div>
					<div class="win-body curr-body">
						<dl class="curr-fields">
							<div><dt>mood</dt><dd>{data.mood}</dd></div>
							<div><dt>reading</dt><dd><i>{data.reading.title.toLowerCase()}</i> — {data.reading.author.toLowerCase()} · p.{data.reading.page}</dd></div>
							<div><dt>music</dt><dd>{data.music.artist.toLowerCase()} · {data.music.title.toLowerCase()}</dd></div>
							<div><dt>tabs</dt><dd>{data.tabs} (halp)</dd></div>
							<div><dt>status</dt><dd>{data.status}</dd></div>
							<div><dt>nuno</dt><dd>{hearts} · ⚡{pet.energy}% · {pet.walks} walks today</dd></div>
						</dl>
					</div>
				</div>

				<!-- Now Playing card -->
				<div class="paper-win cyberdeck-card">
					<div class="title-bar" role="presentation">
						<span class="title">Now Playing</span>
					</div>
					<div class="win-body">
						<div class="np-controls">
							<button type="button" class="paper-btn" aria-label="Restart" disabled={!playable} onclick={() => audio?.seek(0)}>◀◀</button>
							<button
								type="button"
								class="paper-btn solid"
								aria-label={audioState.playing ? "Pause" : "Play"}
								disabled={!playable}
								onclick={togglePlay}
							>
								{audioState.playing ? "⏸" : "▶"}
							</button>
							<button type="button" class="paper-btn" aria-label="Skip" disabled={!playable} onclick={() => audio?.seek(audioDuration - 1)}>▶▶</button>
							<span class="np-track" title={trackLine}>
								<span class="np-track-scroll">
									<span>{trackLine}</span>
									<span aria-hidden="true">{trackLine}</span>
								</span>
							</span>
						</div>
						<div
							class="np-progress"
							class:seekable={playable}
							role="slider"
							aria-label="Seek"
							aria-valuemin={0}
							aria-valuemax={Math.max(1, Math.round(audioDuration))}
							aria-valuenow={Math.round(audioPos)}
							aria-valuetext={`${fmtSpoken(audioPos)} of ${fmtSpoken(audioDuration)}`}
							tabindex={playable ? 0 : -1}
							onpointerdown={seekFromBar}
							onkeydown={(e) => {
								if (!playable || !audio) return;
								if (e.key === "ArrowRight") audio.seek((audioPos || 0) + 5);
								else if (e.key === "ArrowLeft") audio.seek(Math.max(0, (audioPos || 0) - 5));
								else return;
								e.preventDefault();
								audioState = audio.getState();
							}}
						>
							<div style:transform={`scaleX(${audioRatio})`}></div>
						</div>
						<div class="np-times">
							<span>{audioMounted ? fmtTime(audioPos) : "0:00"}</span>
							<span>
								{audioMounted ? fmtTime(audioDuration) : data.music.duration}
								{#if audioState.preview}<span class="preview-tag"> · preview</span>{/if}
							</span>
						</div>
						<div class="audio-host" bind:this={audioHost} aria-hidden="true"></div>
					</div>
				</div>

				<!-- Nunotchi card -->
				<div class="paper-win cyberdeck-card">
					<div class="title-bar" role="presentation">
						<span class="title">Nunotchi.app</span>
					</div>
					<div class="win-body">
						<div class="lcd" data-mood={busy ?? "idle"}>
							<div class="lcd-status">
								<span aria-label="happiness">{hearts}</span>
								<span>age {pet.age}</span>
							</div>
							{#if mounted}
								<div class="lcd-stage">
									<NunotchiGame pose={busy ?? "idle"} width={234} height={70} bind:loopHandle />
								</div>
								<div class="lcd-msg">{msg}</div>
							{:else}
								<div class="lcd-boot"><div class="boot-label">loading…</div></div>
							{/if}
						</div>
						<div class="hunger-row">
							<span class="muted">fed</span>
							<span class="bar">{hungerBar}</span>
							<span class="muted">hungry</span>
						</div>
						<div class="game-buttons">
							<button type="button" class="paper-btn" disabled={!!busy} onclick={feed}>A · feed</button>
							<button type="button" class="paper-btn" disabled={!!busy} onclick={play}>B · play</button>
							<button type="button" class="paper-btn solid" disabled={!!busy} onclick={walk}>C · walk</button>
							<button type="button" class="paper-btn" disabled={!!busy} onclick={nap} aria-label="Nap">z</button>
						</div>
						<div class="game-meta">
							<span>walks today: <b>{pet.walks}</b></span>
							<span>energy: <b>{pet.energy}%</b></span>
						</div>
					</div>
				</div>

				<!-- Terminal card -->
				<div class="paper-win cyberdeck-card">
					<div class="title-bar" role="presentation">
						<span class="title">Terminal</span>
					</div>
					<div class="win-body terminal-body">
						<div class="terminal-scroll">
							{#each terminalHistory as entry}
								<div class="terminal-line">
									<span class="cmd-prompt">$</span>
									<span class="cmd-q">{entry.q}</span>
								</div>
								<div class="terminal-line reply">
									<span class="cmd-arrow">→</span>
									<span class="cmd-reply">{entry.reply}</span>
								</div>
							{/each}
						</div>
						<form class="terminal-form" onsubmit={ask}>
							<span class="prompt">$</span>
							<input
								bind:value={askInput}
								onkeydown={onKonamiKey}
								placeholder="try: sit · help"
								aria-label="Terminal — type a command"
								spellcheck="false"
								autocapitalize="off"
								autocomplete="off"
							/>
							<span class="enter">[↵]</span>
						</form>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="surface" data-coarse={coarsePointer} bind:this={surface} role="region" aria-label="System-1 paper desktop" tabindex="-1">
	    {#if wins.currently.open}
	      <div
	        class="paper-win"
	        role="group"
	        aria-label="System"
	        data-minimized={wins.currently.minimized}
	        style:left={`${wins.currently.x}px`}
	        style:top={`${wins.currently.y}px`}
	        style:z-index={wins.currently.z}
	        style:width="300px"
	        onpointerdown={() => focusWin("currently")}
	        in:paperOpen={{ reduced }}
	        out:paperClose={{ reduced }}
	      >
	        <div class="title-bar" onpointerdown={(e) => startDrag(e, "currently")} role="presentation">
	          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("currently")} aria-label="Close System"></button>
	          <span class="title">System</span>
	          <button
	            type="button"
	            class="zoom"
	            class:active={wins.currently.minimized}
	            aria-label={wins.currently.minimized ? "Expand System" : "Minimize System"}
	            aria-expanded={!wins.currently.minimized}
	            onpointerdown={(e) => e.stopPropagation()}
	            onclick={() => minimizeWin("currently")}
	          ></button>
	        </div>
	        <div class="win-body curr-body">
	          <dl class="curr-fields">
	            <div><dt>mood</dt><dd>{data.mood}</dd></div>
				<div><dt>reading</dt><dd><i>{data.reading.title.toLowerCase()}</i> — {data.reading.author.toLowerCase()} · p.{data.reading.page}</dd></div>
	            <div><dt>music</dt><dd>{data.music.artist.toLowerCase()} · {data.music.title.toLowerCase()}</dd></div>
	            <div><dt>tabs</dt><dd>{data.tabs} (halp)</dd></div>
	            <div><dt>status</dt><dd>{data.status}</dd></div>
	            <div><dt>nuno</dt><dd>{hearts} · ⚡{pet.energy}% · {pet.walks} walks today</dd></div>
	          </dl>
	        </div>
	      </div>
	    {/if}

    {#if wins.nowplaying.open}
      <div
        class="paper-win"
        role="group"
        aria-label="Now Playing"
        data-minimized={wins.nowplaying.minimized}
        style:left={`${wins.nowplaying.x}px`}
        style:top={`${wins.nowplaying.y}px`}
        style:z-index={wins.nowplaying.z}
        style:width="240px"
        onpointerdown={() => focusWin("nowplaying")}
        in:paperOpen={{ reduced }}
        out:paperClose={{ reduced }}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "nowplaying")} role="presentation">
          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("nowplaying")} aria-label="Close Now Playing"></button>
          <span class="title">Now Playing</span>
          <button
            type="button"
            class="zoom"
            class:active={wins.nowplaying.minimized}
            aria-label={wins.nowplaying.minimized ? "Expand Now Playing" : "Minimize Now Playing"}
            aria-expanded={!wins.nowplaying.minimized}
            onpointerdown={(e) => e.stopPropagation()}
            onclick={() => minimizeWin("nowplaying")}
          ></button>
        </div>
        <div class="win-body">
          <div class="np-controls">
            <button type="button" class="paper-btn" aria-label="Restart" disabled={!playable} onclick={() => audio?.seek(0)}>◀◀</button>
            <button
              type="button"
              class="paper-btn solid"
              aria-label={audioState.playing ? "Pause" : "Play"}
              disabled={!playable}
              onclick={togglePlay}
            >
              {audioState.playing ? "⏸" : "▶"}
            </button>
            <button type="button" class="paper-btn" aria-label="Skip" disabled={!playable} onclick={() => audio?.seek(audioDuration - 1)}>▶▶</button>
				<span class="np-track" title={trackLine}>
					<span class="np-track-scroll">
						<span>{trackLine}</span>
						<span aria-hidden="true">{trackLine}</span>
					</span>
				</span>
          </div>
          <div
            class="np-progress"
            class:seekable={playable}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.max(1, Math.round(audioDuration))}
            aria-valuenow={Math.round(audioPos)}
            aria-valuetext={`${fmtSpoken(audioPos)} of ${fmtSpoken(audioDuration)}`}
            tabindex={playable ? 0 : -1}
            onpointerdown={seekFromBar}
            onkeydown={(e) => {
              if (!playable || !audio) return;
              if (e.key === "ArrowRight") audio.seek((audioPos || 0) + 5);
              else if (e.key === "ArrowLeft") audio.seek(Math.max(0, (audioPos || 0) - 5));
              else return;
              e.preventDefault();
              audioState = audio.getState();
            }}
          >
            <div style:transform={`scaleX(${audioRatio})`}></div>
          </div>
          <div class="np-times">
            <span>{audioMounted ? fmtTime(audioPos) : "0:00"}</span>
            <span>
              {audioMounted ? fmtTime(audioDuration) : data.music.duration}
              {#if audioState.preview}<span class="preview-tag"> · preview</span>{/if}
            </span>
          </div>
          <div class="audio-host" bind:this={audioHost} aria-hidden="true"></div>
        </div>
      </div>
    {/if}

		{#if wins.reading.open && !compact}
      <div
        class="paper-win"
        role="group"
        aria-label="Reading"
        data-minimized={wins.reading.minimized}
        style:left={`${wins.reading.x}px`}
        style:top={`${wins.reading.y}px`}
        style:z-index={wins.reading.z}
        style:width="220px"
        style:transform={`rotate(${wins.reading.rotate ?? 0}deg)`}
        onpointerdown={() => focusWin("reading")}
        in:paperOpen={{ reduced, rotate: wins.reading.rotate ?? 0 }}
        out:paperClose={{ reduced, rotate: wins.reading.rotate ?? 0 }}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "reading")} role="presentation">
          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("reading")} aria-label="Close Reading"></button>
          <span class="title">Reading.txt</span>
          <button
            type="button"
            class="zoom"
            class:active={wins.reading.minimized}
            aria-label={wins.reading.minimized ? "Expand Reading" : "Minimize Reading"}
            aria-expanded={!wins.reading.minimized}
            onpointerdown={(e) => e.stopPropagation()}
            onclick={() => minimizeWin("reading")}
          ></button>
        </div>
        <div class="win-body">
          <div class="reading-body">
            <b>{readingLine}</b>
          </div>
        </div>
      </div>
    {/if}

    {#if wins.nunotchi.open}
      <div
        class="paper-win"
        role="group"
        aria-label="Nunotchi"
        data-minimized={wins.nunotchi.minimized}
        style:left={`${wins.nunotchi.x}px`}
        style:top={`${wins.nunotchi.y}px`}
        style:z-index={wins.nunotchi.z}
        style:width="270px"
        onpointerdown={() => focusWin("nunotchi")}
        in:paperOpen={{ reduced }}
        out:paperClose={{ reduced }}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "nunotchi")} role="presentation">
          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("nunotchi")} aria-label="Close Nunotchi"></button>
          <span class="title">Nunotchi.app</span>
          <button
            type="button"
            class="zoom"
            class:active={wins.nunotchi.minimized}
            aria-label={wins.nunotchi.minimized ? "Expand Nunotchi" : "Minimize Nunotchi"}
            aria-expanded={!wins.nunotchi.minimized}
            onpointerdown={(e) => e.stopPropagation()}
            onclick={() => minimizeWin("nunotchi")}
          ></button>
        </div>
        <div class="win-body">
          <div class="lcd" data-mood={busy ?? "idle"}>
            <div class="lcd-status">
              <span aria-label="happiness">{hearts}</span>
              <span>age {pet.age}</span>
            </div>

            {#if mounted}
              <div class="lcd-stage">
                <NunotchiGame pose={busy ?? "idle"} width={234} height={70} bind:loopHandle />
              </div>
              <div class="lcd-msg">{msg}</div>
            {:else}
              <div class="lcd-boot"><div class="boot-label">loading…</div></div>
            {/if}
          </div>

          <div class="hunger-row">
            <span class="muted">fed</span>
            <span class="bar">{hungerBar}</span>
            <span class="muted">hungry</span>
          </div>

          <div class="game-buttons">
            <button type="button" class="paper-btn" disabled={!!busy} onclick={feed}>A · feed</button>
            <button type="button" class="paper-btn" disabled={!!busy} onclick={play}>B · play</button>
            <button type="button" class="paper-btn solid" disabled={!!busy} onclick={walk}>C · walk</button>
            <button type="button" class="paper-btn" disabled={!!busy} onclick={nap} aria-label="Nap">z</button>
          </div>

          <div class="game-meta">
            <span>walks today: <b>{pet.walks}</b></span>
            <span>energy: <b>{pet.energy}%</b></span>
          </div>
        </div>
      </div>
    {/if}



		{#if wins.terminal.open}
	      <div
	        class="paper-win"
	        role="group"
	        aria-label="Terminal"
	        data-minimized={wins.terminal.minimized}
	        style:left={`${wins.terminal.x}px`}
	        style:top={`${wins.terminal.y}px`}
	        style:z-index={wins.terminal.z}
	        style:width="320px"
	        onpointerdown={() => focusWin("terminal")}
	        in:paperOpen={{ reduced }}
	        out:paperClose={{ reduced }}
	      >
	        <div class="title-bar" onpointerdown={(e) => startDrag(e, "terminal")} role="presentation">
	          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("terminal")} aria-label="Close Terminal"></button>
	          <span class="title">Terminal</span>
	          <button
	            type="button"
	            class="zoom"
	            class:active={wins.terminal.minimized}
	            aria-label={wins.terminal.minimized ? "Expand Terminal" : "Minimize Terminal"}
	            aria-expanded={!wins.terminal.minimized}
	            onpointerdown={(e) => e.stopPropagation()}
	            onclick={() => minimizeWin("terminal")}
	          ></button>
	        </div>
	        <div class="win-body terminal-body">
	          <div class="terminal-scroll">
	            {#each terminalHistory as entry}
	              <div class="terminal-line">
	                <span class="cmd-prompt">$</span>
	                <span class="cmd-q">{entry.q}</span>
	              </div>
	              <div class="terminal-line reply">
	                <span class="cmd-arrow">→</span>
	                <span class="cmd-reply">{entry.reply}</span>
	              </div>
	            {/each}
	          </div>
	          <form class="terminal-form" onsubmit={ask}>
	            <span class="prompt">$</span>
	            <input
	              bind:value={askInput}
	              onkeydown={onKonamiKey}
	              placeholder="try: sit · help"
	              aria-label="Terminal — type a command"
	              spellcheck="false"
	              autocapitalize="off"
	              autocomplete="off"
	            />
	            <span class="enter">[↵]</span>
	          </form>
	        </div>
	      </div>
	    {/if}

	    <div class="desktop-icons">
	      <button type="button" class="icon-btn" onclick={() => toggleWin("nunotchi")}>
	        <PawPrint size={20} weight="regular" aria-hidden="true" />
	        <span class="icon-label">Nunotchi</span>
	      </button>
				{#if !compact}
					<button type="button" class="icon-btn" onclick={() => toggleWin("reading")}>
						<FileText size={18} weight="regular" aria-hidden="true" />
						<span class="icon-label">Reading.txt</span>
					</button>
				{/if}
	      <button type="button" class="icon-btn" onclick={() => toggleWin("nowplaying")}>
	        <VinylRecord size={20} weight="regular" aria-hidden="true" />
	        <span class="icon-label">Music</span>
	      </button>
	      <button type="button" class="icon-btn" onclick={() => toggleWin("terminal")}>
	        <Terminal size={20} weight="regular" aria-hidden="true" />
	        <span class="icon-label">Terminal</span>
	      </button>
	      <button type="button" class="icon-btn" aria-label="Trash (empty)" disabled>
	        <Trash size={20} weight="regular" aria-hidden="true" />
	        <span class="icon-label">Trash</span>
	      </button>
	    </div>

		<div class="menu-bar">
			<span class="menu-items">★ File · Edit · View</span>
			<span class="clock">{clock || "—"}</span>
		</div>
	</div>
	{/if}
</div>

<style>
  .widget-frame {
    --ink: oklch(0.18 0.02 80);
    --paper: oklch(0.97 0.012 82);
    --dot: color-mix(in oklch, var(--ink) 16%, transparent);
    --ink-soft: color-mix(in oklch, var(--ink) 25%, transparent);
    /* Opaque text tones over --paper. WCAG-checkable: no opacity composite. */
    --ink-secondary: color-mix(in oklch, var(--ink) 70%, var(--paper));
	--ink-tertiary: color-mix(in oklch, var(--ink) 70%, var(--paper));
    --winShadow: 3px 3px 0 var(--ink);
    color: var(--ink);
    font-family: var(--font-mono);
    border: 1.5px solid var(--ink);
    background: color-mix(in oklch, var(--paper) 92%, var(--ink));
    box-shadow: var(--shadow-card-hover);
	}
	.widget-frame[data-compact="true"] {
		padding: 16px;
		background: var(--paper);
		border: 1.5px solid var(--ink);
		box-shadow: 4px 4px 0 var(--ink);
		border-radius: 2px;
		max-inline-size: min(760px, 100%);
		margin-inline: auto;
	}
	:global(html[data-theme="nightfall"]) .widget-frame[data-compact="true"] {
		box-shadow: 4px 4px 0 var(--ink);
	}
  :global(html[data-theme="nightfall"]) .widget-frame {
    --ink: oklch(0.92 0.02 80);
    --paper: oklch(0.22 0.035 280);
    --dot: color-mix(in oklch, var(--ink) 18%, transparent);
    --ink-soft: color-mix(in oklch, var(--ink) 30%, transparent);
  }

  .widget-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ma-narrow);
    padding: var(--ma-narrow) var(--ma-base);
    border-bottom: 1.5px solid var(--ink);
    background: var(--paper);
    font-size: var(--type-xs);
    letter-spacing: 0.06em;
  }
  .widget-title { text-transform: uppercase; color: var(--color-text-secondary); }
  .widget-toolbar-actions { display: flex; gap: 6px; }
  .tb {
    position: relative;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    border-radius: 6px;
  }
  /* Visual stays small to fit retro toolbar; hit area expands vertically to clear WCAG 2.5.8 (24px). */
  .tb::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: -4px;
    bottom: -4px;
  }
  .tb:hover { background: var(--ink); color: var(--paper); }
  .tb:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

  .surface {
    position: relative;
    height: clamp(560px, 75vh, 720px);
    background: var(--paper);
    background-image: radial-gradient(var(--dot) 1px, transparent 1.4px);
    background-size: 4px 4px;
    overflow: hidden;
    /* Allow vertical page scroll over the surface; title-bars own their own
       drag pointer-capture and set touch-action: none locally. */
    touch-action: pan-y;
  }
	.widget-frame[data-compact="true"] .surface {
		min-height: clamp(360px, 42vh, 460px);
	}

  .paper-win {
    position: absolute;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    box-shadow: var(--winShadow);
    color: var(--ink);
    display: grid;
    grid-template-rows: auto 1fr;
    transition: grid-template-rows 200ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .paper-win[data-minimized="true"] { grid-template-rows: auto 0fr; }
  .paper-win > .win-body { overflow: hidden; min-height: 0; }

  .title-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    height: 18px;
    background: repeating-linear-gradient(var(--ink) 0 1px, transparent 1px 3px);
    border-bottom: 1.5px solid var(--ink);
    cursor: grab;
    user-select: none;
    touch-action: none;
  }
  .title-bar:active { cursor: grabbing; }
	.surface[data-coarse="true"] .title-bar {
		cursor: default;
		touch-action: auto;
	}
  .title {
    flex: 1;
    text-align: center;
    background: var(--paper);
    padding: 0 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .close, .zoom {
    width: 11px;
    height: 11px;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    position: relative;
  }
  /* Visual stays 11px to honour the System-1 chrome; hit area expands to 25×25. */
  /* Pseudo overflow into win-body is masked by later DOM siblings — no accidental closes. */
  .close::before,
  .zoom::before {
    content: "";
    position: absolute;
    inset: -7px;
  }
  .close:hover,
  .zoom:hover { background: var(--ink); }
  .close:focus-visible,
  .zoom:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
  /* Zoom shows a thin horizontal rule (System-1 minimize hint); filled when minimized. */
  .zoom::after {
    content: "";
    position: absolute;
    left: 1px;
    right: 1px;
    top: 50%;
    height: 1.5px;
    background: var(--ink);
    transform: translateY(-50%);
    transition: opacity 150ms ease-out;
  }
  .zoom.active { background: var(--ink); }
  .zoom.active::after { background: var(--paper); }

  .win-body {
    padding: 8px;
    font-size: 11px;
    line-height: 1.5;
  }

  /* ── Currently ── */
  .curr-body { font-size: 11px; }
  .curr-fields {
    margin: 0;
    display: grid;
    gap: 4px;
    line-height: 1.4;
  }
  .curr-fields > div { display: grid; grid-template-columns: 72px 1fr; gap: 8px; }
  .curr-fields dt {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-tertiary);
    align-self: center;
  }
  .curr-fields dd { margin: 0; word-break: break-word; }
  .curr-cmd {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px dashed var(--ink-soft);
    font-size: 11px;
    line-height: 1.4;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: baseline;
  }
  .cmd-prompt { color: var(--color-accent); font-weight: 700; }
  .cmd-q { font-weight: 600; }
  .cmd-arrow { color: var(--ink-tertiary); }
  .cmd-reply { color: var(--ink-secondary); }
  .cmd-hint { color: var(--ink-tertiary); font-style: italic; }

  /* ── Now Playing ── */
  .np-controls { display: flex; gap: 6px; align-items: center; font-size: 11px; }
	.np-track {
		margin-left: 4px;
		flex: 1;
		overflow: hidden;
		position: relative;
		white-space: nowrap;
	}
	.np-track-scroll {
		display: inline-flex;
		white-space: nowrap;
		animation: marquee-scroll 12s linear infinite;
	}
	.np-track-scroll span {
		padding-right: 2em;
	}
	@keyframes marquee-scroll {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}
  .np-progress {
    margin-top: 8px;
    height: 10px;
    border: 1px solid var(--ink);
    background: var(--paper);
    position: relative;
    cursor: default;
  }
  .np-progress.seekable { cursor: pointer; }
  .np-progress.seekable:hover > div { background: var(--color-accent); }
  .np-progress:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  .np-progress > div {
    position: absolute;
    inset: 0;
    background: var(--ink);
    transform-origin: left center;
    transition: transform 0.4s linear;
  }
  .np-times {
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--ink-secondary);
  }
  .preview-tag { color: var(--ink-tertiary); font-style: italic; }
  .audio-host {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    left: -9999px;
    top: 0;
  }

  /* ── Reading ── */
  .reading-body { font-size: 11px; line-height: 1.5; }
  .muted { color: var(--ink-secondary); }

  /* ── Nunotchi ── */
  .lcd {
    background: var(--paper);
    border: 1.5px solid var(--ink);
    background-image: radial-gradient(color-mix(in oklch, var(--ink) 14%, transparent) 0.5px, transparent 0.7px);
    background-size: 3px 3px;
    height: 110px;
    position: relative;
    overflow: hidden;
  }
  .lcd-status {
    position: absolute;
    inset: 4px 6px auto 6px;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    line-height: 1;
    z-index: 2;
  }
  .lcd-stage {
    position: absolute;
    inset: 20px 0 16px 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .lcd-msg {
    position: absolute;
    bottom: 3px;
    left: 6px;
    right: 6px;
    font-size: 11px;
    line-height: 1;
    color: var(--ink-secondary);
    text-align: center;
  }

  .lcd-boot {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .boot-label { font-size: 11px; color: var(--ink-secondary); letter-spacing: 0.1em; }

  .hunger-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    font-size: 11px;
  }
  .hunger-row .bar { letter-spacing: 1px; font-family: var(--font-mono); }

  .game-buttons {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .game-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-top: 6px;
    color: var(--ink-secondary);
  }

  /* ── Paper buttons ── */
  .paper-btn {
    position: relative;
    border: 1.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    padding: 2px 10px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    border-radius: 8px;
  }
  /* Vertical-only expansion: horizontal would steal taps from siblings in 4–6px gaps. */
  .paper-btn::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: -5px;
    bottom: -5px;
  }
  .paper-btn.solid { background: var(--ink); color: var(--paper); }
  .paper-btn:hover:not(:disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 var(--ink);
  }
  .paper-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  .paper-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Desktop icons ── */
  .desktop-icons {
    position: absolute;
    bottom: 36px;
    left: 24px;
    display: flex;
    gap: 18px;
    color: var(--ink);
  }
  .icon-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-family: inherit;
  }
	  .icon-btn :global(svg) {
	    color: var(--ink);
	  }
	  .icon-btn:hover :global(svg) {
	    color: color-mix(in oklch, var(--ink) 70%, var(--color-accent));
	  }
	  .icon-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
	  .icon-btn[disabled] { opacity: 0.5; cursor: default; }
	  .icon-label {
	    font-size: 10px;
	    color: var(--ink);
	    background: color-mix(in oklch, var(--paper) 70%, transparent);
	    padding: 0 3px;
	  }

	  /* ── Terminal window ── */
	  .terminal-body {
	    display: flex;
	    flex-direction: column;
	    gap: 6px;
	    padding: 8px;
	    font-size: 11px;
	    line-height: 1.5;
	    background:
	      radial-gradient(color-mix(in oklch, var(--ink) 8%, transparent) 1px, transparent 1px);
	    background-size: 4px 4px;
	  }
	  .terminal-scroll {
	    overflow-y: auto;
	    max-height: 130px;
	    display: flex;
	    flex-direction: column;
	    gap: 2px;
	    font-family: var(--font-mono);
	  }
	  .terminal-scroll::-webkit-scrollbar { width: 4px; }
	  .terminal-scroll::-webkit-scrollbar-thumb { background: var(--ink-soft); }
	  .terminal-line {
	    display: flex;
	    gap: 4px;
	    flex-wrap: wrap;
	    align-items: baseline;
	  }
	  .terminal-line.reply {
	    padding-left: 12px;
	    opacity: 0.85;
	  }
	  .terminal-form {
	    display: flex;
	    align-items: center;
	    gap: 6px;
	    border-top: 1.5px solid var(--ink-soft);
	    padding-top: 6px;
	    margin-top: 2px;
	  }
	  .terminal-form .prompt { color: var(--color-accent); font-weight: 700; }
	  .terminal-form input {
	    flex: 1;
	    background: transparent;
	    border: none;
	    outline: none;
	    font-family: var(--font-mono);
	    font-size: 11px;
	    color: var(--ink);
	    min-width: 0;
	  }
	  .terminal-form .enter { font-size: 9px; color: var(--ink-tertiary); letter-spacing: 0.1em; }

  /* ── Menu bar ── */
  .menu-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--ink);
    color: var(--paper);
    padding: 4px 12px;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
	}

	  @media (prefers-reduced-motion: reduce) {
	    .paper-win { transition: none; }
	    .zoom::after { transition: none; }
	    .np-track-scroll { animation: none; }
	  }

	  @media (max-width: 720px) {
	    .surface { height: clamp(640px, 85vh, 800px); }
	    .desktop-icons { left: 12px; gap: 12px; }
	    .paper-btn { padding: 5px 12px; font-size: 11px; }
	    .paper-btn::before { inset: -6px; }
	    .close::before { inset: -10px; }
	    .close, .zoom { width: 14px; height: 14px; }
	  }

	  /* ── Cyberdeck (mobile / coarse pointer) ─────────────────────────────── */
	  .cyberdeck {
	    display: flex;
	    flex-direction: column;
	    gap: 8px;
	    font-family: var(--font-mono);
	    color: var(--ink);
	  }
	  .cyberdeck-top {
	    display: flex;
	    align-items: center;
	    justify-content: space-between;
	    gap: 8px;
	    padding: 6px 10px;
	    border: 2px solid var(--ink);
	    background: var(--paper);
	    box-shadow: 3px 3px 0 var(--ink);
	  }
	  .cyberdeck-brand {
	    font-size: 11px;
	    font-weight: 700;
	    letter-spacing: 0.04em;
	    white-space: nowrap;
	  }
	  .cyberdeck-stack {
	    display: flex;
	    flex-direction: column;
	    gap: 12px;
	    padding: 8px;
	    background: var(--paper);
	    background-image: radial-gradient(var(--dot) 1px, transparent 1.4px);
	    background-size: 4px 4px;
	    border: 2px solid var(--ink);
	    box-shadow: 3px 3px 0 var(--ink);
	    overflow-y: auto;
	    max-height: 70vh;
	    touch-action: pan-y;
	  }
	  .cyberdeck-card {
	    border: 2px solid var(--ink);
	    box-shadow: 3px 3px 0 var(--ink);
	    background: var(--paper);
	    position: relative;
	  }
	  .cyberdeck-card::before,
	  .cyberdeck-card::after {
	    content: "";
	    position: absolute;
	    width: 6px;
	    height: 6px;
	    border: 1.5px solid var(--ink);
	    background: var(--paper);
	    z-index: 1;
	  }
	  .cyberdeck-card::before {
	    top: -4px;
	    left: -4px;
	  }
	  .cyberdeck-card::after {
	    bottom: -4px;
	    right: -4px;
	  }
	  .cyberdeck-card .title-bar {
	    border-bottom: 2px solid var(--ink);
	    padding: 4px 8px;
	    font-size: 10px;
	    font-weight: 700;
	    letter-spacing: 0.06em;
	    text-transform: uppercase;
	    background: var(--ink);
	    color: var(--paper);
	    display: flex;
	    align-items: center;
	    gap: 4px;
	  }
	.cyberdeck-card .title {
		background: transparent;
		padding: 0;
	}
	  .cyberdeck-card .title-bar::before {
	    content: "◆";
	    font-size: 8px;
	  }
	  .cyberdeck-card .win-body {
	    padding: 10px;
	  }
	  .cyberdeck-bottom {
	    display: flex;
	    gap: 6px;
	    justify-content: center;
	    padding: 8px;
	    border: 2px solid var(--ink);
	    background: var(--paper);
	    box-shadow: 3px 3px 0 var(--ink);
	  }
	  .cyberdeck-bottom .paper-btn {
	    flex: 1;
	    text-align: center;
	    font-size: 11px;
	    padding: 6px 8px;
	    border: 2px solid var(--ink);
	    box-shadow: 2px 2px 0 var(--ink);
	  }
	  .cyberdeck-bottom .paper-btn:active {
	    transform: translate(2px, 2px);
	    box-shadow: none;
	  }

</style>
