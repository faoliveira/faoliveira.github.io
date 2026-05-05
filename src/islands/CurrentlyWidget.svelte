<script lang="ts">
import type { CurrentlyData } from "@modules/currently/schema";
import { onDestroy, onMount, untrack } from "svelte";
import { type AudioSource, type AudioState, createAudioSource } from "./lib/audio-source";
import NunotchiGame from "./lib/NunotchiGame.svelte";
import { lookupCommand } from "./lib/nuno-commands";

interface Props {
  data: CurrentlyData;
  /** Show the dev/preview toolbar above the desktop. */
  dev?: boolean;
}

let { data, dev = false }: Props = $props();

type Mood = "idle" | "eat" | "play" | "walk" | "sleep";
type WinId = "currently" | "nowplaying" | "reading" | "nunotchi" | "alert";

interface Win {
  x: number;
  y: number;
  z: number;
  rotate?: number;
  open: boolean;
}

// ── Game state ───────────────────────────────────────────────────────────────
let hp = $state(3);
let hunger = $state(2);
let energy = $state(48);
let age = $state(4);
let walks = $state(2);
let busy = $state<Mood | null>(null);
let msg = $state(untrack(() => data.mood));

// ── Last command echo (Currently shows the latest typed command + result) ────
let lastCommand = $state<{ q: string; reply: string } | null>(null);

// ── Boot / hatch ─────────────────────────────────────────────────────────────
let booting = $state(true);
let hatchFrame = $state(0);

// ── Terminal state ───────────────────────────────────────────────────────────
let askInput = $state("");
let askReply = $state<string | null>(null);

// ── Clock ────────────────────────────────────────────────────────────────────
let clock = $state("—:—");
let now = $state("");

// ── Window manager ───────────────────────────────────────────────────────────
let topZ = $state(20);
const initialWins: Record<WinId, Win> = {
  currently: { x: 24, y: 28, z: 1, open: true },
  nowplaying: { x: 380, y: 22, z: 2, open: true },
  reading: { x: 28, y: 320, z: 3, rotate: -1.5, open: true },
  nunotchi: { x: 410, y: 220, z: 4, open: true },
  alert: { x: 200, y: 180, z: 10, rotate: -1, open: true },
};
let wins = $state<Record<WinId, Win>>(structuredClone(initialWins));

let dragId: WinId | null = null;
let dragOffset = { x: 0, y: 0 };
let surfaceRect: DOMRect | null = null;
let surface: HTMLDivElement;

function focusWin(id: WinId) {
  topZ += 1;
  wins[id].z = topZ;
}
function startDrag(e: PointerEvent, id: WinId) {
  if (e.button !== 0) return;
  dragId = id;
  focusWin(id);
  surfaceRect = surface?.getBoundingClientRect() ?? null;
  const w = wins[id];
  dragOffset = { x: e.clientX - w.x, y: e.clientY - w.y };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}
function onDragMove(e: PointerEvent) {
  if (!dragId) return;
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
  dragId = null;
  surfaceRect = null;
}
function closeWin(id: WinId) {
  wins[id].open = false;
}
function toggleWin(id: WinId) {
  wins[id].open = !wins[id].open;
  if (wins[id].open) focusWin(id);
}
function resetDesktop() {
  wins = structuredClone(initialWins);
  topZ = 20;
}

