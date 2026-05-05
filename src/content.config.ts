import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { PostSchema } from "./modules/content/types";
import { CurrentlySchema } from "./modules/currently/schema";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: PostSchema,
});

const currently = defineCollection({
  loader: file("./src/content/currently/now.json"),
  schema: CurrentlySchema,
});

export const collections = { posts, currently };
