import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { PostSchema } from "./modules/content/types";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: PostSchema,
});

export const collections = { posts };
