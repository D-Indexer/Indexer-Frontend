import { useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { MAX_SKILLS, MAX_SKILL_LENGTH, normalizeSkill } from '@/utils/validation'

interface TagInputProps {
  id: string
  label: string
  value: string[]
  onChange: (value: string[]) => void
  helpText?: string
  error?: string
}

export const TagInput = ({ error, helpText, id, label, onChange, value }: TagInputProps) => {
  const [draft, setDraft] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const inputId = id
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, helpText ? descriptionId : null].filter(Boolean).join(' ') || undefined

  const addTags = (incoming: string[]) => {
    let next = [...value]
    let added: string[] = []
    let message = ''

    for (const rawTag of incoming) {
      const tag = normalizeSkill(rawTag)
      if (!tag) continue
      if (tag.length > MAX_SKILL_LENGTH) {
        message = `Skills can be at most ${MAX_SKILL_LENGTH} characters.`
        continue
      }
      if (next.some((existing) => normalizeSkill(existing).toLocaleLowerCase() === tag.toLocaleLowerCase())) {
        message = `${tag} is already in your skills.`
        continue
      }
      if (next.length >= MAX_SKILLS) {
        message = `You can add up to ${MAX_SKILLS} skills.`
        continue
      }
      next = [...next, tag]
      added = [...added, tag]
    }

    if (next.length !== value.length) onChange(next)
    if (added.length && !message) message = `Added ${added.join(', ')} to skills.`
    setAnnouncement(message)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (draft) {
        if (event.key === 'Enter') event.preventDefault()
        addTags([draft])
        setDraft('')
      }
      return
    }
    if (event.key === 'Backspace' && !draft && value.length > 0) {
      const removed = value[value.length - 1]
      onChange(value.slice(0, -1))
      setAnnouncement(`${removed} removed from skills.`)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text')
    if (!/[,\r\n]/.test(pasted)) return
    event.preventDefault()
    addTags(pasted.split(/[,\r\n]+/))
    setDraft('')
  }

  const moveTag = (index: number) => (event: KeyboardEvent<HTMLLIElement>) => {
    if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    const target = event.key === 'ArrowLeft' ? index - 1 : index + 1
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setAnnouncement(`${value[index]} moved to position ${target + 1} of ${value.length}.`)
    requestAnimationFrame(() => document.getElementById(`${id}-tag-${target}`)?.focus())
  }

  return (
    <div className="field">
      <label htmlFor={inputId}>
        {label}
      </label>
      {value.length > 0 ? (
        <ul id={`${id}-tags`} className="tag-input__list" aria-label="Added skills">
          {value.map((skill, index) => (
            <li
              key={`${skill}-${index}`}
              id={`${id}-tag-${index}`}
              className="tag-input__item"
              tabIndex={0}
              onKeyDown={moveTag(index)}
            >
              <span>{skill}</span>
              <button
                type="button"
                className="tag-input__remove"
                aria-label={`Remove ${skill}`}
                onClick={() => {
                  onChange(value.filter((_, currentIndex) => currentIndex !== index))
                  setAnnouncement(`${skill} removed from skills.`)
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={inputId}
        type="text"
        value={draft}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-label={label}
        autoComplete="off"
        placeholder="Type a skill and press Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
      {helpText ? (
        <p className="field__help" id={descriptionId}>
          {helpText}
        </p>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
