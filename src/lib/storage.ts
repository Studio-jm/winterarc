import type { AppState, Habit } from '../types'
import { todayISO } from './date'

const STORAGE_KEY = 'winterarc:v1'

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function seedHabits(): Habit[] {
  const createdAt = new Date().toISOString()
  return [
    { id: makeId(), name: 'Move for 30 minutes', emoji: '\u{1F3C3}', createdAt, completedDates: [] },
    { id: makeId(), name: 'Read 10 pages', emoji: '\u{1F4DA}', createdAt, completedDates: [] },
    { id: makeId(), name: 'Drink 2L water', emoji: '\u{1F4A7}', createdAt, completedDates: [] },
  ]
}

export function defaultState(): AppState {
  return { startDate: todayISO(), habits: seedHabits() }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (!parsed.startDate || !Array.isArray(parsed.habits)) {
      return defaultState()
    }
    return { startDate: parsed.startDate, habits: parsed.habits as Habit[] }
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore write failures (e.g. private mode / storage full).
  }
}

export function createHabit(name: string, emoji: string): Habit {
  return {
    id: makeId(),
    name: name.trim(),
    emoji: emoji || '\u2744\uFE0F',
    createdAt: new Date().toISOString(),
    completedDates: [],
  }
}
