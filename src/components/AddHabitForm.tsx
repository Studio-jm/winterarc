import { useState } from 'react'

interface AddHabitFormProps {
  onAdd: (name: string, emoji: string) => void
}

const EMOJI_CHOICES = ['\u2744\uFE0F', '\u{1F3C3}', '\u{1F4DA}', '\u{1F4A7}', '\u{1F9D8}', '\u{1F4B0}', '\u{1F634}', '\u{1F957}']

export default function AddHabitForm({ onAdd }: AddHabitFormProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, emoji)
    setName('')
    setEmoji(EMOJI_CHOICES[0])
  }

  return (
    <form className="add" onSubmit={handleSubmit}>
      <div className="add__emoji-row" role="group" aria-label="Choose an icon">
        {EMOJI_CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            className={`add__emoji${choice === emoji ? ' add__emoji--active' : ''}`}
            aria-pressed={choice === emoji}
            onClick={() => setEmoji(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      <div className="add__field">
        <input
          className="add__input"
          type="text"
          placeholder={'Add a new habit\u2026'}
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          aria-label="New habit name"
        />
        <button className="add__submit" type="submit" disabled={!name.trim()}>
          Add habit
        </button>
      </div>
    </form>
  )
}
