import { escapeHtml, isSafeUrl, sanitizeExcerpt } from "./sanitize";
import type { ResultData } from "./pagefind-client";

const FALLBACK_LINKS = `
  <div class="no-results-links">
    <a href="/posts/">Browse posts</a>
    <a href="/">Go home</a>
  </div>
`;

export function unavailableHtml(): string {
  return `
    <div class="no-results">
      <p>Search index didn't load. Try browsing posts.</p>
      ${FALLBACK_LINKS}
    </div>
  `;
}

export function noResultsHtml(query: string): string {
  return `
    <div class="no-results">
      <p>No match for "${escapeHtml(query)}".</p>
      ${FALLBACK_LINKS}
    </div>
  `;
}

export function itemsHtml(items: ResultData[]): string {
  return items
    .map((item, i) => {
      const safeUrl = isSafeUrl(item.url) ? item.url : "/";
      const safeTitle = escapeHtml(item.meta.title);
      const safeExcerpt = sanitizeExcerpt(item.excerpt);
      return `
        <a href="${safeUrl}" class="result-item" style="--i: ${i};">
          <div class="result-title">${safeTitle}</div>
          <div class="result-excerpt">${safeExcerpt}</div>
        </a>
      `;
    })
    .join("");
}

export function resultsLabel(count: number, query: string): string {
  return `${count} result${count === 1 ? "" : "s"} for ${query}`;
}
