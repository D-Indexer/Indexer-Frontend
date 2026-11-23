import { Button } from '@/components/ui'
import { humanizeField } from '@/utils/format'
import type { FieldChange } from '../utils/diffPortfolioContent'

const label = (field: string) => (field.startsWith('sections.') ? humanizeField(field.slice('sections.'.length)) : humanizeField(field))
const text = (value: string | string[]) => (Array.isArray(value) ? value.join(', ') : value)

const Change = ({ change }: { change: FieldChange }) => {
  switch (change.kind) {
    case 'added':
      return <p>Added: <ins>{text(change.after)}</ins></p>
    case 'removed':
      return <p>Removed: <del>{text(change.before)}</del></p>
    case 'changed-list':
      return (
        <p>
          {change.added.length > 0 ? <>Added: <ins>{change.added.join(', ')}</ins>. </> : null}
          {change.removed.length > 0 ? <>Removed: <del>{change.removed.join(', ')}</del>. </> : null}
          {change.reordered ? 'Order changed.' : null}
        </p>
      )
    case 'changed':
      return (
        <>
          {change.whitespaceOnly ? <p className="muted">Whitespace-only change.</p> : null}
          <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>
            {change.lines.map((line, index) =>
              line.type === 'added' ? (
                <ins key={index} style={{ display: 'block' }}>+ {line.text}</ins>
              ) : line.type === 'removed' ? (
                <del key={index} style={{ display: 'block' }}>- {line.text}</del>
              ) : (
                <span key={index} style={{ display: 'block' }}>  {line.text}</span>
              ),
            )}
          </pre>
        </>
      )
  }
}

interface DiffReviewProps {
  changes: FieldChange[]
  confirmLabel: string
  onBack: () => void
  onConfirm: () => void
}

/** Review step shown between "Save" and the upload/sign stages of an update. */
export const DiffReview = ({ changes, confirmLabel, onBack, onConfirm }: DiffReviewProps) => (
  <section className="form" aria-labelledby="diff-review-title">
    <h2 id="diff-review-title" className="form__title">Review your changes</h2>
    <p>These changes will be anchored on-chain as a permanent, public record.</p>
    {changes.length === 0 ? <p role="status">No changes compared with the published version.</p> : null}
    <ul aria-label="Changes">
      {changes.map((change) => (
        <li key={change.field}>
          <h3>{label(change.field)}</h3>
          <Change change={change} />
        </li>
      ))}
    </ul>
    <div>
      <Button type="button" onClick={onConfirm}>{confirmLabel}</Button>{' '}
      <Button type="button" variant="secondary" onClick={onBack}>Back to editing</Button>
    </div>
  </section>
)
