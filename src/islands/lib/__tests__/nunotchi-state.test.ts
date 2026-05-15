import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyOfflineDecay,
  DEFAULTS,
  loadState,
  type NunotchiState,
  STORAGE_KEY,
  saveState,
  tickDecay,
} from "../nunotchi-state";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  has(key: string): boolean {
    return this.data.has(key);
  }
}

const MIN = 60_000;
const HOUR = 60 * MIN;

function makeState(overrides: Partial<NunotchiState> = {}): NunotchiState {
  return { ...DEFAULTS, ...overrides };
}

describe("loadState", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("returns defaults when storage is null (SSR / no storage)", () => {
    const result = loadState(null);
    expect(result.reset).toBe(false);
    expect(result.state).toEqual({ ...DEFAULTS });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns defaults when the key is absent", () => {
    const storage = new MemoryStorage();
    const result = loadState(storage);
    expect(result.reset).toBe(false);
    expect(result.state).toEqual({ ...DEFAULTS });
  });

  it("restores a valid v:1 payload without flagging reset", () => {
    const storage = new MemoryStorage();
    const persisted = {
      v: 1,
      hp: 4,
      hunger: 1,
      energy: 73,
      age: 17,
      walks: 9,
      lastSeen: 1_725_000_000_000,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    const result = loadState(storage);
    expect(result.reset).toBe(false);
    expect(result.state).toMatchObject({
      hp: 4,
      hunger: 1,
      energy: 73,
      age: 17,
      walks: 9,
      lastSeen: 1_725_000_000_000,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("resets on schema version mismatch", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 0, hp: 3, hunger: 2, energy: 48, age: 4, walks: 2, lastSeen: 0 }),
    );
    const result = loadState(storage);
    expect(result.reset).toBe(true);
    expect(result.state).toEqual({ ...DEFAULTS });
    expect(storage.has(STORAGE_KEY)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith("nunotchi: state reset (schema mismatch)");
  });

  it("resets on corrupt JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{not json");
    const result = loadState(storage);
    expect(result.reset).toBe(true);
    expect(result.state).toEqual({ ...DEFAULTS });
    expect(storage.has(STORAGE_KEY)).toBe(false);
  });

  it("resets when a required field is missing", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      // missing `walks`
      JSON.stringify({ v: 1, hp: 3, hunger: 2, energy: 48, age: 4, lastSeen: 0 }),
    );
    const result = loadState(storage);
    expect(result.reset).toBe(true);
    expect(result.state).toEqual({ ...DEFAULTS });
  });

  it("resets when a number is non-finite", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      // JSON cannot encode NaN/Infinity, but a string field forces validation to fail
      JSON.stringify({ v: 1, hp: "three", hunger: 2, energy: 48, age: 4, walks: 2, lastSeen: 0 }),
    );
    const result = loadState(storage);
    expect(result.reset).toBe(true);
    expect(result.state).toEqual({ ...DEFAULTS });
  });

  it("resets when a value is out of range (hp: 99)", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 1, hp: 99, hunger: 2, energy: 48, age: 4, walks: 2, lastSeen: 0 }),
    );
    const result = loadState(storage);
    expect(result.reset).toBe(true);
    expect(result.state).toEqual({ ...DEFAULTS });
    expect(storage.has(STORAGE_KEY)).toBe(false);
  });
});

describe("saveState", () => {
  it("writes the serialized payload and stamps lastSeen with the supplied now", () => {
    const storage = new MemoryStorage();
    const state = makeState({ hp: 2, hunger: 3, energy: 30, walks: 7, lastSeen: 0 });
    saveState(storage, state, 12_345);
    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed).toEqual({
      v: 1,
      hp: 2,
      hunger: 3,
      energy: 30,
      age: state.age,
      walks: 7,
      lastSeen: 12_345,
    });
  });

  it("swallows a thrown setter (private-mode storage)", () => {
    const throwing: Pick<Storage, "setItem"> = {
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
    };
    expect(() => saveState(throwing, makeState(), 0)).not.toThrow();
  });

  it("is a no-op when storage is null (SSR)", () => {
    expect(() => saveState(null, makeState(), 0)).not.toThrow();
  });
});

