/**
 * Deterministic daily index from date string (YYYY-MM-DD) for picking one word per day.
 */
export function getDailyWordIndex(dateKey: string, wordCount: number): number {
  if (wordCount <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % wordCount;
}

export type LetterStatus = "correct" | "misplaced" | "absent";

/**
 * Compare guess to target (same length, uppercase) and return status per letter.
 */
export function getFeedback(guess: string, target: string): LetterStatus[] {
  const len = target.length;
  const result: LetterStatus[] = new Array(len).fill("absent");
  const targetCounts = new Map<string, number>();
  for (let i = 0; i < len; i++) {
    const c = target[i];
    targetCounts.set(c, (targetCounts.get(c) ?? 0) + 1);
  }
  for (let i = 0; i < len; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      targetCounts.set(target[i], (targetCounts.get(target[i]) ?? 1) - 1);
    }
  }
  for (let i = 0; i < len; i++) {
    if (result[i] !== "correct") {
      const c = guess[i];
      const remaining = targetCounts.get(c) ?? 0;
      if (remaining > 0) {
        result[i] = "misplaced";
        targetCounts.set(c, remaining - 1);
      }
    }
  }
  return result;
}
