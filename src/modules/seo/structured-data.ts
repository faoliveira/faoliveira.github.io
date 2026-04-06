import { SITE_URL } from "./site-config";

interface ProjectStructuredDataInput {
  title: string;
  description?: string;
  repo?: string;
  liveUrl?: string;
}

export function buildProjectStructuredData(
  input: ProjectStructuredDataInput,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.title,
    author: {
      "@type": "Person",
      name: "Felipe Oliveira",
      url: SITE_URL,
    },
  };
  if (input.description) data.description = input.description;
  if (input.liveUrl) data.url = input.liveUrl;
  if (input.repo) data.codeRepository = input.repo;
  return data;
}
