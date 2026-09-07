import type { Habit } from '../types'
import { currentStreak } from '../lib/date'

interface HabitItemProps {
  habit: Habit
  today: string
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export default function HabitItem({
  habit,
  today,
  onToggle,
  onRemove,
}: HabitItemProps) {
  const done = habit.completedDates.includes(today)
  const streak = currentStreak(habit.completedDates)

  return (
    <li className={`habit${done ? ' habit--done' : ''}`}>
      <button
        type="button"
        className="habit__check"
        aria-pressed={done}
        aria-label={`Mark "${habit.name}" as ${done ? 'not done' : 'done'}`}
        onClick={() => onToggle(habit.id)}
      >
        <span className="habit__emoji" aria-hidden="true">
          {habit.emoji}
        </span>
        <span className="habit__name">{habit.name}</span>
        <span className="habit__box" aria-hidden="true">
          {done ? '\u2713' : ''}
        </span>
      </button>
      <div className="habit__meta">
        {streak > 0 && (
          <span className="habit__streak" title="Current streak">
            {'\u{1F525}'} {streak}
          </span>
        )}
        <button
          type="button"
          className="habit__remove"
          aria-label={`Remove "${habit.name}"`}
          onClick={() => onRemove(habit.id)}
        >
          {'\u00D7'}
        </button>
      </div>
    </li>
  )
}
