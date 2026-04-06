import { getCollection } from "astro:content";
import type { Post, PostData, PostType } from "./types";

function isVisible(data: PostData): boolean {
  return import.meta.env.PROD ? data.draft !== true : true;
}

function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const diff = b.data.date.valueOf() - a.data.date.valueOf();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => isVisible(data));
  return sortByDateDesc(posts);
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await getCollection(
    "posts",
    ({ data }) => isVisible(data) && data.featured === true,
  );
  return sortByDateDesc(posts);
}

export async function getPostsByType(type: PostType): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => isVisible(data) && data.type === type);
  return sortByDateDesc(posts);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getCollection("posts", ({ id, data }) => id === slug && isVisible(data));
  return posts[0];
}
