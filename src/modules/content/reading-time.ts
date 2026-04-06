const WORDS_PER_MINUTE = 238; // adult average reading speed

function stripMarkup(content: string): string {
  return content
    .replace(/^---[\s\S]*?---\n?/, "") // frontmatter
    .replace(/```[\s\S]*?```/g, "") // fenced code blocks (```)
    .replace(/~~~[\s\S]*?~~~/g, "") // fenced code blocks (~~~)
    .replace(/<[^>]+>/g, " ") // HTML tags
    .replace(/^(import|export)\b.*$/gm, ""); // MDX import/export lines
}

export function calculateReadingTime(content: string): number {
  const words = stripMarkup(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
