import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { AppState } from './types'
import { ARC_LENGTH, currentDay, todayISO } from './lib/date'
import { createHabit, loadState, saveState } from './lib/storage'
import ArcProgress from './components/ArcProgress'
import AddHabitForm from './components/AddHabitForm'
import HabitItem from './components/HabitItem'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const today = todayISO()

  useEffect(() => {
    saveState(state)
  }, [state])

  const day = useMemo(() => currentDay(state.startDate), [state.startDate])

  const completedToday = state.habits.filter((h) =>
    h.completedDates.includes(today),
  ).length
  const total = state.habits.length
  const dayComplete = total > 0 && completedToday === total

  function toggleHabit(id: string) {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h
        const done = h.completedDates.includes(today)
        return {
          ...h,
          completedDates: done
            ? h.completedDates.filter((d) => d !== today)
            : [...h.completedDates, today],
        }
      }),
    }))
  }

  function addHabit(name: string, emoji: string) {
    setState((prev) => ({
      ...prev,
      habits: [...prev.habits, createHabit(name, emoji)],
    }))
  }

  function removeHabit(id: string) {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }))
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            {'\u2744\uFE0F'}
          </span>
          <div>
            <h1 className="brand__title">Winter Arc</h1>
            <p className="brand__subtitle">
              {ARC_LENGTH} days of showing up for yourself.
            </p>
          </div>
        </div>
        <ArcProgress day={day} total={ARC_LENGTH} />
      </header>

      <section className="today">
        <div className="today__heading">
          <h2>Today&rsquo;s habits</h2>
          <span
            className={`today__count${dayComplete ? ' today__count--done' : ''}`}
            data-testid="today-count"
          >
            {completedToday}/{total} done
          </span>
        </div>

        {total === 0 ? (
          <p className="empty">No habits yet. Add your first one below.</p>
        ) : (
          <ul className="habits">
            {state.habits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                today={today}
                onToggle={toggleHabit}
                onRemove={removeHabit}
              />
            ))}
          </ul>
        )}

        {dayComplete && (
          <p className="celebrate" role="status">
            {'\u{1F3C6}'} Perfect day — every habit checked off. Keep the arc alive!
          </p>
        )}
      </section>

      <AddHabitForm onAdd={addHabit} />

      <footer className="app__footer">
        Progress is saved locally in your browser.
      </footer>
    </div>
  )
}
