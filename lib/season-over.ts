/** Toronto / Eastern time; Season 3 starts at local midnight Apr 24, 2026 (Friday). */
const TORONTO_TZ = "America/Toronto";

function torontoParts(ms: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (ty: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === ty)?.value ?? 0);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), se: get("second") };
}

function cmpYmd(p: { y: number; mo: number; d: number }, Y: number, M: number, D: number): number {
  if (p.y !== Y) return p.y - Y;
  if (p.mo !== M) return p.mo - M;
  return p.d - D;
}

/**
 * First UTC instant when the calendar date in Toronto is at least (year, month, day).
 * For (2026,4,24) this is 2026-04-24 00:00:00 Toronto.
 */
export function getSeason3StartToronto(): Date {
  const Y = 2026;
  const M = 4;
  const D = 24;
  let lo = Date.UTC(Y, M - 1, D - 2, 0, 0, 0);
  let hi = Date.UTC(Y, M - 1, D + 2, 0, 0, 0);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const p = torontoParts(mid);
    if (cmpYmd(p, Y, M, D) < 0) lo = mid + 1;
    else hi = mid;
  }
  return new Date(lo);
}

export function getSeason3StartIso(): string {
  return getSeason3StartToronto().toISOString();
}

export function isBeforeSeason3(now: Date = new Date()): boolean {
  return now.getTime() < getSeason3StartToronto().getTime();
}
