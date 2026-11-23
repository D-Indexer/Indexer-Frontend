import { describe, expect, it } from 'vitest'
import { diffLines, diffPortfolioContent } from './diffPortfolioContent'

const base = { name: 'Jane', headline: 'Dev', bio: 'Hello', skills: ['Rust', 'React'], links: ['https://a.com'], sections: { projects: 'One' } }

describe('diffPortfolioContent', () => {
  it('returns nothing for identical content', () => {
    expect(diffPortfolioContent(base, { ...base })).toEqual([])
  })

  it('reports changed scalar fields with a line diff', () => {
    const [change] = diffPortfolioContent(base, { ...base, bio: 'Hello\nWorld' })
    expect(change).toMatchObject({ field: 'bio', kind: 'changed', whitespaceOnly: false })
    expect(change.kind === 'changed' && change.lines).toEqual([
      { text: 'Hello', type: 'same' },
      { text: 'World', type: 'added' },
    ])
  })

  it('flags whitespace-only changes', () => {
    const [change] = diffPortfolioContent(base, { ...base, bio: 'Hello  ' })
    expect(change).toMatchObject({ field: 'bio', kind: 'changed', whitespaceOnly: true })
  })

  it('reports added and removed array items', () => {
    const changes = diffPortfolioContent(base, { ...base, skills: ['React', 'Go'], links: [] })
    expect(changes).toContainEqual({ field: 'skills', kind: 'changed-list', added: ['Go'], removed: ['Rust'], reordered: false })
    expect(changes).toContainEqual({ field: 'links', kind: 'removed', before: ['https://a.com'] })
  })

  it('detects reordering', () => {
    expect(diffPortfolioContent(base, { ...base, skills: ['React', 'Rust'] })).toEqual([
      { field: 'skills', kind: 'changed-list', added: [], removed: [], reordered: true },
    ])
  })

  it('reports sections keys added, removed and changed', () => {
    const changes = diffPortfolioContent(base, { ...base, sections: { experience: 'Acme' } })
    expect(changes).toEqual([
      { field: 'sections.experience', kind: 'added', after: 'Acme' },
      { field: 'sections.projects', kind: 'removed', before: 'One' },
    ])
    expect(diffPortfolioContent(base, { ...base, sections: { projects: 'Two' } })[0]).toMatchObject({ field: 'sections.projects', kind: 'changed' })
  })

  it('treats empty and missing values alike and handles added headline', () => {
    expect(diffPortfolioContent({ ...base, headline: '' }, { ...base, headline: '  ' })).toEqual([])
    expect(diffPortfolioContent({ ...base, headline: '' }, base)).toEqual([{ field: 'headline', kind: 'added', after: 'Dev' }])
  })
})

describe('diffLines', () => {
  it('marks removed and added lines', () => {
    expect(diffLines('a\nb\nc', 'a\nx\nc')).toEqual([
      { text: 'a', type: 'same' },
      { text: 'b', type: 'removed' },
      { text: 'x', type: 'added' },
      { text: 'c', type: 'same' },
    ])
  })
})
