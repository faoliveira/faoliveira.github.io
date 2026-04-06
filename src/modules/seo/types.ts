// src/modules/seo/types.ts
export interface MetaProps {
  title: string;
  description?: string;
  url: string;
  type?: "website" | "article";
  image?: string;
}
