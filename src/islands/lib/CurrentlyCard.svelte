<script lang="ts">
import type { CurrentlyData } from "@modules/currently/schema";
import type { NunotchiState } from "./nunotchi-state";

interface Props {
  data: CurrentlyData;
  pet: NunotchiState;
  hearts: string;
}

let { data, pet, hearts }: Props = $props();
</script>

<dl class="curr-fields">
  <div><dt>mood</dt><dd>{data.mood}</dd></div>
  <div><dt>reading</dt><dd><i>{data.reading.title.toLowerCase()}</i> — {data.reading.author.toLowerCase()}{#if data.reading.page} · p.{data.reading.page}{/if}</dd></div>
  <div><dt>music</dt><dd>{data.music.artist.toLowerCase()} · {data.music.title.toLowerCase()}</dd></div>
  <div><dt>tabs</dt><dd>{data.tabs} (halp)</dd></div>
  <div><dt>status</dt><dd>{data.status}</dd></div>
  <div><dt>nuno</dt><dd>{hearts} · ⚡{pet.energy}% · {pet.walks} walks today</dd></div>
</dl>
