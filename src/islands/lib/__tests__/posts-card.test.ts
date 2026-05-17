import type { Post } from "@modules/content";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PostsCard from "../PostsCard.svelte";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "test-post",
    collection: "posts",
    data: {
      title: "Test Post",
      date: new Date("2024-01-15"),
      description: "A test description",
      type: "reflection",
      tags: [],
    },
    ...overrides,
  } as Post;
}

const SAMPLE_POSTS: Post[] = [
  makePost({
    id: "alpha",
    data: {
      title: "Alpha Post",
      date: new Date("2024-01-01T12:00:00"),
      description: "first one",
      type: "reflection",
      tags: [],
    },
  }),
  makePost({
    id: "beta",
    data: {
      title: "Beta Essay",
      date: new Date("2024-02-01T12:00:00"),
      description: "second article",
      type: "data-essay",
      tags: [],
    },
  }),
  makePost({
    id: "gamma",
    data: {
      title: "Gamma Log",
      date: new Date("2024-03-01T12:00:00"),
      description: "third log entry",
      type: "log",
      tags: [],
    },
  }),
];

function fireInput(el: HTMLInputElement, value: string) {
  el.value = value;
  const ev = new Event("input", { bubbles: true });
  Object.defineProperty(ev, "target", { value: el, enumerable: true });
  el.dispatchEvent(ev);
}

describe("PostsCard", () => {
  let container: HTMLDivElement;
  let instance: Record<string, unknown> | undefined;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (instance) {
      unmount(instance);
      instance = undefined;
    }
    container.remove();
    vi.useRealTimers();
  });

  it("renders all posts when query is empty", () => {
    instance = mount(PostsCard, {
      target: container,
      props: { posts: SAMPLE_POSTS },
    });

    const rows = container.querySelectorAll(".posts-row");
    expect(rows.length).toBe(3);
  });

  it("filters posts by title (case-insensitive)", async () => {
    vi.useFakeTimers();
    instance = mount(PostsCard, {
      target: container,
      props: { posts: SAMPLE_POSTS },
    });

    const input = container.querySelector<HTMLInputElement>(".posts-search");
    if (!input) throw new Error("missing input");
    fireInput(input, "alpha");

    vi.advanceTimersByTime(300);
    await Promise.resolve();

    const rows = container.querySelectorAll(".posts-row");
    expect(rows.length).toBe(1);
    expect(rows[0]?.querySelector(".posts-title")?.textContent).toBe("Alpha Post");
  });

  it("filters posts by description (case-insensitive)", async () => {
    vi.useFakeTimers();
    instance = mount(PostsCard, {
      target: container,
      props: { posts: SAMPLE_POSTS },
    });

    const input = container.querySelector<HTMLInputElement>(".posts-search");
    if (!input) throw new Error("missing input");
    fireInput(input, "article");

    vi.advanceTimersByTime(300);
    await Promise.resolve();

    const rows = container.querySelectorAll(".posts-row");
    expect(rows.length).toBe(1);
    expect(rows[0]?.getAttribute("href")).toBe("/posts/beta/");
  });

  it("renders empty state when no matches", async () => {
    vi.useFakeTimers();
    instance = mount(PostsCard, {
      target: container,
      props: { posts: SAMPLE_POSTS },
    });

    const input = container.querySelector<HTMLInputElement>(".posts-search");
    if (!input) throw new Error("missing input");
    fireInput(input, "zzz-no-match");

    vi.advanceTimersByTime(300);
    await Promise.resolve();

    const empty = container.querySelector(".posts-empty");
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toContain("No matches");
    expect(container.querySelectorAll(".posts-row").length).toBe(0);
  });

  it("distinguishes no-data from no-matches in empty state", () => {
    instance = mount(PostsCard, {
      target: container,
      props: { posts: [] },
    });

    const empty = container.querySelector(".posts-empty");
    expect(empty?.textContent).toContain("No posts yet");
  });

  it("links each row to /posts/{id}/", () => {
    instance = mount(PostsCard, {
      target: container,
      props: { posts: SAMPLE_POSTS },
    });

    const rows = container.querySelectorAll(".posts-row");
    expect(rows[0]?.getAttribute("href")).toBe("/posts/alpha/");
    expect(rows[1]?.getAttribute("href")).toBe("/posts/beta/");
    expect(rows[2]?.getAttribute("href")).toBe("/posts/gamma/");
  });

  it("shows date in meta line", () => {
    instance = mount(PostsCard, {
      target: container,
      props: { posts: SAMPLE_POSTS },
    });

    const rows = container.querySelectorAll(".posts-row");
    const meta = rows[0]?.querySelector(".posts-meta");
    expect(meta).toBeTruthy();
    expect(meta?.textContent).toContain("Jan");
  });
});
