import { getPublishedPosts } from "@modules/content";
import { ABOUT_DESCRIPTION, generateOgImage, SITE_DESCRIPTION, SITE_TITLE } from "@modules/seo";
import type { APIRoute, GetStaticPaths } from "astro";

// Reserved slugs that have their own hardcoded entries below
const RESERVED_SLUGS = new Set(["index", "about"]);

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPublishedPosts();

  const postPaths = posts
    .filter((post) => !post.data.og_image && !RESERVED_SLUGS.has(post.id))
    .map((post) => ({
      params: { slug: post.id },
      props: {
        title: post.data.title,
        description: post.data.description,
        type: post.data.type,
      },
    }));

  return [
    ...postPaths,
    {
      params: { slug: "index" },
      props: { title: SITE_TITLE, description: SITE_DESCRIPTION },
    },
    {
      params: { slug: "about" },
      props: {
        title: "About — fa.",
        description: ABOUT_DESCRIPTION,
      },
    },
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description, type } = props as {
    title: string;
    description?: string;
    type?: string;
  };
  if (!title) {
    return new Response("Missing title prop", { status: 500 });
  }
  const png = await generateOgImage({ title, description, type });
  return new Response(Buffer.from(png), {
    headers: { "Content-Type": "image/png" },
  });
};
