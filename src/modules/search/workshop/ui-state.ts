const ENTER_MS = 500;

function withEnterAnimation(el: HTMLElement, currentTimer: number | null): number {
  if (currentTimer !== null) window.clearTimeout(currentTimer);
  el.setAttribute("data-entering", "");
  return window.setTimeout(() => {
    el.removeAttribute("data-entering");
  }, ENTER_MS);
}

export interface NunoController {
  show(): void;
  hide(): void;
}

export function createNunoController(el: HTMLElement | null): NunoController {
  let timer: number | null = null;
  return {
    show() {
      if (!el) return;
      const wasHidden = el.hasAttribute("hidden");
      el.removeAttribute("hidden");
      if (wasHidden) timer = withEnterAnimation(el, timer);
    },
    hide() {
      if (!el) return;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      el.removeAttribute("data-entering");
      el.setAttribute("hidden", "");
    },
  };
}

export interface ResultsController {
  showHtml(html: string): void;
  hide(): void;
}

export function createResultsController(el: HTMLElement): ResultsController {
  let timer: number | null = null;
  return {
    showHtml(html: string) {
      const wasHidden = el.hasAttribute("hidden");
      el.innerHTML = html;
      el.removeAttribute("hidden");
      if (wasHidden) timer = withEnterAnimation(el, timer);
    },
    hide() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      el.innerHTML = "";
      el.removeAttribute("data-entering");
      el.setAttribute("hidden", "");
    },
  };
}
