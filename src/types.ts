export interface Habit {
  id: string
  name: string
  emoji: string
  createdAt: string
  /** ISO date strings (YYYY-MM-DD) on which this habit was completed. */
  completedDates: string[]
}

export interface AppState {
  /** ISO date string marking day 1 of the 90-day arc. */
  startDate: string
  habits: Habit[]
}
