<script lang="ts">
import type { Post } from "@modules/content";
import type { CurrentlyData } from "@modules/currently/schema";
import FileText from "phosphor-svelte/lib/FileText";
import Notepad from "phosphor-svelte/lib/Notepad";
import PawPrint from "phosphor-svelte/lib/PawPrint";
import SpeakerSimpleHigh from "phosphor-svelte/lib/SpeakerSimpleHigh";
import SpeakerSimpleX from "phosphor-svelte/lib/SpeakerSimpleX";
import Terminal from "phosphor-svelte/lib/Terminal";
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
import { paperClose, paperOpen } from "./paper-anim";
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
  reduced: boolean;
  compact: boolean;
  coarsePointer: boolean;
  clock: string;
  readingLine: string;
  trackLine: string;
  playable: boolean;
  audioState: AudioState;
  audioMounted: boolean;
  audioPos: number;
  audioDuration: number;
  audioRatio: number;
  audioHost?: HTMLDivElement;
  surface?: HTMLDivElement;
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
}

let {
  data,
  pet,
  hearts,
  hungerBar,
  busy,
  msg,
  mounted,
  reduced,
  compact,
  coarsePointer,
  clock,
  readingLine,
  trackLine,
  playable,
  audioState,
  audioMounted,
  audioPos,
  audioDuration,
  audioRatio,
  audioHost = $bindable(),
  surface = $bindable(),
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
}: Props = $props();

