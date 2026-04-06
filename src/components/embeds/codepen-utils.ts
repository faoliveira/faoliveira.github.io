// codepen-utils.ts — Pure functions extracted for unit testing

export type CodePenTab = "result" | "html" | "css" | "js";

/**
 * Sanitizes a CodePen ID or username to alphanumeric + hyphens only.
 * Strips anything that isn't [a-zA-Z0-9-] to prevent injection in iframe URLs.
 */
export function sanitizeCodePenSlug(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, "");
}

/**
 * Builds the CodePen embed iframe URL.
 * Theme is passed at call time (read from DOM at click time for dark/light support).
 */
export function buildCodePenUrl(
  user: string,
  id: string,
  tab: CodePenTab = "result",
  theme: "dark" | "light" = "light",
): string {
  const safeUser = sanitizeCodePenSlug(user);
  const safeId = sanitizeCodePenSlug(id);
  return `https://codepen.io/${safeUser}/embed/${safeId}?default-tab=${tab}&theme-id=${theme}`;
}

/**
 * Builds the canonical CodePen pen URL.
 */
export function buildCodePenLink(user: string, id: string): string {
  const safeUser = sanitizeCodePenSlug(user);
  const safeId = sanitizeCodePenSlug(id);
  return `https://codepen.io/${safeUser}/pen/${safeId}`;
}
