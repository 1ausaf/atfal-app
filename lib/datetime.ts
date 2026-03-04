const TORONTO_TZ = "America/Toronto";

/** Format a date/time for display in Toronto timezone */
export function formatInToronto(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-CA", { timeZone: TORONTO_TZ, ...options });
}

/** Date only (e.g. "Mar 3, 2025") */
export function formatDateInToronto(date: Date | string): string {
  return formatInToronto(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Full date and time in Toronto */
export function formatDateTimeInToronto(date: Date | string): string {
  return formatInToronto(date, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Today's date in Toronto (YYYY-MM-DD) for DB/API use (e.g. activity_date, analytics) */
export function getTodayToronto(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Yesterday's date in Toronto (YYYY-MM-DD) for streak comparison */
export function getYesterdayToronto(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const parts = formatter.formatToParts(yesterday);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}
