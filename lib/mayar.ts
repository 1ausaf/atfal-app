/**
 * Age is calculated as of October 31, just before the Atfal fiscal year (Nov 1).
 * Mayar groups: 7-9, 10-11, 12-14.
 */

export type AgeGroup = "7-9" | "10-11" | "12-14";

/** Returns Oct 31 of the current Atfal year: if today >= Nov 1 use this year's Oct 31, else last year's. */
export function getReferenceOct31(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const refYear = month > 9 || (month === 9 && day >= 1) ? year : year - 1;
  return new Date(Date.UTC(refYear, 9, 31));
}

/**
 * Compute age as of reference Oct 31 and map to age_group.
 * Returns null if age is outside 7-14 (invalid for Tifl).
 */
export function getAgeAndGroup(
  dateOfBirth: Date
): { age: number; age_group: AgeGroup } | null {
  const ref = getReferenceOct31();
  const birth = new Date(dateOfBirth);
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  const d = ref.getDate() - birth.getDate();
  if (m < 0 || (m === 0 && d < 0)) age--;
  if (age < 7 || age > 14) return null;
  let age_group: AgeGroup;
  if (age >= 7 && age <= 9) age_group = "7-9";
  else if (age >= 10 && age <= 11) age_group = "10-11";
  else age_group = "12-14";
  return { age, age_group };
}
