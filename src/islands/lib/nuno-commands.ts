import type { Pose } from "./nuno-atlas";

/**
 * Side-effects a typed command can trigger in the Nunotchi mini-game.
 * The widget owns those handlers; this module only declares intent.
 */
export type GameAction = "feed" | "play" | "walk" | "nap" | null;

export interface CommandResult {
  pose: Pose;
  reply: string;
  action: GameAction;
}

interface CommandEntry {
  pose: Pose;
  /** One reply, or an array rotated by call count for compound-over-time delight. */
  reply: string | readonly string[];
  /** Override picked between 22:00 and 05:59 local. */
  nightReply?: string | readonly string[];
  /** Override picked between 10:00 and 15:59 local. */
  middayReply?: string | readonly string[];
  action?: GameAction;
}

const TABLE: Record<string, CommandEntry> = {
  // ── basic moves ────────────────────────────────────────────────────────────
  sit: {
    pose: "sit",
    reply: [
      "sat. expects a treat.",
      "sits. patient. for now.",
      "already sitting. you owe one treat.",
    ],
  },
  lay: { pose: "lay", reply: ["compliance.", "horizontal. as discussed."] },
  down: { pose: "lay", reply: "compliance." },
  paw: { pose: "paw", reply: ["transactional.", "paw rendered. invoice incoming."] },
  shake: { pose: "paw", reply: "transactional." },
  roll: { pose: "lay", reply: "considers it. declines with class." },
  rollover: { pose: "lay", reply: "considers it. declines with class." },
  stay: { pose: "sit", reply: "stays. for 0.4 seconds." },
  come: { pose: "happy", reply: "arrives sideways." },
  here: { pose: "happy", reply: "arrives sideways." },

  // ── walks & rest ───────────────────────────────────────────────────────────
  walk: {
    pose: "walk",
    reply: ["tail explodes. find leash.", "leash request acknowledged.", "already at the door."],
    nightReply: "tail explodes. flashlight required.",
    action: "walk",
  },
  sleep: {
    pose: "sleep",
    reply: "finally.",
    middayReply: "midday nap. respected.",
    action: "nap",
  },
  bed: { pose: "sleep", reply: "negotiable.", action: "nap" },
  nap: { pose: "sleep", reply: "earned.", action: "nap" },

  // ── food ───────────────────────────────────────────────────────────────────
  treat: {
    pose: "happy",
    reply: ["instantaneous loyalty.", "loyalty bought. fair price.", "love is conditional."],
    action: "feed",
  },
  food: { pose: "eat", reply: "nom.", action: "feed" },

  // ── play & focus ───────────────────────────────────────────────────────────
  ball: {
    pose: "play",
    reply: ["gone. forever.", "ball achieved escape velocity.", "ball gone. dignity intact."],
    action: "play",
  },
  fetch: { pose: "walk", reply: "brought a leaf back. proud.", action: "play" },
  cat: { pose: "alert", reply: "low growl. zero plan." },
  squirrel: { pose: "alert", reply: "the eyes go wide." },

  // ── affect ─────────────────────────────────────────────────────────────────
  good: {
    pose: "happy",
    reply: ["*tail wag intensifies*", "tail enters orbit.", "approval logged."],
  },
  hi: {
    pose: "happy",
    reply: ["hi back.", "hi. tail moves slightly.", "hi. paw raised."],
    nightReply: "hi. it is late. nuno is up too.",
  },
  hello: {
    pose: "happy",
    reply: "hi back.",
    nightReply: "hi. it is late.",
  },
  pet: { pose: "happy", reply: "tail thumps. low frequency." },
  boop: { pose: "happy", reply: "boop received. nose acknowledged." },
  hug: { pose: "happy", reply: "accepts. briefly." },

  // ── dog-life corners ───────────────────────────────────────────────────────
  bark: { pose: "alert", reply: "remembers being a dog." },
  bath: { pose: "alert", reply: "nuno has left the chat." },
  vet: { pose: "alert", reply: "nuno has gone to ground." },

  // ── shell-flavoured easter eggs ────────────────────────────────────────────
  sudo: { pose: "alert", reply: "permission denied. nuno owns this system." },
  "sudo walk": { pose: "walk", reply: "elevated walk. still a walk.", action: "walk" },
  "sudo treat": { pose: "happy", reply: "root access granted. treat dispensed.", action: "feed" },
  rm: { pose: "sit", reply: "the dog stays." },
  "rm -rf": { pose: "sit", reply: "the dog stays. forever." },
  ls: { pose: "idle", reply: "1 dog · 4 hearts · 0 regrets" },
  pwd: { pose: "idle", reply: "you are in the koubou. always." },
  cd: { pose: "idle", reply: "no directory to leave. this is the workshop." },
  whoami: { pose: "idle", reply: "the one with the treats." },
  exit: { pose: "sit", reply: "no exit. nuno is a state of mind." },
  quit: { pose: "sit", reply: "no exit. nuno is a state of mind." },
  ":q": { pose: "idle", reply: "vim accepted. nuno indifferent." },
  ":wq": { pose: "idle", reply: "saved. ish." },
  ping: { pose: "alert", reply: "pong. nuno sneezes." },
  "man nuno": { pose: "idle", reply: "no manual. just say sit." },

  // ── meta easter eggs ───────────────────────────────────────────────────────
  "42": { pose: "happy", reply: "the answer is also: feed me." },
  coffee: { pose: "alert", reply: "wants a sip. denied." },
  koubou: { pose: "happy", reply: "you found the workshop." },
  konami: { pose: "happy", reply: "koubou code accepted." },
  "good boy": { pose: "happy", reply: "structural integrity compromised." },
  "good dog": { pose: "happy", reply: "structural integrity compromised." },
  "whos a good boy": { pose: "happy", reply: "structural integrity compromised." },
  "who's a good boy": { pose: "happy", reply: "structural integrity compromised." },
};

