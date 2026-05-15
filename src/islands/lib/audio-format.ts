export function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function fmtSpoken(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0 seconds";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  if (m === 0) return `${r} seconds`;
  return `${m} minute${m === 1 ? "" : "s"} ${r} seconds`;
}
