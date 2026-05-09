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
  reading: z.boolean().optional(),
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
  canvasMode: z.enum(["interactive", "prose"]).default("prose").optional(),
};

/**
 * Data-essay-layout fields — only consumed by [...slug].astro's data-essay
 * branch to forward into <DataEssayLayout slot="hero" />. Optional so
 * non-data-essay posts can omit it; type-gating happens at the route layer
 * (the same conditional-render pattern ProjectFields fields use).
 */
const DataEssayFields = {
  hero: z
    .object({
      src: z
        .string()
        .min(1)
        .refine((s) => s.startsWith("/") || s.startsWith("https://"), {
          message: "hero.src must be an absolute path (/...) or an HTTPS URL",
        }),
      alt: z.string().min(1),
      caption: z.string().min(1).optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
    .optional(),
};

export const PostSchema = z.object({
  ...BaseFields,
  ...ProjectFields,
  ...DataEssayFields,
});

export type PostType = NonNullable<z.infer<typeof PostSchema>["type"]>;

export type PostData = z.infer<typeof PostSchema>;

export type Post = CollectionEntry<"posts">;
