// @ts-check

import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import remarkEmoji from "remark-emoji";

// https://astro.build/config
export default defineConfig({
  site: "https://felipeo.me",
  output: "static",
  vite: {
    resolve: {
      alias: {
        "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      },
    },
  },
  integrations: [
    expressiveCode({
      themes: ["everforest-light", "kanagawa-wave"],
      themeCssSelector: (theme) => {
        if (theme.type === "light") return "";
        return 'html[data-theme="nightfall"]';
      },
      useDarkModeMediaQuery: false,
      styleOverrides: {
        borderRadius: "6px",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "var(--type-sm)",
        codeLineHeight: "var(--leading-base)",
        codePaddingInline: "var(--ma-base)",
        codePaddingBlock: "var(--ma-base)",
        uiFontFamily: "var(--font-mono)",
        uiFontSize: "var(--type-xs)",
        frames: {
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          terminalTitlebarDotsOpacity: "0.75",
        },
      },
    }),
    mdx(),
    sitemap({
      filter: (page) =>
        page !== "https://felipeo.me/404/" && !page.startsWith("https://felipeo.me/design-system/"),
    }),
    svelte(),
  ],
  markdown: {
    remarkPlugins: [remarkEmoji],
  },
});