const HELP_ALIASES = new Set(["help", "?", "commands"]);
const HELP_REPLY =
  "USAGE: nuno <command>\n\nCOMMANDS:\n  sit           expects a treat\n  paw           transactional\n  walk          find leash\n  treat         dispense food\n  sleep         take a nap\n  ball          throw it\n  hi            greet\n  ls            list state\n  whoami        the one with the treats\n\nFLAGS:\n  --help        show this message\n  --version     v0.1";

export interface CommandContext {
  /** Times this exact (normalized) command has been issued before now. Drives rotation. */
  count?: number;
  /** Current time, for night/midday variants. Defaults to `new Date()`. */
  now?: Date;
}

export interface CommandLookup {
  result: CommandResult;
  /** True when the user typed something not in the table (still gets a reply). */
  unknown: boolean;
  /** True for the special "clear" command — widget should wipe terminal state. */
  clear?: boolean;
}

function isNight(d: Date): boolean {
  const h = d.getHours();
  return h >= 22 || h < 6;
}
function isMidday(d: Date): boolean {
  const h = d.getHours();
  return h >= 10 && h < 16;
}

function pickReply(entry: CommandEntry, ctx: CommandContext): string {
  const now = ctx.now ?? new Date();
  let pool: string | readonly string[] = entry.reply;
  if (entry.nightReply && isNight(now)) pool = entry.nightReply;
  else if (entry.middayReply && isMidday(now)) pool = entry.middayReply;
  if (typeof pool === "string") return pool;
  if (pool.length === 0) return "";
  const i = Math.max(0, Math.floor(ctx.count ?? 0));
  return pool[i % pool.length];
}

/**
 * Look up a typed command. Always returns a result — unknown input gets a
 * shell-style error so the terminal reads like a real CLI, not a pet
 * narration.
 *
 * Pass `ctx.count` to rotate through reply variants for repeat commands,
 * and `ctx.now` to enable time-of-day variants (defaults to current time).
 */
export function lookupCommand(input: string, ctx: CommandContext = {}): CommandLookup {
  const q = input.trim().toLowerCase();
  if (!q) {
    return { result: { pose: "idle", reply: "", action: null }, unknown: true };
  }
  if (q === "clear") {
    return {
      result: { pose: "idle", reply: "", action: null },
      unknown: false,
      clear: true,
    };
  }
  if (HELP_ALIASES.has(q)) {
    return {
      result: { pose: "happy", reply: HELP_REPLY, action: null },
      unknown: false,
    };
  }
  const entry = TABLE[q];
  if (entry) {
    return {
      result: {
        pose: entry.pose,
        reply: pickReply(entry, ctx),
        action: entry.action ?? null,
      },
      unknown: false,
    };
  }
  return {
    result: { pose: "idle", reply: `command not found: ${q}`, action: null },
    unknown: true,
  };
}

/** Canonical Konami sequence, lowercased. */
export const KONAMI_SEQUENCE: readonly string[] = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

/** True when the tail of `buffer` equals the Konami sequence (case-insensitive). */
export function matchesKonami(buffer: readonly string[]): boolean {
  if (buffer.length < KONAMI_SEQUENCE.length) return false;
  const offset = buffer.length - KONAMI_SEQUENCE.length;
  for (let i = 0; i < KONAMI_SEQUENCE.length; i++) {
    if (buffer[offset + i].toLowerCase() !== KONAMI_SEQUENCE[i]) return false;
  }
  return true;
}

/** Exposed for tests + introspection. */
export const COMMANDS = Object.freeze(TABLE);
