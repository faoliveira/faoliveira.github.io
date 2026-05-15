<script lang="ts">
import type { Mood } from "./currently-types";
import NunotchiGame, { type LoopHandle } from "./NunotchiGame.svelte";
import type { NunotchiState } from "./nunotchi-state";

interface Props {
  pet: NunotchiState;
  busy: Mood | null;
  msg: string;
  hearts: string;
  hungerBar: string;
  mounted: boolean;
  loopHandle?: LoopHandle | null;
  onFeed: () => void;
  onPlay: () => void;
  onWalk: () => void;
  onNap: () => void;
}

let {
  pet,
  busy,
  msg,
  hearts,
  hungerBar,
  mounted,
  loopHandle = $bindable(null),
  onFeed,
  onPlay,
  onWalk,
  onNap,
}: Props = $props();
</script>

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
  <button type="button" class="paper-btn" disabled={!!busy} onclick={onFeed}>A · feed</button>
  <button type="button" class="paper-btn" disabled={!!busy} onclick={onPlay}>B · play</button>
  <button type="button" class="paper-btn solid" disabled={!!busy} onclick={onWalk}>C · walk</button>
  <button type="button" class="paper-btn" disabled={!!busy} onclick={onNap} aria-label="Nap">z</button>
</div>

<div class="game-meta">
  <span>walks today: <b>{pet.walks}</b></span>
  <span>energy: <b>{pet.energy}%</b></span>
</div>