// ── Game actions (also reachable from terminal commands) ─────────────────────
function animate(label: Mood, after?: () => void) {
  busy = label;
  msg = label === "eat" ? "nom nom" : `${label}!`;
  setTimeout(() => {
    busy = null;
    after?.();
    msg = "idle · loaf";
  }, 900);
}
function feed() {
  if (busy) return;
  animate("eat", () => {
    hunger = Math.max(0, hunger - 1);
    hp = Math.min(4, hp + 1);
  });
}
function play() {
  if (busy) return;
  animate("play", () => {
    hp = Math.min(4, hp + 1);
    hunger = Math.min(4, hunger + 1);
    energy = Math.max(0, energy - 6);
  });
}
function walk() {
  if (busy) return;
  animate("walk", () => {
    hp = Math.min(4, hp + 1);
    walks += 1;
    energy = Math.max(0, energy - 12);
  });
}
function nap() {
  if (busy) return;
  animate("sleep", () => {
    energy = Math.min(100, energy + 25);
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
  const { result } = lookupCommand(q);
  runAction(result.action);
  askReply = result.reply;
  lastCommand = { q, reply: result.reply };
  askInput = "";
}

// ── Now Playing audio adapter ────────────────────────────────────────────────
let audio: AudioSource | null = null;
let audioMounted = $state(false);
let audioState = $state<AudioState>({ playing: false, position: 0, duration: 0 });
let audioHost = $state<HTMLDivElement | undefined>(undefined);
let pollTimer: ReturnType<typeof setInterval> | undefined;

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
let hatchTimer: ReturnType<typeof setInterval>;

onMount(() => {
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
  clockTimer = setInterval(updateClock, 30_000);

  hatchTimer = setInterval(() => {
    hatchFrame += 1;
    if (hatchFrame >= 4) {
      clearInterval(hatchTimer);
      booting = false;
    }
  }, 600);

  // Poll audio position while playing for the progress bar.
  pollTimer = setInterval(() => {
    if (audio && audioMounted && audioState.playing) {
      audioState = audio.getState();
    }
  }, 1000);
});

onDestroy(() => {
  clearInterval(clockTimer);
  clearInterval(hatchTimer);
  if (pollTimer) clearInterval(pollTimer);
  audio?.destroy();
});

// ── Derived display helpers ──────────────────────────────────────────────────
const hearts = $derived("♥".repeat(hp) + "♡".repeat(4 - hp));
const hungerBar = $derived("█".repeat(4 - hunger) + "░".repeat(hunger));
const trackLine = $derived(`${data.music.title} — ${data.music.artist}`);
const readingLine = $derived(`${data.reading.title} — ${data.reading.author}`);
const audioDuration = $derived(audioState.duration || 0);
const audioPos = $derived(audioState.position || 0);
const audioRatio = $derived(audioDuration > 0 ? Math.min(1, audioPos / audioDuration) : 0);
const playable = $derived(data.music.source.kind !== "none");
</script>

<svelte:window onpointermove={onDragMove} onpointerup={onDragEnd} />

<div class="widget-frame" data-busy={busy}>
  {#if dev}
    <div class="widget-toolbar">
      <span class="widget-title">System-1 paper · widget preview</span>
      <div class="widget-toolbar-actions">
        <button type="button" class="tb" onclick={() => { wins.alert.open = true; focusWin("alert"); }}>
          ! alert
        </button>
        <button type="button" class="tb" onclick={resetDesktop}>↺ reset desktop</button>
      </div>
    </div>
  {/if}

  <div
    class="surface"
    bind:this={surface}
    role="region"
    aria-label="System-1 paper desktop"
  >
    {#if wins.currently.open}
      <div
        class="paper-win"
        role="group"
        aria-label="Currently"
        style:left={`${wins.currently.x}px`}
        style:top={`${wins.currently.y}px`}
        style:z-index={wins.currently.z}
        style:width="300px"
        onpointerdown={() => focusWin("currently")}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "currently")} role="presentation">
          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("currently")} aria-label="Close Currently"></button>
          <span class="title">Currently — felipeo</span>
          <span class="zoom" aria-hidden="true"></span>
        </div>
        <div class="win-body curr-body">
          <dl class="curr-fields">
            <div><dt>mood</dt><dd>{data.mood}</dd></div>
            <div><dt>reading</dt><dd><i>{data.reading.title.toLowerCase()}</i> — {data.reading.author.toLowerCase()}</dd></div>
            <div><dt>music</dt><dd>{data.music.artist.toLowerCase()} · {data.music.title.toLowerCase()}</dd></div>
            <div><dt>tabs</dt><dd>{data.tabs} (halp)</dd></div>
            <div><dt>status</dt><dd>{data.status}</dd></div>
            <div><dt>nuno</dt><dd>{hearts} · ⚡{energy}% · {walks} walks today</dd></div>
          </dl>
          <div class="curr-cmd" aria-live="polite">
            {#if lastCommand}
              <span class="cmd-prompt">$</span>
              <span class="cmd-q">{lastCommand.q}</span>
              <span class="cmd-arrow">→</span>
              <span class="cmd-reply">{lastCommand.reply}</span>
            {:else}
              <span class="cmd-hint">type a command in the terminal below to see Nuno respond</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    {#if wins.nowplaying.open}
      <div
        class="paper-win"
        role="group"
        aria-label="Now Playing"
        style:left={`${wins.nowplaying.x}px`}
        style:top={`${wins.nowplaying.y}px`}
        style:z-index={wins.nowplaying.z}
        style:width="240px"
        onpointerdown={() => focusWin("nowplaying")}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "nowplaying")} role="presentation">
          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("nowplaying")} aria-label="Close Now Playing"></button>
          <span class="title">Now Playing</span>
          <span class="zoom"></span>
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
            <span class="np-track" title={trackLine}>{trackLine}</span>
          </div>
          <div
            class="np-progress"
            class:seekable={playable}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.max(1, Math.round(audioDuration))}
            aria-valuenow={Math.round(audioPos)}
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
            <div style:inset={`0 ${(1 - audioRatio) * 100}% 0 0`}></div>
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

    {#if wins.reading.open}
      <div
        class="paper-win"
        role="group"
        aria-label="Reading"
        style:left={`${wins.reading.x}px`}
        style:top={`${wins.reading.y}px`}
        style:z-index={wins.reading.z}
        style:width="220px"
        style:transform={`rotate(${wins.reading.rotate ?? 0}deg)`}
        onpointerdown={() => focusWin("reading")}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "reading")} role="presentation">
          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("reading")} aria-label="Close Reading"></button>
          <span class="title">Reading.txt</span>
          <span class="zoom"></span>
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
        style:left={`${wins.nunotchi.x}px`}
        style:top={`${wins.nunotchi.y}px`}
        style:z-index={wins.nunotchi.z}
        style:width="270px"
        onpointerdown={() => focusWin("nunotchi")}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "nunotchi")} role="presentation">
          <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => closeWin("nunotchi")} aria-label="Close Nunotchi"></button>
          <span class="title">Nunotchi.app</span>
          <span class="zoom"></span>
        </div>
        <div class="win-body">
          <div class="lcd" data-mood={busy ?? "idle"}>
            <div class="lcd-status">
              <span aria-label="happiness">{hearts}</span>
              <span>age {age}</span>
            </div>

            {#if booting}
              <div class="lcd-boot">
                <img
                  src="/sprites/eggs.png"
                  alt="hatching egg"
                  class="egg-sprite"
                  style:--frame={hatchFrame}
                />
                <div class="boot-label">hatching · {hatchFrame}/4</div>
              </div>
            {:else}
              <div class="lcd-stage">
                <NunotchiGame pose={busy ?? "idle"} width={234} height={70} />
              </div>
              <div class="lcd-msg">{msg}</div>
            {/if}
          </div>

          <div class="hunger-row">
            <span class="muted">fed</span>
            <span class="bar">{hungerBar}</span>
            <span class="muted">hungry</span>
          </div>

          <div class="game-buttons">
            <button type="button" class="paper-btn" disabled={!!busy || booting} onclick={feed}>A · feed</button>
            <button type="button" class="paper-btn" disabled={!!busy || booting} onclick={play}>B · play</button>
            <button type="button" class="paper-btn solid" disabled={!!busy || booting} onclick={walk}>C · walk</button>
            <button type="button" class="paper-btn" disabled={!!busy || booting} onclick={nap} aria-label="Nap">z</button>
          </div>

          <div class="game-meta">
            <span>walks today: <b>{walks}</b></span>
            <span>energy: <b>{energy}%</b></span>
          </div>
        </div>
      </div>
    {/if}

    {#if wins.alert.open}
      <div
        class="paper-win alert"
        role="alertdialog"
        aria-label="Alert"
        style:left={`${wins.alert.x}px`}
        style:top={`${wins.alert.y}px`}
        style:z-index={wins.alert.z}
        style:width="280px"
        style:transform={`rotate(${wins.alert.rotate ?? 0}deg)`}
        onpointerdown={() => focusWin("alert")}
      >
        <div class="title-bar" onpointerdown={(e) => startDrag(e, "alert")} role="presentation">
          <span class="title">&nbsp;</span>
        </div>
        <div class="win-body alert-body">
          <div class="bang" aria-hidden="true">!</div>
          <div>
            Nuno is asking for a walk.<br />
            Proceed?
            <div class="alert-actions">
              <button type="button" class="paper-btn" onclick={() => closeWin("alert")}>Later</button>
              <button type="button" class="paper-btn solid" onclick={() => { closeWin("alert"); walk(); }}>OK</button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div class="desktop-icons">
      <button type="button" class="icon-btn" onclick={() => toggleWin("nunotchi")}>
        <span class="icon folder" aria-hidden="true"></span>
        <span class="icon-label">Nuno</span>
      </button>
      <button type="button" class="icon-btn" onclick={() => toggleWin("reading")}>
        <span class="icon folder" aria-hidden="true"></span>
        <span class="icon-label">Posts</span>
      </button>
      <button type="button" class="icon-btn" onclick={() => toggleWin("nowplaying")}>
        <span class="icon image" aria-hidden="true"></span>
        <span class="icon-label">Music</span>
      </button>
      <button type="button" class="icon-btn" aria-label="Trash (empty)" disabled>
        <span class="icon trash" aria-hidden="true"></span>
        <span class="icon-label">Trash</span>
      </button>
    </div>

    <div class="ask-bar">
      <form onsubmit={ask}>
        <span class="prompt">$</span>
        <input
          bind:value={askInput}
          placeholder="try: sit"
          aria-label="Terminal — type a command"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
        />
        <span class="enter">[↵]</span>
      </form>
      {#if askReply && !wins.currently.open}
        <div class="ask-reply">→ {askReply}</div>
      {/if}
    </div>

    <div class="menu-bar">
      <span class="menu-items">★ File · Edit · View · Special · ask nuno</span>
      <span class="clock">{now} · {clock}</span>
    </div>
  </div>
</div>

<style>
  .widget-frame {
    --ink: oklch(0.18 0.02 80);
    --paper: oklch(0.97 0.012 82);
    --dot: color-mix(in oklch, var(--ink) 16%, transparent);
    --ink-soft: color-mix(in oklch, var(--ink) 25%, transparent);
    --winShadow: 3px 3px 0 var(--ink);
    color: var(--ink);
    font-family: var(--font-mono);
    border: 1.5px solid var(--ink);
    background: color-mix(in oklch, var(--paper) 92%, var(--ink));
    box-shadow: var(--shadow-card-hover, 0 8px 24px rgba(0,0,0,0.08));
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
    background: var(--paper);
    border: 1.5px solid var(--ink);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    border-radius: 6px;
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
    touch-action: none;
  }

  .paper-win {
    position: absolute;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    box-shadow: var(--winShadow);
    color: var(--ink);
  }
  .paper-win.alert .title-bar { background: repeating-linear-gradient(var(--ink) 0 1px, transparent 1px 3px); }

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
  }
  .title-bar:active { cursor: grabbing; }
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
  }
  .close:hover { background: var(--ink); }
  .close:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
  .zoom { cursor: default; }

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
  .curr-fields > div { display: grid; grid-template-columns: 56px 1fr; gap: 8px; }
  .curr-fields dt {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.55;
    align-self: center;
  }
  .curr-fields dd { margin: 0; word-break: break-word; }
  .curr-cmd {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px dashed var(--ink-soft);
    font-size: 10px;
    line-height: 1.4;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: baseline;
  }
  .cmd-prompt { color: var(--color-accent); font-weight: 700; }
  .cmd-q { font-weight: 600; }
  .cmd-arrow { opacity: 0.6; }
  .cmd-reply { opacity: 0.85; }
  .cmd-hint { opacity: 0.55; font-style: italic; }

  /* ── Now Playing ── */
  .np-controls { display: flex; gap: 6px; align-items: center; font-size: 10px; }
  .np-track {
    margin-left: 4px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    background: var(--ink);
    transition: inset 0.4s linear;
  }
  .np-times {
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
  }
  .preview-tag { opacity: 0.6; font-style: italic; }
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
  .muted { opacity: 0.7; }

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
    font-size: 9px;
    z-index: 2;
  }
  .lcd-stage {
    position: absolute;
    inset: 18px 0 14px 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .lcd-msg {
    position: absolute;
    bottom: 2px;
    left: 6px;
    right: 6px;
    font-size: 9px;
    opacity: 0.7;
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
  .egg-sprite {
    width: 32px;
    height: 32px;
    object-fit: none;
    object-position: calc(var(--frame, 0) * -32px) -28px;
    image-rendering: pixelated;
    transform: scale(2);
    transform-origin: center;
  }
  .boot-label { font-size: 9px; opacity: 0.7; letter-spacing: 0.1em; }

  .hunger-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    font-size: 9px;
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
    font-size: 9px;
    margin-top: 6px;
    opacity: 0.85;
  }

  /* ── Alert ── */
  .alert-body {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .bang {
    width: 28px;
    height: 28px;
    border: 1.5px solid var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .alert-actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    justify-content: flex-end;
  }

  /* ── Paper buttons ── */
  .paper-btn {
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
  .icon-btn:hover .icon { background: color-mix(in oklch, var(--ink) 12%, var(--paper)); }
  .icon-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  .icon-btn[disabled] { opacity: 0.5; cursor: default; }
  .icon {
    width: 24px;
    height: 18px;
    border: 1.5px solid var(--ink);
    background: var(--paper);
    position: relative;
  }
  .icon.folder::before {
    content: "";
    position: absolute;
    top: -4px;
    left: 2px;
    width: 8px;
    height: 4px;
    border: 1.5px solid var(--ink);
    border-bottom: none;
    background: var(--paper);
  }
  .icon.image {
    background: var(--paper);
    background-image:
      linear-gradient(135deg, var(--ink) 25%, transparent 25%),
      linear-gradient(225deg, var(--ink) 25%, transparent 25%);
    background-size: 6px 6px;
    background-position: 0 0, 3px 0;
  }
  .icon.trash {
    width: 22px;
    height: 24px;
    border-top: none;
  }
  .icon.trash::before {
    content: "";
    position: absolute;
    top: -3px;
    left: -2px;
    right: -2px;
    height: 3px;
    background: var(--ink);
  }
  .icon-label {
    font-size: 10px;
    color: var(--ink);
    background: color-mix(in oklch, var(--paper) 70%, transparent);
    padding: 0 3px;
  }

  /* ── Terminal $ ask bar ── */
  .ask-bar {
    position: absolute;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    width: min(420px, calc(100% - 240px));
    background: var(--paper);
    border: 1.5px solid var(--ink);
    padding: 4px 10px;
    font-size: 11px;
    box-shadow: var(--winShadow);
  }
  .ask-bar form {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ask-bar .prompt { color: var(--color-accent); font-weight: 700; }
  .ask-bar input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink);
    min-width: 0;
  }
  .ask-bar .enter { font-size: 9px; opacity: 0.6; letter-spacing: 0.1em; }
  .ask-reply {
    margin-top: 4px;
    font-size: 10px;
    color: var(--color-text-secondary);
  }

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

  @media (max-width: 720px) {
    .surface { height: 80vh; }
    .ask-bar { width: calc(100% - 32px); }
    .desktop-icons { left: 12px; gap: 12px; }
  }
</style>
