export type Mood = "idle" | "eat" | "play" | "walk" | "sleep";
export type WinId = "currently" | "nowplaying" | "reading" | "nunotchi" | "terminal" | "posts";

export interface Win {
  x: number;
  y: number;
  z: number;
  rotate?: number;
  open: boolean;
  minimized: boolean;
}

export interface TerminalEntry {
  q: string;
  reply: string;
}

export type PetAction = "feed" | "play" | "walk" | "nap";
