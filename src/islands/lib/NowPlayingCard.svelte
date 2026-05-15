<script lang="ts">
import type { AudioState } from "./audio-source";
import { fmtSpoken, fmtTime } from "./audio-format";

interface Props {
  trackLine: string;
  fallbackDuration: string;
  playable: boolean;
  audioState: AudioState;
  audioMounted: boolean;
  audioPos: number;
  audioDuration: number;
  audioRatio: number;
  audioHost?: HTMLDivElement;
  onRestart: () => void;
  onSkip: () => void | Promise<void>;
  onTogglePlay: () => void | Promise<void>;
  onSeekBar: (e: PointerEvent) => void | Promise<void>;
  onSeekArrow: (deltaSec: number) => void;
}

let {
  trackLine,
  fallbackDuration,
  playable,
  audioState,
  audioMounted,
  audioPos,
  audioDuration,
  audioRatio,
  audioHost = $bindable(),
  onRestart,
  onSkip,
  onTogglePlay,
  onSeekBar,
  onSeekArrow,
}: Props = $props();
</script>

<div class="np-controls">
  <button type="button" class="paper-btn" aria-label="Restart" disabled={!playable} onclick={onRestart}>◀◀</button>
  <button
    type="button"
    class="paper-btn solid"
    aria-label={audioState.playing ? "Pause" : "Play"}
    disabled={!playable}
    onclick={onTogglePlay}
  >
    {audioState.playing ? "⏸" : "▶"}
  </button>
  <button type="button" class="paper-btn" aria-label="Skip" disabled={!playable} onclick={onSkip}>▶▶</button>
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
  aria-valuetext={audioMounted ? `${fmtSpoken(audioPos)} of ${fmtSpoken(audioDuration)}` : "audio not loaded"}
  tabindex={playable ? 0 : -1}
  onpointerdown={onSeekBar}
  onkeydown={(e) => {
    if (!playable) return;
    if (e.key === "ArrowRight") onSeekArrow(5);
    else if (e.key === "ArrowLeft") onSeekArrow(-5);
    else return;
    e.preventDefault();
  }}
>
  <div style:transform={`scaleX(${audioRatio})`}></div>
</div>
<div class="np-times">
  <span>{audioMounted ? fmtTime(audioPos) : "0:00"}</span>
  <span>
    {audioMounted ? fmtTime(audioDuration) : fallbackDuration}
    {#if audioState.preview}<span class="preview-tag"> · preview</span>{/if}
  </span>
</div>
<div class="audio-host" bind:this={audioHost} aria-hidden="true"></div>
