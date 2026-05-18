import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
  },
  resolve: {
    conditions: ["browser"],
    alias: {
      "@modules": path.resolve(import.meta.dirname, "src/modules"),
      "@components": path.resolve(import.meta.dirname, "src/components"),
      "@layouts": path.resolve(import.meta.dirname, "src/layouts"),
      "@styles": path.resolve(import.meta.dirname, "src/styles"),
      "@islands": path.resolve(import.meta.dirname, "src/islands"),
      "astro:content": path.resolve(import.meta.dirname, "src/__mocks__/astro-content.ts"),
    },
  },
});
