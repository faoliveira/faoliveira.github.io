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
let searching = $state(false);
let searchEl = $state<HTMLInputElement | undefined>(undefined);
let helpVisible = $state(false);
let helpTimeout: ReturnType<typeof setTimeout> | null = null;

function onInput(e: Event) {
  query = (e.target as HTMLInputElement).value;
  searching = true;
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    debouncedQuery = query;
    searching = false;
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
    ? "No texts yet."
    : filtered.length === 0
      ? "No matches."
      : `${filtered.length} ${filtered.length === 1 ? "text" : "texts"}.`,
);

function toDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  const parsed = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function focusSearch() {
  searchEl?.focus();
}

function clearSearch() {
  query = "";
  debouncedQuery = "";
  searchEl?.focus();
}

function showHelp() {
  helpVisible = true;
  if (helpTimeout) clearTimeout(helpTimeout);
  helpTimeout = setTimeout(() => {
    helpVisible = false;
  }, 3000);
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "/" && document.activeElement !== searchEl) {
    e.preventDefault();
    focusSearch();
  }
  if (e.key === "Escape" && document.activeElement === searchEl) {
    if (query) {
      clearSearch();
    } else {
      searchEl?.blur();
    }
  }
}

onMount(() => {
  if (autoFocus) searchEl?.focus();
});

onDestroy(() => {
  if (timeoutId) clearTimeout(timeoutId);
  if (helpTimeout) clearTimeout(helpTimeout);
});
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="posts-card">
  <div class="wc-toolbar" role="toolbar" aria-label="WordCraft menu">
    <a href="/posts/" class="wc-menu-item">File</a>
    <button type="button" class="wc-menu-item" onclick={focusSearch}>Search</button>
    <button type="button" class="wc-menu-item" onclick={showHelp}>Help</button>
  </div>

  <div class="wc-cmdline">
    <span class="wc-prompt" aria-hidden="true">&gt;</span>
    <input
      bind:this={searchEl}
      type="search"
      class="posts-search"
      placeholder="search documents…"
      aria-label="Search posts"
      autocomplete="off"
      spellcheck="false"
      value={query}
      oninput={onInput}
    />
  </div>

  <div class="wc-ruler" aria-hidden="true"></div>

  <p class="posts-status" role="status" aria-live="polite" aria-busy={searching}>
    {#if helpVisible}
      <span class="posts-status-help">Type to filter. Click a title to open.</span>
    {:else}
      {statusMessage}
    {/if}
  </p>

  <ul class="posts-list" aria-label="Posts" aria-busy={searching}>
    {#if filtered.length === 0}
      <li class="posts-empty">
        <span class="posts-empty-mark" aria-hidden="true">∅</span>
        <span class="posts-empty-text">
          {isFiltering ? "No matches for that search." : "No texts yet."}
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

  <div class="wc-statusbar" role="status" aria-label="Editor status">
    <span class="wc-status-right">{filtered.length}/{posts.length} texts</span>
  </div>
</div>
