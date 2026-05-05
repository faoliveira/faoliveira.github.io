import type { CollectionEntry } from "astro:content";
import { z } from "astro/zod";

const MusicSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("youtube"), url: z.url({ protocol: /^https$/ }) }),
  z.object({ kind: z.literal("spotify"), url: z.url({ protocol: /^https$/ }) }),
  z.object({ kind: z.literal("none") }),
]);

const MusicSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  duration: z.string().min(1),
  source: MusicSourceSchema,
});

const ReadingSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  page: z.number().int().positive().optional(),
  totalPages: z.number().int().positive().optional(),
});

export const CurrentlySchema = z.object({
  music: MusicSchema,
  reading: ReadingSchema,
  mood: z.string().min(1),
  tabs: z.number().int().nonnegative(),
  status: z.string(),
  updated: z.coerce.date(),
});

export type CurrentlyData = z.infer<typeof CurrentlySchema>;
export type CurrentlyEntry = CollectionEntry<"currently">;
export type MusicSource = z.infer<typeof MusicSourceSchema>;
