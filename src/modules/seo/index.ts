// src/modules/seo/index.ts

export type { ResolvedMeta } from "./meta";
export { generateMeta } from "./meta";
export type { OgImageProps } from "./og-image";
export { generateOgImage } from "./og-image";
export {
  ABOUT_DESCRIPTION,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_TITLE,
  SITE_URL,
} from "./site-config";
export { buildProjectStructuredData } from "./structured-data";
export type { MetaProps } from "./types";
