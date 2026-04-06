// src/pages/rss.xml.ts
import rss from "@astrojs/rss";
import { getPublishedPosts } from "@modules/content";
import { SITE_DESCRIPTION, SITE_LANGUAGE, SITE_TITLE } from "@modules/seo";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const parser = new MarkdownIt();

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error("RSS feed requires `site` to be set in astro.config.mjs");
  }
  const posts = await getPublishedPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => {
      const rawBody = (post.body ?? "").replace(/^import\s+.+\s+from\s+['"].+['"];?\s*$/gm, "");
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        link: `/posts/${encodeURIComponent(post.id)}/`,
        content: sanitizeHtml(parser.render(rawBody), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        }),
      };
    }),
    customData: `<language>${SITE_LANGUAGE}</language>`,
  });
}
