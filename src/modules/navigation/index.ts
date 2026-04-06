// src/modules/navigation/index.ts
import type { NavItem } from "./types";

export type { NavItem };

export const NAV_ITEMS: NavItem[] = [
  { label: "posts", href: "/posts/" },
  { label: "about", href: "/about/" },
  { label: "search", href: "/search/" },
];

export function isActivePath(currentPath: string, itemPath: string): boolean {
  if (!currentPath || !itemPath) return false;

  // Homepage matches only "/"
  if (itemPath === "/") {
    return currentPath === "/";
  }

  // Normalize trailing slashes for comparison.
  // Note: this uses string prefix matching after normalization — correct because all
  // NAV_ITEMS hrefs end with '/'. If a future item like '/p/' is added alongside
  // '/posts/', '/posts/' would incorrectly match '/p/'. Guard by keeping hrefs distinct.
  const normalizedCurrent = currentPath.split(/[?#]/)[0];
  const withSlashCurrent = normalizedCurrent.endsWith("/")
    ? normalizedCurrent
    : `${normalizedCurrent}/`;
  const withSlashItem = itemPath.endsWith("/") ? itemPath : `${itemPath}/`;

  return withSlashCurrent === withSlashItem || withSlashCurrent.startsWith(withSlashItem);
}
