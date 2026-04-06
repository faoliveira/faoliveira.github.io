// src/modules/seo/og-image.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { html } from "satori-html";
import { SITE_TITLE } from "./site-config";

export interface OgImageProps {
  title: string;
  description?: string;
  type?: string;
}

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Brand color hex approximations (day-mode palette)
const COLORS = {
  surface: "#f5f0e8",
  textPrimary: "#3a3530",
  textSecondary: "#6b6560",
  accent: "#5a8a6a",
  border: "#d9d4cc",
} as const;

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

function loadFonts(): { regular: ArrayBuffer; bold: ArrayBuffer } {
  if (fontCache) return fontCache;
  const fontDir = join(process.cwd(), "src/assets/fonts/og");
  try {
    const regular = readFileSync(join(fontDir, "Sora-Regular.ttf"));
    const bold = readFileSync(join(fontDir, "Sora-Bold.ttf"));
    // Copy into owned ArrayBuffers — readFileSync returns pooled Buffers
    fontCache = {
      regular: new Uint8Array(regular).buffer,
      bold: new Uint8Array(bold).buffer,
    };
    return fontCache;
  } catch (err) {
    throw new Error(
      `OG image generation failed: Sora TTF fonts not found at ${fontDir}. ` +
        `Download Sora-Regular.ttf and Sora-Bold.ttf and place them in src/assets/fonts/og/. ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function buildMarkup(props: OgImageProps): string {
  const { title, description, type } = props;
  const displayTitle = escapeHtml(truncate(title, 90));
  const displayDescription = description ? escapeHtml(truncate(description, 140)) : "";
  const displayType = type ? escapeHtml(type) : "";

  const typeBadge = displayType
    ? `<div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="background: ${COLORS.accent}; color: white; font-size: 14px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: lowercase; letter-spacing: 0.04em;">${displayType}</span>
      </div>`
    : "";

  const descriptionBlock = displayDescription
    ? `<p style="font-size: 20px; color: ${COLORS.textSecondary}; line-height: 1.5; margin: 0; max-width: 900px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${displayDescription}</p>`
    : "";

  return `<div style="display: flex; flex-direction: column; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; background: ${COLORS.surface}; padding: 60px 70px;">
    <div style="display: flex; flex-direction: column; flex: 1; justify-content: center;">
      ${typeBadge}
      <h1 style="font-size: 48px; font-weight: 700; color: ${COLORS.textPrimary}; line-height: 1.2; margin: 0; max-width: 1000px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${displayTitle}</h1>
      <div style="display: flex; margin: 24px 0; width: 60px; height: 4px; background: ${COLORS.accent}; border-radius: 2px;"></div>
      ${descriptionBlock}
    </div>
    <div style="display: flex; justify-content: flex-end; align-items: flex-end;">
      <span style="font-size: 16px; color: ${COLORS.textSecondary}; letter-spacing: 0.02em;">${SITE_TITLE}</span>
    </div>
  </div>`;
}

export async function generateOgImage(props: OgImageProps): Promise<Uint8Array> {
  const fonts = loadFonts();
  const markup = buildMarkup(props);
  const template = html(markup);

  const svg = await satori(template, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Sora", data: fonts.regular, weight: 400, style: "normal" },
      { name: "Sora", data: fonts.bold, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
  });

  return resvg.render().asPng();
}
