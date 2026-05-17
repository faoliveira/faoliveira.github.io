<script lang="ts">
import { formatDate, toISODateString } from "@modules/content/format-date";
import type { Post } from "@modules/content/types";
import { onDestroy, onMount } from "svelte";

interface Props {
  posts: Post[];
  autoFocus?: boolean;
}

let { posts, autoFocus = false }: Props = $props();

let query = $state("");
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let debouncedQuery = $state("");
let searchEl = $state<HTMLInputElement | undefined>(undefined);

function onInput(e: Event) {
  query = (e.target as HTMLInputElement).value;
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    debouncedQuery = query;
  }, 300);
}

const filtered = $derived.by(() => {
  const q = debouncedQuery.trim().toLowerCase();
  if (!q) return posts;
  return posts.filter((post) => {
    const title = post.data.title.toLowerCase();
    const description = post.data.description?.toLowerCase() ?? "";
    return title.includes(q) || description.includes(q);
  });
});

const isFiltering = $derived(debouncedQuery.trim().length > 0);
const statusMessage = $derived(
  posts.length === 0
    ? "No posts yet."
    : filtered.length === 0
      ? "No matches."
      : `${filtered.length} ${filtered.length === 1 ? "post" : "posts"}.`,
);

function toDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  const parsed = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

onMount(() => {
  if (autoFocus) searchEl?.focus();
});

onDestroy(() => {
  if (timeoutId) clearTimeout(timeoutId);
});
</script>

<div class="posts-card">
  <input
    bind:this={searchEl}
    type="search"
    class="posts-search"
    placeholder="search…"
    aria-label="Search posts"
    autocomplete="off"
    spellcheck="false"
    value={query}
    oninput={onInput}
  />
  <p class="posts-status" role="status" aria-live="polite">{statusMessage}</p>
  <ul class="posts-list" aria-label="Posts">
    {#if filtered.length === 0}
      <li class="posts-empty">
        <span class="posts-empty-mark" aria-hidden="true">∅</span>
        <span class="posts-empty-text">
          {isFiltering ? "No matches for that search." : "No posts yet."}
        </span>
      </li>
    {:else}
      {#each filtered as post (post.id)}
        {@const date = toDate(post.data.date)}
        <li>
          <a class="posts-row" href={`/posts/${post.id}/`}>
            <span class="posts-title">{post.data.title}</span>
            {#if date}
              <time class="posts-meta" datetime={toISODateString(date)}>
                {formatDate(date)}
              </time>
            {/if}
          </a>
        </li>
      {/each}
    {/if}
  </ul>
</div>
