import type { PortfolioContent } from '@/types'

export interface LineDiff {
  text: string
  type: 'added' | 'removed' | 'same'
}

export type FieldChange =
  | { field: string; kind: 'added'; after: string | string[] }
  | { field: string; kind: 'removed'; before: string | string[] }
  | { field: string; kind: 'changed'; before: string; after: string; lines: LineDiff[]; whitespaceOnly: boolean }
  | { field: string; kind: 'changed-list'; added: string[]; removed: string[]; reordered: boolean }

type Diffable = Pick<PortfolioContent, 'name' | 'headline' | 'bio' | 'skills' | 'links' | 'sections'>

const isEmptyText = (value: string | undefined) => !value || value.trim() === ''
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

/** Line-based diff using a longest-common-subsequence table. */
export const diffLines = (before: string, after: string): LineDiff[] => {
  const a = before.split('\n')
  const b = after.split('\n')
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const result: LineDiff[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ text: a[i], type: 'same' })
      i += 1
      j += 1
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ text: a[i], type: 'removed' })
      i += 1
    } else {
      result.push({ text: b[j], type: 'added' })
      j += 1
    }
  }
  for (; i < a.length; i += 1) result.push({ text: a[i], type: 'removed' })
  for (; j < b.length; j += 1) result.push({ text: b[j], type: 'added' })
  return result
}

const diffText = (field: string, before: string | undefined, after: string | undefined): FieldChange | null => {
  const emptyBefore = isEmptyText(before)
  const emptyAfter = isEmptyText(after)
  if (emptyBefore && emptyAfter) return null
  if (emptyBefore) return { field, kind: 'added', after: after as string }
  if (emptyAfter) return { field, kind: 'removed', before: before as string }
  if (before === after) return null
  return {
    field,
    kind: 'changed',
    before: before as string,
    after: after as string,
    lines: diffLines(before as string, after as string),
    whitespaceOnly: normalize(before as string) === normalize(after as string),
  }
}

const diffList = (field: string, before: string[] = [], after: string[] = []): FieldChange | null => {
  if (before.length === 0 && after.length === 0) return null
  if (before.length === 0) return { field, kind: 'added', after }
  if (after.length === 0) return { field, kind: 'removed', before }
  const added = after.filter((item) => !before.includes(item))
  const removed = before.filter((item) => !after.includes(item))
  const reordered = added.length === 0 && removed.length === 0 && before.join('\u0000') !== after.join('\u0000')
  if (added.length === 0 && removed.length === 0 && !reordered) return null
  return { field, kind: 'changed-list', added, removed, reordered }
}

/**
 * Field-by-field difference between the published content (`before`) and the edited content
 * (`after`). Metadata such as `updated_at` is ignored. Section changes are reported as
 * `sections.<key>`.
 */
export const diffPortfolioContent = (before: Diffable, after: Diffable): FieldChange[] => {
  const changes: Array<FieldChange | null> = [
    diffText('name', before.name, after.name),
    diffText('headline', before.headline, after.headline),
    diffText('bio', before.bio, after.bio),
    diffList('skills', before.skills, after.skills),
    diffList('links', before.links, after.links),
  ]
  const beforeSections = before.sections ?? {}
  const afterSections = after.sections ?? {}
  const keys = [...new Set([...Object.keys(beforeSections), ...Object.keys(afterSections)])].sort()
  for (const key of keys) changes.push(diffText(`sections.${key}`, beforeSections[key], afterSections[key]))
  return changes.filter((change): change is FieldChange => change !== null)
}
