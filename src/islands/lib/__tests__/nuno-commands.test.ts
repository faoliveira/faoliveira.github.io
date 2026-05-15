import { describe, expect, it } from "vitest";
import { COMMANDS, KONAMI_SEQUENCE, lookupCommand, matchesKonami } from "../nuno-commands";

describe("lookupCommand", () => {
  it("looks up known commands case-insensitively with whitespace tolerance", () => {
    const a = lookupCommand("sit");
    const b = lookupCommand("  SIT  ");
    expect(a.unknown).toBe(false);
    expect(b.unknown).toBe(false);
    expect(a.result).toEqual(b.result);
    expect(a.result.pose).toBe("sit");
  });

  it("returns idle + a CLI 'command not found' error for unknown input", () => {
    const r = lookupCommand("hovercraft");
    expect(r.unknown).toBe(true);
    expect(r.result.pose).toBe("idle");
    expect(r.result.reply).toContain("command not found");
    expect(r.result.reply).toContain("hovercraft");
  });

  it("flags empty input as unknown but doesn't throw", () => {
    const r = lookupCommand("");
    expect(r.unknown).toBe(true);
    expect(r.result.pose).toBe("idle");
  });

  it("game-action commands carry a non-null action", () => {
    expect(lookupCommand("treat").result.action).toBe("feed");
    expect(lookupCommand("ball").result.action).toBe("play");
    expect(lookupCommand("walk", { count: 0 }).result.action).toBe("walk");
    expect(lookupCommand("nap").result.action).toBe("nap");
  });

  it("pose-only commands have a null action", () => {
    expect(lookupCommand("sit").result.action).toBeNull();
    expect(lookupCommand("paw").result.action).toBeNull();
    expect(lookupCommand("cat").result.action).toBeNull();
  });

  it("every entry in COMMANDS resolves through lookup with a non-empty reply", () => {
    for (const key of Object.keys(COMMANDS)) {
      const r = lookupCommand(key, { count: 0 });
      expect(r.unknown).toBe(false);
      expect(r.result.pose).toBeTruthy();
      expect(r.result.reply.length).toBeGreaterThan(0);
    }
  });
});

describe("reply rotation", () => {
  it("rotates through array replies by count and wraps cleanly", () => {
    const r0 = lookupCommand("sit", { count: 0 }).result.reply;
    const r1 = lookupCommand("sit", { count: 1 }).result.reply;
    const r2 = lookupCommand("sit", { count: 2 }).result.reply;
    const r3 = lookupCommand("sit", { count: 3 }).result.reply;
    expect(r0).not.toBe(r1);
    expect(r1).not.toBe(r2);
    expect(r3).toBe(r0); // wraps to the first
  });

  it("returns the single string when an entry has no rotation pool", () => {
    const a = lookupCommand("food", { count: 0 }).result.reply;
    const b = lookupCommand("food", { count: 5 }).result.reply;
    expect(a).toBe(b);
    expect(a).toBe("nom.");
  });
});

describe("time-aware variants", () => {
  it("uses nightReply between 22:00 and 06:00 local", () => {
    const night = new Date(2026, 0, 1, 23, 30, 0);
    const r = lookupCommand("walk", { now: night });
    expect(r.result.reply).toContain("flashlight");
  });

  it("falls back to the daytime pool outside the night window", () => {
    const day = new Date(2026, 0, 1, 14, 0, 0);
    const r = lookupCommand("walk", { now: day, count: 0 });
    expect(r.result.reply).not.toContain("flashlight");
  });

  it("uses middayReply for sleep when the sun is up", () => {
    const noon = new Date(2026, 0, 1, 12, 30, 0);
    const r = lookupCommand("sleep", { now: noon });
    expect(r.result.reply).toContain("midday");
  });

  it("greets you differently when it is late", () => {
    const late = new Date(2026, 0, 1, 2, 15, 0);
    const r = lookupCommand("hi", { now: late });
    expect(r.result.reply).toContain("late");
  });
});

describe("special commands", () => {
  it("flags clear so the widget can reset terminal state", () => {
    const r = lookupCommand("clear");
    expect(r.clear).toBe(true);
    expect(r.unknown).toBe(false);
    expect(r.result.reply).toBe("");
  });

  it("help / ? / commands all return the same discovery hint", () => {
    const a = lookupCommand("help").result.reply;
    const b = lookupCommand("?").result.reply;
    const c = lookupCommand("commands").result.reply;
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a.length).toBeGreaterThan(0);
    expect(a).toContain("sit");
  });
});

describe("hidden easter eggs", () => {
  it("recognizes shell-flavored commands", () => {
    expect(lookupCommand("sudo").unknown).toBe(false);
    expect(lookupCommand("ls").unknown).toBe(false);
    expect(lookupCommand("pwd").unknown).toBe(false);
    expect(lookupCommand("rm -rf").unknown).toBe(false);
    expect(lookupCommand("whoami").unknown).toBe(false);
    expect(lookupCommand(":wq").unknown).toBe(false);
    expect(lookupCommand("man nuno").unknown).toBe(false);
  });

  it("sudo walk carries the walk action while keeping the joke", () => {
    const r = lookupCommand("sudo walk");
    expect(r.result.action).toBe("walk");
    expect(r.result.reply).toContain("elevated");
  });

  it("rewards the meta phrase good boy with the structural reply", () => {
    const variants = ["good boy", "good dog", "whos a good boy", "who's a good boy"];
    for (const v of variants) {
      expect(lookupCommand(v).result.reply).toContain("structural");
    }
  });

  it("acknowledges koubou as a meta discovery", () => {
    const r = lookupCommand("koubou");
    expect(r.unknown).toBe(false);
    expect(r.result.reply).toContain("workshop");
  });

  it("answers 42 with a hitchhiker nod", () => {
    expect(lookupCommand("42").result.reply).toContain("feed me");
  });
});

describe("matchesKonami", () => {
  it("matches the canonical sequence", () => {
    expect(
      matchesKonami([
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
      ]),
    ).toBe(true);
  });

  it("matches when extra keys precede the sequence (tail match)", () => {
    expect(
      matchesKonami([
        "x",
        "y",
        "z",
        ...KONAMI_SEQUENCE.map((k) => (k.startsWith("arrow") ? k.replace("arrow", "Arrow") : k)),
      ]),
    ).toBe(true);
  });

  it("matches case-insensitively (Shift held during BA still counts)", () => {
    expect(
      matchesKonami([
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "B",
        "A",
      ]),
    ).toBe(true);
  });

  it("does not match wrong order or short buffers", () => {
    expect(matchesKonami(["ArrowUp"])).toBe(false);
    expect(
      matchesKonami([
        "ArrowDown",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
      ]),
    ).toBe(false);
  });
});