describe("applyOfflineDecay", () => {
  it("is a no-op when now <= state.lastSeen (clock skew)", () => {
    const state = makeState({ lastSeen: 1_000_000 });
    const next = applyOfflineDecay(state, 999_999);
    expect(next).toEqual(state);
  });

  it("stamps lastSeen on first use when state.lastSeen is 0", () => {
    const state = makeState({ lastSeen: 0 });
    const next = applyOfflineDecay(state, 5_000);
    expect(next.lastSeen).toBe(5_000);
    expect(next.hp).toBe(state.hp);
    expect(next.hunger).toBe(state.hunger);
    expect(next.energy).toBe(state.energy);
  });

  it("advances hunger and decrements energy over an active window", () => {
    const start = 1_000_000_000_000;
    const state = makeState({ lastSeen: start, hunger: 0, energy: 100, hp: 4 });
    const next = applyOfflineDecay(state, start + 25 * MIN);
    // 25 min: hunger steps = floor(25/8) - 0 = 3; energy steps = floor(25/4) - 0 = 6
    expect(next.hunger).toBe(3);
    expect(next.energy).toBe(94);
    expect(next.hp).toBe(4); // hunger never reached 4 in window
    expect(next.lastSeen).toBe(start + 25 * MIN);
  });

  it("decrements hp only when hunger >= 4 throughout the window", () => {
    const start = 1_000_000_000_000;
    const state = makeState({ lastSeen: start, hunger: 4, energy: 100, hp: 4 });
    const next = applyOfflineDecay(state, start + 25 * MIN);
    // hp step boundary at 20min crosses once → hp 4 → 3
    expect(next.hp).toBe(3);
    expect(next.hunger).toBe(4); // clamped
  });

  it("caps offline decay at capMs (default 12h)", () => {
    const start = 1_000_000_000_000;
    const state = makeState({ lastSeen: start, hunger: 0, energy: 100, hp: 4 });
    const next = applyOfflineDecay(state, start + 48 * HOUR);
    // 12h cap: hunger steps = floor(720/8) = 90 → clamp 4. energy steps = floor(720/4) = 180 → clamp 0.
    expect(next.hunger).toBe(4);
    expect(next.energy).toBe(0);
    // lastSeen advances to actual `now`, not capped time, so we don't re-decay later.
    expect(next.lastSeen).toBe(start + 48 * HOUR);
  });

  it("respects an explicit capMs override", () => {
    const start = 1_000_000_000_000;
    const state = makeState({ lastSeen: start, hunger: 0, energy: 100, hp: 4 });
    const next = applyOfflineDecay(state, start + 60 * MIN, 5 * MIN);
    // capped at 5 minutes: hunger 0 (8min not crossed), energy -1 (4min crossed once)
    expect(next.hunger).toBe(0);
    expect(next.energy).toBe(99);
    expect(next.lastSeen).toBe(start + 60 * MIN);
  });
});

describe("tickDecay", () => {
  it("is a no-op for delta = 0", () => {
    const state = makeState({ lastSeen: 100, hunger: 1, energy: 50, hp: 4 });
    expect(tickDecay(state, 0)).toEqual(state);
  });

  it("is a no-op for negative delta", () => {
    const state = makeState({ lastSeen: 100, hunger: 1, energy: 50, hp: 4 });
    expect(tickDecay(state, -1)).toEqual(state);
  });

  it("accumulates fractional minutes across calls (5 × 60s = 5 minutes)", () => {
    let s = makeState({ lastSeen: 0, hunger: 0, energy: 100, hp: 4 });
    for (let i = 0; i < 5; i++) s = tickDecay(s, 60_000);
    // 5 minutes: hunger 0 (8min not crossed), energy -1 (4min crossed once at 240s)
    expect(s.hunger).toBe(0);
    expect(s.energy).toBe(99);
    expect(s.lastSeen).toBe(5 * MIN);
  });

  it("crosses one hunger boundary at 8 minutes", () => {
    const start = 0;
    let s = makeState({ lastSeen: start, hunger: 0, energy: 100, hp: 4 });
    s = tickDecay(s, 8 * MIN);
    expect(s.hunger).toBe(1);
    expect(s.energy).toBe(98); // 8/4 = 2 energy steps
  });

  it("clamps hunger at 4 and energy at 0", () => {
    const state = makeState({ lastSeen: 0, hunger: 0, energy: 5, hp: 4 });
    const next = tickDecay(state, 60 * MIN);
    expect(next.hunger).toBe(4);
    expect(next.energy).toBe(0);
    // Hunger saturates at t=32min; HP boundaries at t=40 and t=60 each cost 1 hp.
    expect(next.hp).toBe(2);
  });

  it("clamps hp at 0 when hunger remains saturated for many hp steps", () => {
    const state = makeState({ lastSeen: 0, hunger: 4, energy: 0, hp: 1 });
    const next = tickDecay(state, 5 * HOUR);
    expect(next.hp).toBe(0);
  });

  it("decays hp only after hunger crosses 4 mid-window", () => {
    // Window: 60 min, hunger starts at 3. Hunger crosses 4 at t=8min.
    // HP boundaries (t=20, t=40, t=60) all fall after the cross → 3 hp steps.
    const state = makeState({ lastSeen: 0, hunger: 3, energy: 100, hp: 4 });
    const next = tickDecay(state, 60 * MIN);
    expect(next.hunger).toBe(4);
    expect(next.hp).toBe(1);
  });

  it("does not decay hp when hunger reaches 4 too late for any 20-min boundary", () => {
    // Window: 32 min, hunger starts at 0. Saturates at t=32min — no hp boundary after.
    const state = makeState({ lastSeen: 0, hunger: 0, energy: 100, hp: 4 });
    const next = tickDecay(state, 32 * MIN);
    expect(next.hunger).toBe(4);
    expect(next.hp).toBe(4);
  });

  it("round-trips lastSeen via saveState → loadState", () => {
    const storage = new MemoryStorage();
    saveState(storage, makeState({ hp: 4, hunger: 2, energy: 50 }), 12_345);
    const result = loadState(storage);
    expect(result.reset).toBe(false);
    expect(result.state.lastSeen).toBe(12_345);
  });
});
