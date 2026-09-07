/** Total length of a Winter Arc in days. */
export const ARC_LENGTH = 90

/** Returns today's date as a local ISO date string (YYYY-MM-DD). */
export function todayISO(): string {
  return toISODate(new Date())
}

/** Formats a Date as a local YYYY-MM-DD string (ignores timezone offset). */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Whole days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const start = new Date(`${a}T00:00:00`).getTime()
  const end = new Date(`${b}T00:00:00`).getTime()
  return Math.round((end - start) / msPerDay)
}

/** 1-indexed current day of the arc, clamped to [1, ARC_LENGTH]. */
export function currentDay(startDate: string): number {
  const elapsed = daysBetween(startDate, todayISO())
  return Math.min(Math.max(elapsed + 1, 1), ARC_LENGTH)
}

/**
 * Current streak: number of consecutive days up to and including today
 * on which the habit was completed.
 */
export function currentStreak(completedDates: string[]): number {
  const done = new Set(completedDates)
  let streak = 0
  const cursor = new Date()
  // If today isn't done yet, start counting from yesterday.
  if (!done.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (done.has(toISODate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
