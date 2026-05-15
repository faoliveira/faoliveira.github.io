export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeExcerpt(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE)
      return escapeHtml(node.textContent ?? "");
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const children = Array.from(el.childNodes).map(walk).join("");
      if (el.tagName === "MARK") return `<mark>${children}</mark>`;
      return children;
    }
    return "";
  };
  return Array.from(doc.body.childNodes).map(walk).join("");
}

export function isSafeUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

function matchWord(qw: string, marks: string[]): boolean {
  for (const m of marks) {
    if (qw.length <= m.length) {
      if (m.startsWith(qw)) return true;
    } else if (qw.startsWith(m) && m.length / qw.length >= 0.75) {
      return true;
    }
  }
  return false;
}

// Pagefind does bidirectional prefix matching: query "kou" finds "koubou"
// (good — find-as-you-type) AND query "testesddvxzdf" finds "test" (bad —
// tiny indexed prefix of a long gibberish query). Filter results so each
// mark either fully covers the query (kou → koubou, query is a prefix of
// the word) OR the mark spans at least 75% of the query (koubous → koubou:
// minor typo passes; testesddvxzdf → test: gibberish drops).
export function hasSubstantialMatch(excerpt: string, query: string): boolean {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => w.length >= 2);
  if (queryWords.length === 0) return false;

  const marks = Array.from(excerpt.matchAll(/<mark>([^<]+)<\/mark>/g))
    .map((m) => m[1].toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((m) => m.length >= 2);
  if (marks.length === 0) return false;

  for (const qw of queryWords) {
    if (!matchWord(qw, marks)) return false;
  }
  return true;
}
