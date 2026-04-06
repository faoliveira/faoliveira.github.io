import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../types";

// Mock astro:content before importing queries
vi.mock("astro:content", () => ({
  getCollection: vi.fn(),
}));

import { getCollection } from "astro:content";
import { getFeaturedPosts, getPostBySlug, getPostsByType, getPublishedPosts } from "../queries";

const mockGetCollection = vi.mocked(getCollection);

// Simulate Astro's getCollection: call the optional filter callback and return filtered results
function makeCollectionMock(allPosts: Post[]) {
  return mockGetCollection.mockImplementation(
    async (collection: string, filter?: (entry: Post) => boolean) => {
      expect(collection).toBe("posts");
      if (filter) {
        return allPosts.filter((post) => filter(post)) as never;
      }
      return allPosts as never;
    },
  );
}

const mockPosts: Post[] = [
  {
    id: "2026-03-18-post-a",
    collection: "posts",
    body: "",
    data: {
      title: "Post A",
      date: new Date("2026-03-18"),
      draft: false,
      featured: true,
      tags: ["astro"],
      type: "reflection",
      description: "First post",
      reading: false,
      toc: false,
    },
  },
  {
    id: "2026-03-10-post-b",
    collection: "posts",
    body: "",
    data: {
      title: "Post B",
      date: new Date("2026-03-10"),
      draft: false,
      featured: false,
      tags: [],
      type: "nota-tecnica",
      reading: false,
      toc: false,
    },
  },
  {
    id: "2026-03-05-draft",
    collection: "posts",
    body: "",
    data: {
      title: "Draft Post",
      date: new Date("2026-03-05"),
      draft: true,
      featured: false,
      tags: [],
      reading: false,
      toc: false,
    },
  },
  {
    id: "2026-02-01-post-c",
    collection: "posts",
    body: "",
    data: {
      title: "Post C",
      date: new Date("2026-02-01"),
      draft: false,
      featured: true,
      tags: ["data"],
      type: "data-essay",
      reading: false,
      toc: false,
    },
  },
];

describe("getPublishedPosts()", () => {
  beforeEach(() => {
    makeCollectionMock(mockPosts);
    import.meta.env.PROD = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
    import.meta.env.PROD = false;
  });

  it("returns posts sorted by date descending", async () => {
    const posts = await getPublishedPosts();
    const dates = posts.map((p) => p.data.date.valueOf());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it("includes draft posts in dev mode (PROD = false)", async () => {
    import.meta.env.PROD = false;
    const posts = await getPublishedPosts();
    const hasDraft = posts.some((p) => p.data.draft === true);
    expect(hasDraft).toBe(true);
  });

  it("excludes draft posts in production mode (PROD = true)", async () => {
    import.meta.env.PROD = true;
    const posts = await getPublishedPosts();
    expect(posts.every((p) => p.data.draft !== true)).toBe(true);
  });

  it("returns empty array when collection is empty", async () => {
    makeCollectionMock([]);
    const posts = await getPublishedPosts();
    expect(posts).toEqual([]);
  });
});

describe("getFeaturedPosts()", () => {
  beforeEach(() => {
    makeCollectionMock(mockPosts);
    import.meta.env.PROD = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
    import.meta.env.PROD = false;
  });

  it("returns only featured posts", async () => {
    const posts = await getFeaturedPosts();
    expect(posts.every((p) => p.data.featured === true)).toBe(true);
  });

  it("excludes non-featured posts", async () => {
    const posts = await getFeaturedPosts();
    const ids = posts.map((p) => p.id);
    expect(ids).not.toContain("2026-03-10-post-b");
  });

  it("returns featured posts sorted by date descending", async () => {
    const posts = await getFeaturedPosts();
    const dates = posts.map((p) => p.data.date.valueOf());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it("excludes drafts in production even if featured", async () => {
    import.meta.env.PROD = true;
    const posts = await getFeaturedPosts();
    expect(posts.every((p) => p.data.draft !== true)).toBe(true);
  });
});

describe("getPostsByType()", () => {
  beforeEach(() => {
    makeCollectionMock(mockPosts);
    import.meta.env.PROD = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
    import.meta.env.PROD = false;
  });

  it("returns only posts matching the specified type", async () => {
    const posts = await getPostsByType("reflection");
    expect(posts.every((p) => p.data.type === "reflection")).toBe(true);
    expect(posts.map((p) => p.id)).not.toContain("2026-03-10-post-b");
  });

  it("returns posts matching the nota-tecnica type", async () => {
    const posts = await getPostsByType("nota-tecnica");
    const ids = posts.map((p) => p.id);
    expect(ids).toContain("2026-03-10-post-b");
    expect(ids).not.toContain("2026-03-18-post-a");
  });

  it("returns empty array when no posts match type", async () => {
    const posts = await getPostsByType("log");
    expect(posts).toEqual([]);
  });

  it("returns results sorted by date descending", async () => {
    const posts = await getPostsByType("reflection");
    const dates = posts.map((p) => p.data.date.valueOf());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });
});

describe("getPostBySlug()", () => {
  beforeEach(() => {
    makeCollectionMock(mockPosts);
    import.meta.env.PROD = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
    import.meta.env.PROD = false;
  });

  it("returns the post with matching id", async () => {
    const post = await getPostBySlug("2026-03-18-post-a");
    expect(post).toBeDefined();
    expect(post?.data.title).toBe("Post A");
  });

  it("returns undefined when slug does not match any post", async () => {
    const post = await getPostBySlug("nonexistent-slug");
    expect(post).toBeUndefined();
  });

  it("returns draft post in dev mode", async () => {
    import.meta.env.PROD = false;
    const post = await getPostBySlug("2026-03-05-draft");
    expect(post).toBeDefined();
    expect(post?.data.draft).toBe(true);
  });

  it("returns undefined for draft post in production mode", async () => {
    import.meta.env.PROD = true;
    const post = await getPostBySlug("2026-03-05-draft");
    expect(post).toBeUndefined();
  });
});

describe("AC6 — .md and .mdx coexistence", () => {
  afterEach(() => {
    vi.clearAllMocks();
    import.meta.env.PROD = false;
  });

  it("includes posts from both .md and .mdx sources in query results", async () => {
    const mixedPosts: Post[] = [
      {
        id: "2026-03-18-hello-koubou", // represents .mdx
        collection: "posts",
        body: "",
        data: {
          title: "MDX Post",
          date: new Date("2026-03-18"),
          draft: false,
          featured: false,
          tags: [],
          reading: false,
          toc: false,
        },
      },
      {
        id: "2026-03-01-nota-tecnica-test", // represents .md
        collection: "posts",
        body: "",
        data: {
          title: "MD Post",
          date: new Date("2026-03-01"),
          draft: false,
          featured: false,
          tags: [],
          reading: false,
          toc: false,
        },
      },
    ];
    makeCollectionMock(mixedPosts);
    import.meta.env.PROD = false;
    const posts = await getPublishedPosts();
    const ids = posts.map((p) => p.id);
    expect(ids).toContain("2026-03-18-hello-koubou");
    expect(ids).toContain("2026-03-01-nota-tecnica-test");
  });
});
