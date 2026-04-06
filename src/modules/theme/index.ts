// src/modules/theme/index.ts
// Browser-only module — do not import in SSR/Node contexts.

import type { ThemeMode } from "./types";
import { THEME_KEY } from "./types";

export type { ThemeMode };
export { THEME_KEY };

export function getTheme(): ThemeMode {
  const theme = document.documentElement.dataset.theme;
  return theme === "nightfall" ? "nightfall" : "day";
}

export function toggleTheme(): ThemeMode {
  const current = getTheme();
  const next: ThemeMode = current === "day" ? "nightfall" : "day";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (_) {}
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = next === "nightfall" ? "dark" : "light";
  return next;
}
