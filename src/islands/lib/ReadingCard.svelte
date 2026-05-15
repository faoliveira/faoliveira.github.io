<script lang="ts">
interface Props {
  readingLine: string;
}

let { readingLine }: Props = $props();
</script>

<div class="reading-body">
  <b>{readingLine}</b>
</div>
