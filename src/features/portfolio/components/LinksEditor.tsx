import { useState } from 'react'
import { FormField } from '@/components/forms'
import { Button } from '@/components/ui'
import type { PortfolioLink } from '@/types'
import { getPortfolioLinkError, PORTFOLIO_LINK_KINDS } from '@/utils/portfolioLinks'

interface LinksEditorProps {
  error?: string
  id: string
  value: PortfolioLink[]
  onChange: (links: PortfolioLink[]) => void
}

const updateTouched = (touched: Set<number>, from: number, to: number) => {
  const next = new Set<number>()
  for (const index of touched) {
    next.add(index === from ? to : index === to ? from : index)
  }
  return next
}

export const LinksEditor = ({ error, id, onChange, value }: LinksEditorProps) => {
  const [touched, setTouched] = useState<Set<number>>(() => new Set())
  const helpId = `${id}-help`

  const updateLink = (index: number, update: Partial<PortfolioLink>) => {
    onChange(value.map((link, currentIndex) => (currentIndex === index ? { ...link, ...update } : link)))
  }

  const moveLink = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setTouched((current) => updateTouched(current, index, target))
    document.getElementById(`${id}-${target}-url`)?.focus()
  }

  const removeLink = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index))
    setTouched((current) => new Set([...current].filter((currentIndex) => currentIndex !== index).map((currentIndex) => currentIndex > index ? currentIndex - 1 : currentIndex)))
  }

  return (
    <div className="field link-editor" id={id} role="group" aria-labelledby={`${id}-label`} aria-describedby={error ? `${helpId} ${id}-error` : helpId}>
      <h3 id={`${id}-label`}>Links</h3>
      <p className="field__help" id={helpId}>Add a URL, choose its type, and optionally provide a display label.</p>
      {error ? <p className="field__error" id={`${id}-error`}>{error}</p> : null}
      {value.map((link, index) => {
        const rowId = `${id}-${index}`
        const linkError = error || touched.has(index) ? getPortfolioLinkError(link) : undefined
        return (
          <fieldset className="link-editor__row" key={rowId}>
            <legend>Link {index + 1}</legend>
            <FormField
              control="select"
              id={`${rowId}-kind`}
              label={`Link ${index + 1} type`}
              value={link.kind}
              onChange={(event) => {
                const selected = PORTFOLIO_LINK_KINDS.find((kind) => kind.value === event.target.value)
                if (selected) updateLink(index, { kind: selected.value })
              }}
            >
              {PORTFOLIO_LINK_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>{kind.label}</option>
              ))}
            </FormField>
            <FormField
              id={`${rowId}-url`}
              label={`Link ${index + 1} URL`}
              value={link.url.replace(/^mailto:/i, '')}
              type={link.kind === 'email' ? 'email' : 'url'}
              inputMode={link.kind === 'email' ? 'email' : 'url'}
              error={linkError}
              helpText={link.kind === 'email' ? 'Enter an email address.' : 'Enter a complete http(s) URL.'}
              onBlur={() => setTouched((current) => new Set(current).add(index))}
              onChange={(event) => updateLink(index, { url: event.target.value })}
            />
            <FormField
              id={`${rowId}-label`}
              label={`Link ${index + 1} label`}
              value={link.label}
              onChange={(event) => updateLink(index, { label: event.target.value })}
            />
            <div className="link-editor__actions">
              <Button type="button" variant="ghost" aria-label={`Move link ${index + 1} up`} disabled={index === 0} onClick={() => moveLink(index, -1)}>
                Up
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Move link ${index + 1} down`}
                disabled={index === value.length - 1}
                onClick={() => moveLink(index, 1)}
              >
                Down
              </Button>
              <Button type="button" variant="ghost" aria-label={`Remove link ${index + 1}`} onClick={() => removeLink(index)}>
                Remove
              </Button>
            </div>
          </fieldset>
        )
      })}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange([...value, { kind: 'website', url: '', label: '' }])}
      >
        Add link
      </Button>
    </div>
  )
}
