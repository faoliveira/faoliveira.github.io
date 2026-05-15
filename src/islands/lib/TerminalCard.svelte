<script lang="ts">
import type { TerminalEntry } from "./currently-types";

interface Props {
  history: TerminalEntry[];
  askInput?: string;
  onAsk: (e: Event) => void;
  onKonamiKey: (e: KeyboardEvent) => void;
}

let { history, askInput = $bindable(""), onAsk, onKonamiKey }: Props = $props();
</script>

<div class="terminal-scroll">
  {#each history as entry, i (`${i}:${entry.q}`)}
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
<form class="terminal-form" onsubmit={onAsk}>
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
