<script lang="ts">
interface Props {
  label?: string;
  initialCount?: number;
}

let { label = "Counter", initialCount = 0 }: Props = $props();

let count = $state(Number.isFinite(initialCount) ? initialCount : 0);

function increment() {
  count++;
}

function decrement() {
  count--;
}
</script>

<div class="counter">
  <p class="counter-label">{label}</p>
  <p class="counter-display">{count}</p>
  <div class="counter-controls">
    <button onclick={decrement} aria-label="Decrement {label || 'counter'}">−</button>
    <button onclick={increment} aria-label="Increment {label || 'counter'}">+</button>
  </div>
</div>

<style>
  .counter {
    background: var(--color-surface-alt);
    padding: var(--ma-base);
    border-radius: 6px;
    border: 1px solid var(--color-border);
    text-align: center;
    max-width: 240px;
    margin: var(--ma-base) auto;
  }

  .counter-label {
    margin: 0 0 var(--ma-narrow);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .counter-display {
    margin: 0 0 var(--ma-base);
    font-size: var(--type-3xl);
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1;
  }

  .counter-controls {
    display: flex;
    gap: var(--ma-narrow);
    justify-content: center;
  }

  button {
    background: var(--color-accent);
    color: var(--color-surface);
    border: none;
    border-radius: 4px;
    width: 44px;
    height: 44px;
    font-size: 1.25rem;
    cursor: pointer;
    transition: background var(--motion-duration-quick) var(--motion-easing-out),
      outline-color var(--motion-duration-quick) var(--motion-easing-out);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button:hover {
    background: var(--color-accent-hover);
  }

  button:active {
    background: var(--color-accent-hover);
    scale: 0.95;
  }

  button:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
</style>
