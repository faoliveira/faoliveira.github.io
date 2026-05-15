/**
 * Pure persistence + decay helpers for the Nunotchi.app mini-game.
 * Storage-agnostic — pass `localStorage` (or a mock) as the first arg.
 */

export interface NunotchiState {
  hp: number;
  hunger: number;
  energy: number;
  age: number;
  walks: number;
  lastSeen: number;
}

export const STORAGE_KEY = "koubou.nunotchi.state.v1";

export const DEFAULTS: Readonly<NunotchiState> = Object.freeze({
  hp: 3,
  hunger: 2,
  energy: 48,
  age: 4,
  walks: 2,
  lastSeen: 0,
});

const STEP_HUNGER_MS = 8 * 60 * 1000;
const STEP_ENERGY_MS = 4 * 60 * 1000;
const STEP_HP_MS = 20 * 60 * 1000;
const DEFAULT_OFFLINE_CAP_MS = 12 * 60 * 60 * 1000;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function isFiniteInRange(n: unknown, min: number, max: number): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
}

function validate(raw: unknown): NunotchiState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (!isFiniteInRange(o.hp, 0, 4)) return null;
  if (!isFiniteInRange(o.hunger, 0, 4)) return null;
  if (!isFiniteInRange(o.energy, 0, 100)) return null;
  if (!isFiniteInRange(o.age, 0, 9999)) return null;
  if (!isFiniteInRange(o.walks, 0, 9999)) return null;
  if (!isFiniteInRange(o.lastSeen, 0, Number.MAX_SAFE_INTEGER)) return null;
  return {
    hp: o.hp,
    hunger: o.hunger,
    energy: o.energy,
    age: o.age,
    walks: o.walks,
    lastSeen: o.lastSeen,
  };
}

export function loadState(storage: Pick<Storage, "getItem" | "removeItem"> | null): {
  state: NunotchiState;
  reset: boolean;
} {
  if (!storage) return { state: { ...DEFAULTS }, reset: false };

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: { ...DEFAULTS }, reset: false };
  }
  if (raw == null) return { state: { ...DEFAULTS }, reset: false };

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  const validated = validate(parsed);
  if (!validated) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (typeof console !== "undefined") {
      // biome-ignore lint/suspicious/noConsole: intentional schema mismatch diagnostic
      console.warn("nunotchi: state reset (schema mismatch)");
    }
    return { state: { ...DEFAULTS }, reset: true };
  }
  return { state: validated, reset: false };
}

export function saveState(
  storage: Pick<Storage, "setItem"> | null,
  state: NunotchiState,
  now: number = Date.now(),
): void {
  if (!storage) return;
  const payload = {
    v: 1 as const,
    hp: state.hp,
    hunger: state.hunger,
    energy: state.energy,
    age: state.age,
    walks: state.walks,
    lastSeen: now,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private-mode browsers: never throw past the boundary */
  }
}

/**
 * Advance state by `deltaMs` of active time. lastSeen is treated as the
 * cumulative active-time clock so step boundaries are detected by integer
 * division — five 60s ticks accumulate to one 5-minute window correctly,
 * which crosses the 4-minute energy step exactly once.
 *
 * HP decays once per 20-minute boundary while hunger is saturated (>= 4).
 * When hunger crosses 4 mid-window, only the boundaries after the cross
 * count — a 60-min window starting at hunger=3 saturates at t=32 and any
 * 20-min boundary after that point contributes an HP step.
 */
export function tickDecay(state: NunotchiState, deltaMs: number): NunotchiState {
  if (deltaMs <= 0) return { ...state };
  const last = state.lastSeen;
  const next = last + deltaMs;
  const hungerSteps = Math.floor(next / STEP_HUNGER_MS) - Math.floor(last / STEP_HUNGER_MS);
  const energySteps = Math.floor(next / STEP_ENERGY_MS) - Math.floor(last / STEP_ENERGY_MS);
  const newHunger = clamp(state.hunger + hungerSteps, 0, 4);
  const newEnergy = clamp(state.energy - energySteps, 0, 100);

  let hpStart = last;
  if (state.hunger < 4) {
    const stepsToSaturate = 4 - state.hunger;
    const crossT = (Math.floor(last / STEP_HUNGER_MS) + stepsToSaturate) * STEP_HUNGER_MS;
    if (crossT >= next) {
      return { ...state, hunger: newHunger, energy: newEnergy, lastSeen: next };
    }
    hpStart = crossT;
  }
  const hpSteps = Math.floor(next / STEP_HP_MS) - Math.floor(hpStart / STEP_HP_MS);
  const newHp = clamp(state.hp - hpSteps, 0, 4);
  return {
    ...state,
    hp: newHp,
    hunger: newHunger,
    energy: newEnergy,
    lastSeen: next,
  };
}

/**
 * Apply offline decay between `state.lastSeen` and `now`, capped at `capMs`
 * (default 12h). Resulting lastSeen is always `now` so subsequent ticks
 * cannot re-apply decay across the same window.
 */
export function applyOfflineDecay(
  state: NunotchiState,
  now: number,
  capMs: number = DEFAULT_OFFLINE_CAP_MS,
): NunotchiState {
  if (state.lastSeen <= 0) return { ...state, lastSeen: now };
  if (now <= state.lastSeen) return { ...state };
  const delta = Math.min(now - state.lastSeen, capMs);
  const decayed = tickDecay(state, delta);
  return { ...decayed, lastSeen: now };
}
