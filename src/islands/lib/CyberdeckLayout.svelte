<script lang="ts">
import type { Post } from "@modules/content";
import type { CurrentlyData } from "@modules/currently/schema";
import Desktop from "phosphor-svelte/lib/Desktop";
import FileText from "phosphor-svelte/lib/FileText";
import Notepad from "phosphor-svelte/lib/Notepad";
import PawPrint from "phosphor-svelte/lib/PawPrint";
import SpeakerSimpleHigh from "phosphor-svelte/lib/SpeakerSimpleHigh";
import SpeakerSimpleX from "phosphor-svelte/lib/SpeakerSimpleX";
import TerminalIcon from "phosphor-svelte/lib/Terminal";
import Trash from "phosphor-svelte/lib/Trash";
import VinylRecord from "phosphor-svelte/lib/VinylRecord";
import type { AudioState } from "./audio-source";
import CurrentlyCard from "./CurrentlyCard.svelte";
import type { Mood, TerminalEntry, WinId } from "./currently-types";
import NowPlayingCard from "./NowPlayingCard.svelte";
import NunotchiCard from "./NunotchiCard.svelte";
import type { LoopHandle } from "./NunotchiGame.svelte";
import type { NunotchiState } from "./nunotchi-state";
import PostsCard from "./PostsCard.svelte";
import ReadingCard from "./ReadingCard.svelte";
import TerminalCard from "./TerminalCard.svelte";
import type { WindowState } from "./window-state.svelte";

interface Props {
  data: CurrentlyData;
  pet: NunotchiState;
  hearts: string;
  hungerBar: string;
  busy: Mood | null;
  msg: string;
  mounted: boolean;
  compact?: boolean;
  clock: string;
  now: string;
  readingLine: string;
  trackLine: string;
  playable: boolean;
  audioState: AudioState;
  audioMounted: boolean;
  audioPos: number;
  audioDuration: number;
  audioRatio: number;
  audioHost?: HTMLDivElement;
  history: TerminalEntry[];
  askInput?: string;
  loopHandle?: LoopHandle | null;
  winState: WindowState;
  onFeed: () => void;
  onPlay: () => void;
  onWalk: () => void;
  onNap: () => void;
  onAsk: (e: Event) => void;
  onKonamiKey: (e: KeyboardEvent) => void;
  onRestart: () => void;
  onSkip: () => void | Promise<void>;
  onTogglePlay: () => void | Promise<void>;
  onSeekBar: (e: PointerEvent) => void | Promise<void>;
  onSeekArrow: (deltaSec: number) => void;
  soundMuted: boolean;
  onToggleMute: () => void;
  posts?: Post[];
  coarsePointer: boolean;
}

let {
  data,
  pet,
  hearts,
  hungerBar,
  busy,
  msg,
  mounted,
  compact = false,
  clock,
  now,
  readingLine,
  trackLine,
  playable,
  audioState,
  audioMounted,
  audioPos,
  audioDuration,
  audioRatio,
  audioHost = $bindable(),
  history,
  askInput = $bindable(""),
  loopHandle = $bindable(null),
  winState,
  onFeed,
  onPlay,
  onWalk,
  onNap,
  onAsk,
  onKonamiKey,
  onRestart,
  onSkip,
  onTogglePlay,
  onSeekBar,
  onSeekArrow,
  soundMuted,
  onToggleMute,
  posts = [],
  coarsePointer,
}: Props = $props();

const wins = $derived(winState.wins);

// The pocket layout splits windows into two zones: a *main* window (the big
// surface in the middle) and the *terminal* (a pinned strip above the dock).
// Terminal is a service for the Nunotchi game, so it must coexist with the
// main window. Main windows still hold a single-active invariant among
// themselves; tapping a main key swaps the main slot without touching the
// terminal slot.
const MAIN_IDS: readonly WinId[] = [
  "currently",
  "nunotchi",
  "reading",
  "nowplaying",
  "posts",
] as const;
const mainActiveId = $derived.by(() => {
  for (const id of MAIN_IDS) {
    if (wins[id].open) return id;
  }
  return null;
});
const terminalOpen = $derived(wins.terminal.open);

const KEY_LABELS: Record<WinId, string> = {
  currently: "System",
  nunotchi: "Nunotchi",
  reading: "Reading",
  nowplaying: "Music",
  terminal: "Terminal",
  posts: "WordCraft",
};

