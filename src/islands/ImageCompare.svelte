<script lang="ts">
interface Props {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;
  afterLabel?: string;
}

let {
  before,
  after,
  beforeAlt,
  afterAlt,
  beforeLabel = "Before",
  afterLabel = "After",
}: Props = $props();

let position = $state(50); // percentage 0-100
let dragging = $state(false);
let containerEl: HTMLDivElement | undefined = $state();

function handlePointerDown(e: PointerEvent) {
  dragging = true;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

// All pointer events are on the divider (the capture element), so
// pointerup/pointermove/pointercancel fire here even when pointer moves outside
function handlePointerUp() {
  dragging = false;
}

function handlePointerCancel() {
  dragging = false;
}

function handlePointerMove(e: PointerEvent) {
  if (!dragging || !containerEl) return;
  const rect = containerEl.getBoundingClientRect();
  if (rect.width === 0) return; // guard: avoid NaN on hidden/zero-width container
  position = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowLeft") position = Math.max(0, position - 5);
  if (e.key === "ArrowRight") position = Math.min(100, position + 5);
  if (e.key === "Home") {
    e.preventDefault();
    position = 0;
  }
  if (e.key === "End") {
    e.preventDefault();
    position = 100;
  }
}
</script>

<div class="compare" bind:this={containerEl} aria-label="Image comparison">
  <!-- after-image is the base layer and sets container height -->
  <img class="compare-img compare-img--after" src={after} alt={afterAlt} loading="lazy" />
  <span class="compare-label compare-label--after">{afterLabel}</span>

  <!-- before-image is absolutely positioned on top, clipped to reveal -->
  <div class="compare-before" style="clip-path: inset(0 {100 - position}% 0 0)">
    <img class="compare-img compare-img--before" src={before} alt={beforeAlt} loading="lazy" />
    <span class="compare-label compare-label--before">{beforeLabel}</span>
  </div>

  <div
    class="compare-divider"
    style="left: {position}%"
    role="slider"
    aria-label="Image comparison slider"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(position)}
    aria-valuetext="{Math.round(position)}% revealed"
    tabindex="0"
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerCancel}
    onpointermove={handlePointerMove}
    onkeydown={handleKeydown}
  >
    <div class="compare-handle">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
        <path d="M7 4l-4 6 4 6M13 4l4 6-4 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</div>

<style>
  .compare {
    position: relative;
    overflow: hidden;
    border-radius: 2px;
    cursor: col-resize;
    user-select: none;
    touch-action: none;
  }

  .compare-img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* before-image: absolute overlay, matches container height via inset */
  .compare-before {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .compare-before .compare-img--before {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .compare-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-accent);
    transform: translateX(-50%);
    cursor: col-resize;
  }

  .compare-divider:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
  }

  .compare-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-surface-alt);
    border: 2px solid var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
  }

  .compare-label {
    position: absolute;
    bottom: var(--ma-narrow);
    font-size: var(--type-xs);
    font-family: var(--font-mono);
    background: oklch(0 0 0 / 0.6);
    color: oklch(1 0 0);
    padding: 2px var(--ma-narrow);
    border-radius: 2px;
  }

  .compare-label--before {
    left: var(--ma-narrow);
  }

  .compare-label--after {
    right: var(--ma-narrow);
  }
</style>
