import type { CollectionEntry } from "astro:content";
import { z } from "astro/zod";

export const POST_TYPES = ["reflection", "data-essay", "log", "nota-tecnica", "project"] as const;

/** Shared frontmatter fields — used by all post types and layouts. */
const BaseFields = {
  title: z.string().min(1),
  date: z.coerce.date(),
  type: z.enum(POST_TYPES).optional(),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  description: z.string().optional(),
  reading: z.boolean().default(false),
  toc: z.boolean().default(false),
  og_image: z.string().min(1).startsWith("/").optional(),
};

/**
 * Project-layout fields — only consumed by ProjectLayout.
 * Optional so non-project posts can omit them.
 *
 * When the layout type inventory stabilizes (story 6.5 resolved),
 * these should move to a discriminated union keyed on `type`.
 */
const ProjectFields = {
  stack: z.array(z.string()).optional(),
  last_run: z.string().optional(),
  season: z.string().optional(),
  repo: z.url({ protocol: /^https$/ }).optional(),
  liveUrl: z.url({ protocol: /^https$/ }).optional(),
  hasIsland: z.boolean().optional(),
};

export const PostSchema = z.object({
  ...BaseFields,
  ...ProjectFields,
});

export type PostType = NonNullable<z.infer<typeof PostSchema>["type"]>;

export type PostData = z.infer<typeof PostSchema>;

export type Post = CollectionEntry<"posts">;