let dock = $state<HTMLDivElement | undefined>(undefined);

function focusKey(id: WinId) {
  // Defer one frame so the DOM reflects the new active state before focus lands.
  requestAnimationFrame(() => {
    dock?.querySelector<HTMLButtonElement>(`[data-key-id="${id}"]`)?.focus();
  });
}

function tapMain(id: WinId) {
  if (mainActiveId === id) {
    winState.pocketClose(id);
    focusKey(id);
  } else {
    winState.pocketSwap(id, MAIN_IDS);
  }
}

function tapTerminal() {
  if (terminalOpen) {
    winState.pocketClose("terminal");
    focusKey("terminal");
  } else {
    winState.pocketOpenOnly("terminal");
  }
}

function closeMain() {
  if (!mainActiveId) return;
  const id = mainActiveId;
  winState.pocketClose(id);
  focusKey(id);
}

function closeTerminal() {
  winState.pocketClose("terminal");
  focusKey("terminal");
}

const statusTag = $derived.by(() => {
  if (mainActiveId) return KEY_LABELS[mainActiveId].toUpperCase();
  if (terminalOpen) return KEY_LABELS.terminal.toUpperCase();
  return "HOME";
});
</script>

<div class="cyberdeck" role="region" aria-label="Cyberdeck">
  <div class="cyberdeck-top">
    <span class="cyberdeck-top-left">
      <button
        type="button"
        class="sound-toggle"
        aria-label={soundMuted ? "Unmute audio" : "Mute audio"}
        onclick={onToggleMute}
      >
        {#if soundMuted}
          <SpeakerSimpleX size={14} weight="regular" aria-hidden="true" />
        {:else}
          <SpeakerSimpleHigh size={14} weight="regular" aria-hidden="true" />
        {/if}
      </button>
      <span class="cyberdeck-brand">★ {now} · {clock}</span>
    </span>
    <span class="cyberdeck-status-tag" aria-live="polite">{statusTag}</span>
  </div>

  <div class="cyberdeck-stack" data-empty={mainActiveId === null}>
    {#if mainActiveId === "currently"}
      <div class="paper-win cyberdeck-card" role="group" aria-label="System">
        <div class="title-bar" role="presentation">
          <span class="title">System</span>
          <button type="button" class="cyberdeck-close" aria-label="Close System" onclick={closeMain}>×</button>
        </div>
        <div class="win-body curr-body">
          <CurrentlyCard {data} {pet} {hearts} />
        </div>
      </div>
    {:else if mainActiveId === "nunotchi"}
      <div class="paper-win cyberdeck-card" role="group" aria-label="Nunotchi" data-minimized={wins.nunotchi.minimized}>
        <div class="title-bar cyberdeck-title-bar" role="presentation">
          <span class="title">Nunotchi.app</span>
          <button
            type="button"
            class="cyberdeck-zoom"
            class:active={wins.nunotchi.minimized}
            aria-label={wins.nunotchi.minimized ? "Expand Nunotchi" : "Minimize Nunotchi"}
            aria-expanded={!wins.nunotchi.minimized}
            onclick={() => winState.minimizeWin("nunotchi")}
          >—</button>
          <button type="button" class="cyberdeck-close" aria-label="Close Nunotchi" onclick={closeMain}>×</button>
        </div>
        {#if !wins.nunotchi.minimized}
          <div class="win-body">
            <NunotchiCard {pet} {busy} {msg} {hearts} {hungerBar} {mounted} bind:loopHandle {onFeed} {onPlay} {onWalk} {onNap} />
          </div>
        {/if}
      </div>
    {:else if mainActiveId === "reading" && !compact}
      <div class="paper-win cyberdeck-card" role="group" aria-label="Reading">
        <div class="title-bar" role="presentation">
          <span class="title">Reading.txt</span>
          <button type="button" class="cyberdeck-close" aria-label="Close Reading" onclick={closeMain}>×</button>
        </div>
        <div class="win-body">
          <ReadingCard {readingLine} />
        </div>
      </div>
    {:else if mainActiveId === "nowplaying"}
      <div class="paper-win cyberdeck-card" role="group" aria-label="Now Playing">
        <div class="title-bar" role="presentation">
          <span class="title">Now Playing</span>
          <button type="button" class="cyberdeck-close" aria-label="Close Now Playing" onclick={closeMain}>×</button>
        </div>
        <div class="win-body">
          <NowPlayingCard
            {trackLine}
            fallbackDuration={data.music.duration}
            {playable}
            {audioState}
            {audioMounted}
            {audioPos}
            {audioDuration}
            {audioRatio}
            bind:audioHost
            {onRestart}
            {onSkip}
            {onTogglePlay}
            {onSeekBar}
            {onSeekArrow}
          />
        </div>
      </div>
    {:else if mainActiveId === "posts"}
      <div class="paper-win cyberdeck-card" role="group" aria-label="WordCraft" data-win="wordcraft">
        <div class="title-bar" role="presentation">
          <span class="title">WordCraft</span>
          <button type="button" class="cyberdeck-close" aria-label="Close WordCraft" onclick={closeMain}>×</button>
        </div>
        <div class="win-body">
          <PostsCard {posts} autoFocus={!coarsePointer} />
        </div>
      </div>
    {:else}
      <div class="cyberdeck-empty" aria-live="polite">
        <span class="cyberdeck-empty-glyph" aria-hidden="true">◆</span>
        <span class="cyberdeck-empty-hint">tap an icon ↓</span>
      </div>
    {/if}
  </div>

  {#if terminalOpen}
    <div class="paper-win cyberdeck-card cyberdeck-terminal-pane" role="group" aria-label="Terminal">
      <div class="title-bar" role="presentation">
        <span class="title">Terminal</span>
        <button type="button" class="cyberdeck-close" aria-label="Close Terminal" onclick={closeTerminal}>×</button>
      </div>
      <div class="win-body terminal-body">
        <TerminalCard {history} bind:askInput {onAsk} {onKonamiKey} />
      </div>
    </div>
  {/if}

  <div class="cyberdeck-dock" role="toolbar" aria-label="Apps" bind:this={dock}>
    <button
      type="button"
      class="cyberdeck-key"
      data-key-id="currently"
      data-active={mainActiveId === "currently"}
      aria-pressed={mainActiveId === "currently"}
      onclick={() => tapMain("currently")}
    >
      <Desktop size={18} weight="regular" aria-hidden="true" />
      <span class="cyberdeck-key-label">System</span>
    </button>
    <button
      type="button"
      class="cyberdeck-key"
      data-key-id="nunotchi"
      data-active={mainActiveId === "nunotchi"}
      aria-pressed={mainActiveId === "nunotchi"}
      onclick={() => tapMain("nunotchi")}
    >
      <PawPrint size={18} weight="regular" aria-hidden="true" />
      <span class="cyberdeck-key-label">Nunotchi</span>
    </button>
    {#if !compact}
      <button
        type="button"
        class="cyberdeck-key"
        data-key-id="reading"
        data-active={mainActiveId === "reading"}
        aria-pressed={mainActiveId === "reading"}
        onclick={() => tapMain("reading")}
      >
        <FileText size={18} weight="regular" aria-hidden="true" />
        <span class="cyberdeck-key-label">Reading</span>
      </button>
    {/if}
    <button
      type="button"
      class="cyberdeck-key"
      data-key-id="nowplaying"
      data-active={mainActiveId === "nowplaying"}
      aria-pressed={mainActiveId === "nowplaying"}
      onclick={() => tapMain("nowplaying")}
    >
      <VinylRecord size={18} weight="regular" aria-hidden="true" />
      <span class="cyberdeck-key-label">Music</span>
    </button>
    <button
      type="button"
      class="cyberdeck-key"
      data-key-id="posts"
      data-active={mainActiveId === "posts"}
      aria-pressed={mainActiveId === "posts"}
      onclick={() => tapMain("posts")}
    >
      <Notepad size={18} weight="regular" aria-hidden="true" />
      <span class="cyberdeck-key-label">WordCraft</span>
    </button>
    <button
      type="button"
      class="cyberdeck-key"
      data-key-id="terminal"
      data-active={terminalOpen}
      aria-pressed={terminalOpen}
      onclick={tapTerminal}
    >
      <TerminalIcon size={18} weight="regular" aria-hidden="true" />
      <span class="cyberdeck-key-label">Terminal</span>
    </button>
    <button type="button" class="cyberdeck-key" data-key-id="trash" aria-label="Trash (empty)" disabled>
      <Trash size={18} weight="regular" aria-hidden="true" />
      <span class="cyberdeck-key-label">Trash</span>
    </button>
  </div>
</div>
