import type { Win, WinId } from "./currently-types";

const INITIAL_WINS: Record<WinId, Win> = {
  currently: { x: 24, y: 28, z: 1, open: true, minimized: false },
  nowplaying: { x: 380, y: 22, z: 2, open: true, minimized: false },
  reading: { x: 28, y: 320, z: 3, rotate: -1.5, open: true, minimized: false },
  nunotchi: { x: 410, y: 220, z: 4, open: true, minimized: false },
  terminal: { x: 24, y: 260, z: 5, open: true, minimized: false },
};

const ICON_LABELS: Partial<Record<WinId, string>> = {
  nunotchi: "Nunotchi",
  reading: "Reading.txt",
  nowplaying: "Music",
  terminal: "Terminal",
};

function focusIcon(surface: HTMLElement | null | undefined, label: string) {
  if (!surface) return;
  const icons = surface.querySelectorAll(".icon-btn");
  for (const btn of icons) {
    if (btn.querySelector(".icon-label")?.textContent?.trim() === label) {
      (btn as HTMLElement).focus();
      return;
    }
  }
  surface.focus();
}

export interface WindowState {
  readonly wins: Record<WinId, Win>;
  focusWin(id: WinId): void;
  startDrag(e: PointerEvent, id: WinId, surface: HTMLElement | undefined): void;
  onDragMove(e: PointerEvent): void;
  onDragEnd(): void;
  closeWin(id: WinId, surface: HTMLElement | undefined): void;
  toggleWin(id: WinId): void;
  minimizeWin(id: WinId): void;
  resetDesktop(innerWidth: number): void;
  resetDragState(): void;
  /** Cyberdeck: open one window, close every other. Single-window invariant on mobile. */
  pocketOpen(id: WinId): void;
  /** Cyberdeck: open `id` and close every id in `closeOthers`. Terminal stays parked. */
  pocketSwap(id: WinId, closeOthers: readonly WinId[]): void;
  /** Cyberdeck: close one window without focus redirect. */
  pocketClose(id: WinId): void;
  /** Cyberdeck: open one window without disturbing the rest. */
  pocketOpenOnly(id: WinId): void;
  /** Cyberdeck: close all windows, returning to the empty home screen. */
  pocketHome(): void;
  /** Branch swap: enforce single-window invariant on entry to the pocket layout. */
  enterCyberdeck(): void;
  /** Branch swap: restore all-open default when returning to the desktop layout. */
  enterDesktop(): void;
}

export function createWindowState(opts: { coarsePointer: () => boolean }): WindowState {
  const wins = $state<Record<WinId, Win>>(structuredClone(INITIAL_WINS));
  let topZ = $state(20);
  let dragId: WinId | null = null;
  let dragOffset = { x: 0, y: 0 };
  let surfaceRect: DOMRect | null = null;

  function focusWin(id: WinId) {
    topZ += 1;
    wins[id].z = topZ;
  }

  // Drag is decorative — keyboard users reach every action via close buttons,
  // in-window controls, and the terminal.
  function startDrag(e: PointerEvent, id: WinId, surface: HTMLElement | undefined) {
    if (e.button !== 0 || opts.coarsePointer()) return;
    dragId = id;
    focusWin(id);
    surfaceRect = surface?.getBoundingClientRect() ?? null;
    const w = wins[id];
    dragOffset = { x: e.clientX - w.x, y: e.clientY - w.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: PointerEvent) {
    if (opts.coarsePointer() || !dragId) return;
    const nx = e.clientX - dragOffset.x;
    const ny = e.clientY - dragOffset.y;
    if (surfaceRect) {
      wins[dragId].x = Math.max(-40, Math.min(surfaceRect.width - 60, nx));
      wins[dragId].y = Math.max(-4, Math.min(surfaceRect.height - 40, ny));
    } else {
      wins[dragId].x = nx;
      wins[dragId].y = ny;
    }
  }

  function onDragEnd() {
    if (opts.coarsePointer() || !dragId) return;
    dragId = null;
    surfaceRect = null;
  }

  function closeWin(id: WinId, surface: HTMLElement | undefined) {
    wins[id].open = false;
    const label = ICON_LABELS[id];
    if (label) focusIcon(surface ?? null, label);
    else surface?.focus();
  }

  function toggleWin(id: WinId) {
    wins[id].open = !wins[id].open;
    if (wins[id].open) {
      wins[id].minimized = false;
      focusWin(id);
    }
  }

  function minimizeWin(id: WinId) {
    wins[id].minimized = !wins[id].minimized;
    if (!wins[id].minimized) focusWin(id);
  }

  function resetDesktop(innerWidth: number) {
    const fresh = structuredClone(INITIAL_WINS);
    if (innerWidth > 0) {
      for (const k of Object.keys(fresh) as WinId[]) {
        fresh[k].x = Math.min(fresh[k].x, Math.max(8, innerWidth - 100));
      }
    }
    for (const k of Object.keys(fresh) as WinId[]) {
      wins[k] = fresh[k];
    }
    topZ = 20;
  }

  function resetDragState() {
    dragId = null;
    surfaceRect = null;
  }

  // ── Cyberdeck (pocket-organizer) helpers ────────────────────────────────────
  // The mobile layout enforces a single-window invariant: tapping a dock key
  // closes whatever window is open and opens the target. Closing the active
  // window falls to an empty home screen — the dock stays visible.

  function pocketOpen(id: WinId) {
    for (const k of Object.keys(wins) as WinId[]) {
      if (k !== id) wins[k].open = false;
    }
    wins[id].open = true;
    wins[id].minimized = false;
    focusWin(id);
  }

  function pocketSwap(id: WinId, closeOthers: readonly WinId[]) {
    for (const k of closeOthers) {
      if (k !== id) wins[k].open = false;
    }
    wins[id].open = true;
    wins[id].minimized = false;
    focusWin(id);
  }

  function pocketOpenOnly(id: WinId) {
    wins[id].open = true;
    wins[id].minimized = false;
    focusWin(id);
  }

  function pocketClose(id: WinId) {
    wins[id].open = false;
  }

  function pocketHome() {
    for (const k of Object.keys(wins) as WinId[]) {
      wins[k].open = false;
    }
  }

  function enterCyberdeck() {
    // The shared wins state is initialized all-open for the desktop layout.
    // When entering the pocket layout, normalize to just `currently` so the
    // mobile mount lands on the System screen instead of cycling through
    // whichever window happens to be first in the iteration order.
    for (const k of Object.keys(wins) as WinId[]) {
      if (k === "currently") {
        wins[k].open = true;
        wins[k].minimized = false;
      } else {
        wins[k].open = false;
      }
    }
  }

  function enterDesktop() {
    for (const k of Object.keys(wins) as WinId[]) {
      wins[k].open = true;
    }
  }

  return {
    get wins() {
      return wins;
    },
    focusWin,
    startDrag,
    onDragMove,
    onDragEnd,
    closeWin,
    toggleWin,
    minimizeWin,
    resetDesktop,
    resetDragState,
    pocketOpen,
    pocketSwap,
    pocketOpenOnly,
    pocketClose,
    pocketHome,
    enterCyberdeck,
    enterDesktop,
  };
}
