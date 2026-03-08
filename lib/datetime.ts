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

/**
 * Wordle "day" in Toronto (YYYY-MM-DD). Resets at 9:00 AM Toronto time.
 * Before 9 AM we are still in the previous calendar day's Wordle day.
 */
export function getWordleDayToronto(): string {
  const now = new Date();
  const hour = parseInt(
    new Intl.DateTimeFormat("en-CA", { timeZone: TORONTO_TZ, hour: "2-digit", hour12: false }).format(now),
    10
  );
  return hour >= 9 ? getTodayToronto() : getYesterdayToronto();
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

/** Start of today in Toronto as ISO string (for DB filters). Events with event_date >= this stay visible all day in Toronto. */
export function getStartOfTodayTorontoISO(): string {
  const now = new Date();
  const h = parseInt(new Intl.DateTimeFormat("en-CA", { timeZone: TORONTO_TZ, hour: "2-digit", hour12: false }).format(now), 10);
  const min = parseInt(new Intl.DateTimeFormat("en-CA", { timeZone: TORONTO_TZ, minute: "2-digit" }).format(now), 10);
  const s = parseInt(new Intl.DateTimeFormat("en-CA", { timeZone: TORONTO_TZ, second: "2-digit" }).format(now), 10);
  const ms = now.getMilliseconds();
  const startOfDay = new Date(now.getTime() - (h * 3600 + min * 60 + s) * 1000 - ms);
  return startOfDay.toISOString();
}

/**
 * Parse a datetime-local value (YYYY-MM-DDTHH:mm) as Toronto time and return ISO string for DB.
 * Ensures created events use Toronto time so they stay visible until the correct local time.
 */
export function parseDateTimeLocalAsToronto(dateTimeLocal: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(dateTimeLocal.trim());
  if (!match) return new Date(dateTimeLocal).toISOString();
  const [, y, m, d, h, min] = match.map(Number);
  const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0);
  const torontoNoon = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(utcNoon));
  const [torontoH] = torontoNoon.split(":").map(Number);
  const offsetHours = 12 - torontoH;
  const utcMs = Date.UTC(y, m - 1, d, h, min, 0) + offsetHours * 3600 * 1000;
  return new Date(utcMs).toISOString();
}
