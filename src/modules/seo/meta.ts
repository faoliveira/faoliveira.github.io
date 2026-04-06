// src/modules/seo/meta.ts
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "./site-config";
import type { MetaProps } from "./types";

export interface ResolvedMeta {
  title: string;
  description: string;
  siteName: string;
  url: string;
  canonicalUrl: string;
  type: "website" | "article";
  image?: string;
}

export function generateMeta(props: MetaProps): ResolvedMeta {
  const { title, description, url, type = "website", image } = props;
  const canonicalUrl = url.startsWith("http") ? url : new URL(url, SITE_URL).href;

  const resolvedImage = image?.startsWith("http")
    ? image
    : image
      ? new URL(image, SITE_URL).href
      : undefined;

  return {
    title,
    description: description || SITE_DESCRIPTION,
    siteName: SITE_TITLE,
    url,
    canonicalUrl,
    type,
    image: resolvedImage,
  };
}