const wins = $derived(winState.wins);
</script>

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
      onpointerdown={() => winState.focusWin("currently")}
      in:paperOpen={{ reduced }}
      out:paperClose={{ reduced }}
    >
      <div class="title-bar" onpointerdown={(e) => winState.startDrag(e, "currently", surface)} role="presentation">
        <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => winState.closeWin("currently", surface)} aria-label="Close System"></button>
        <span class="title">System</span>
        <button
          type="button"
          class="zoom"
          class:active={wins.currently.minimized}
          aria-label={wins.currently.minimized ? "Expand System" : "Minimize System"}
          aria-expanded={!wins.currently.minimized}
          onpointerdown={(e) => e.stopPropagation()}
          onclick={() => winState.minimizeWin("currently")}
        ></button>
      </div>
      <div class="win-body curr-body">
        <CurrentlyCard {data} {pet} {hearts} />
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
      onpointerdown={() => winState.focusWin("nowplaying")}
      in:paperOpen={{ reduced }}
      out:paperClose={{ reduced }}
    >
      <div class="title-bar" onpointerdown={(e) => winState.startDrag(e, "nowplaying", surface)} role="presentation">
        <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => winState.closeWin("nowplaying", surface)} aria-label="Close Now Playing"></button>
        <span class="title">Now Playing</span>
        <button
          type="button"
          class="zoom"
          class:active={wins.nowplaying.minimized}
          aria-label={wins.nowplaying.minimized ? "Expand Now Playing" : "Minimize Now Playing"}
          aria-expanded={!wins.nowplaying.minimized}
          onpointerdown={(e) => e.stopPropagation()}
          onclick={() => winState.minimizeWin("nowplaying")}
        ></button>
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
      onpointerdown={() => winState.focusWin("reading")}
      in:paperOpen={{ reduced, rotate: wins.reading.rotate ?? 0 }}
      out:paperClose={{ reduced, rotate: wins.reading.rotate ?? 0 }}
    >
      <div class="title-bar" onpointerdown={(e) => winState.startDrag(e, "reading", surface)} role="presentation">
        <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => winState.closeWin("reading", surface)} aria-label="Close Reading"></button>
        <span class="title">Reading.txt</span>
        <button
          type="button"
          class="zoom"
          class:active={wins.reading.minimized}
          aria-label={wins.reading.minimized ? "Expand Reading" : "Minimize Reading"}
          aria-expanded={!wins.reading.minimized}
          onpointerdown={(e) => e.stopPropagation()}
          onclick={() => winState.minimizeWin("reading")}
        ></button>
      </div>
      <div class="win-body">
        <ReadingCard {readingLine} />
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
      onpointerdown={() => winState.focusWin("nunotchi")}
      in:paperOpen={{ reduced }}
      out:paperClose={{ reduced }}
    >
      <div class="title-bar" onpointerdown={(e) => winState.startDrag(e, "nunotchi", surface)} role="presentation">
        <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => winState.closeWin("nunotchi", surface)} aria-label="Close Nunotchi"></button>
        <span class="title">Nunotchi.app</span>
        <button
          type="button"
          class="zoom"
          class:active={wins.nunotchi.minimized}
          aria-label={wins.nunotchi.minimized ? "Expand Nunotchi" : "Minimize Nunotchi"}
          aria-expanded={!wins.nunotchi.minimized}
          onpointerdown={(e) => e.stopPropagation()}
          onclick={() => winState.minimizeWin("nunotchi")}
        ></button>
      </div>
      <div class="win-body">
        <NunotchiCard {pet} {busy} {msg} {hearts} {hungerBar} {mounted} bind:loopHandle {onFeed} {onPlay} {onWalk} {onNap} />
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
      onpointerdown={() => winState.focusWin("terminal")}
      in:paperOpen={{ reduced }}
      out:paperClose={{ reduced }}
    >
      <div class="title-bar" onpointerdown={(e) => winState.startDrag(e, "terminal", surface)} role="presentation">
        <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => winState.closeWin("terminal", surface)} aria-label="Close Terminal"></button>
        <span class="title">Terminal</span>
        <button
          type="button"
          class="zoom"
          class:active={wins.terminal.minimized}
          aria-label={wins.terminal.minimized ? "Expand Terminal" : "Minimize Terminal"}
          aria-expanded={!wins.terminal.minimized}
          onpointerdown={(e) => e.stopPropagation()}
          onclick={() => winState.minimizeWin("terminal")}
        ></button>
      </div>
      <div class="win-body terminal-body">
        <TerminalCard {history} bind:askInput {onAsk} {onKonamiKey} />
      </div>
    </div>
  {/if}
  {#if wins.posts.open}
    <div
      class="paper-win"
      role="group"
      aria-label="WordCraft"
      data-minimized={wins.posts.minimized}
      style:left={`${wins.posts.x}px`}
      style:top={`${wins.posts.y}px`}
      style:z-index={wins.posts.z}
      style:width="280px"
      onpointerdown={() => winState.focusWin("posts")}
      in:paperOpen={{ reduced }}
      out:paperClose={{ reduced }}
    >
      <div class="title-bar" onpointerdown={(e) => winState.startDrag(e, "posts", surface)} role="presentation">
        <button type="button" class="close" onpointerdown={(e) => e.stopPropagation()} onclick={() => winState.closeWin("posts", surface)} aria-label="Close WordCraft"></button>
        <span class="title">WordCraft</span>
        <button
          type="button"
          class="zoom"
          class:active={wins.posts.minimized}
          aria-label={wins.posts.minimized ? "Expand WordCraft" : "Minimize WordCraft"}
          aria-expanded={!wins.posts.minimized}
          onpointerdown={(e) => e.stopPropagation()}
          onclick={() => winState.minimizeWin("posts")}
        ></button>
      </div>
      <div class="win-body">
        <PostsCard {posts} />
      </div>
    </div>
  {/if}

  <div class="desktop-icons">
    <button type="button" class="icon-btn" onclick={() => winState.toggleWin("nunotchi")}>
      <PawPrint size={20} weight="regular" aria-hidden="true" />
      <span class="icon-label">Nunotchi</span>
    </button>
    {#if !compact}
      <button type="button" class="icon-btn" onclick={() => winState.toggleWin("reading")}>
        <FileText size={18} weight="regular" aria-hidden="true" />
        <span class="icon-label">Reading.txt</span>
      </button>
    {/if}
    <button type="button" class="icon-btn" onclick={() => winState.toggleWin("nowplaying")}>
      <VinylRecord size={20} weight="regular" aria-hidden="true" />
      <span class="icon-label">Music</span>
    </button>
    <button type="button" class="icon-btn" onclick={() => winState.toggleWin("terminal")}>
      <Terminal size={20} weight="regular" aria-hidden="true" />
      <span class="icon-label">Terminal</span>
    </button>
    <button type="button" class="icon-btn" onclick={() => winState.toggleWin("posts")}>
      <Notepad size={20} weight="regular" aria-hidden="true" />
      <span class="icon-label">WordCraft</span>
    </button>
    <button type="button" class="icon-btn" aria-label="Trash (empty)" disabled>
      <Trash size={20} weight="regular" aria-hidden="true" />
      <span class="icon-label">Trash</span>
    </button>
  </div>

  <div class="menu-bar">
    <span class="menu-items">★ File · Edit · View</span>
    <span class="menu-right">
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
      <span class="clock">{clock || "—"}</span>
    </span>
  </div>
</div>
