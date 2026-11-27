import { describe, expect, it } from 'vitest'
import { developerTemplate } from '@/testing/fixtures'
import { fromJsonResume, parseJsonResume } from './jsonResume'

const sample = {
  basics: {
    name: 'Richard Hendriks',
    label: 'Programmer',
    summary: 'Richard hails from Tulsa.',
    url: 'https://richardhendricks.com',
    profiles: [{ network: 'GitHub', url: 'https://github.com/richardhendricks' }],
  },
  work: [{ name: 'Pied Piper', position: 'CEO', startDate: '2013-12-01', endDate: '2014-12-01', summary: 'Build a compression company.' }],
  education: [{ institution: 'University of Oklahoma', studyType: 'Bachelor', area: 'Information Technology', startDate: '2011-06-01', endDate: '2014-01-01' }],
  skills: [{ name: 'Web Development', keywords: ['HTML', 'CSS', 'JavaScript'] }],
  projects: [{ name: 'Pied Piper', description: 'Middle-out compression', url: 'https://piedpiper.com' }],
}

describe('JSON Resume mapper', () => {
  it('maps the official sample shape into portfolio form values', () => {
    const doc = parseJsonResume(JSON.stringify(sample))
    expect(fromJsonResume(doc, developerTemplate)).toEqual({
      name: 'Richard Hendriks',
      headline: 'Programmer',
      bio: 'Richard hails from Tulsa.',
      skills: 'Web Development, HTML, CSS, JavaScript',
      links: 'https://richardhendricks.com, https://github.com/richardhendricks',
      sections: {
        projects: 'Pied Piper — Middle-out compression — https://piedpiper.com',
        work_history: 'Pied Piper — CEO — 2013-12-01 — 2014-12-01 — Build a compression company.',
      },
    })
  })

  it('returns precise parse errors and rejects wrong types', () => {
    expect(() => parseJsonResume('{oops')).toThrow('not valid JSON')
    expect(() => parseJsonResume('{"basics": null}')).toThrow('Missing "basics" object')
    expect(() => parseJsonResume('{"basics":{"name":42}}')).toThrow('basics.name must be a string')
    expect(() => parseJsonResume('{"basics":{},"work":{}}')).toThrow('"work" must be an array')
  })

  it('maps label and summary but does not require them', () => {
    expect(fromJsonResume({ basics: { name: 'Jane' } }, developerTemplate)).toMatchObject({
      name: 'Jane', headline: '', bio: '', skills: '', links: '', sections: {},
    })
  })
})
