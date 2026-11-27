import type { TemplateWithMetadata } from '@/types'

export interface JsonResumeMappedValues {
  name: string
  headline: string
  bio: string
  skills: string
  links: string
  sections: Record<string, string>
}

interface JsonResumeBasics {
  name?: unknown
  label?: unknown
  summary?: unknown
  url?: unknown
  profiles?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(text).filter(Boolean) : []

const formatEntry = (entry: Record<string, unknown>, fields: string[]): string => {
  const parts = fields.map((field) => {
    const value = entry[field]
    if (Array.isArray(value)) return stringList(value).join(', ')
    return text(value)
  }).filter(Boolean)
  return parts.join(' — ')
}

const formatEntries = (value: unknown, fields: string[]): string => {
  if (!Array.isArray(value)) return ''
  return value
    .filter(isRecord)
    .map((entry) => formatEntry(entry, fields))
    .filter(Boolean)
    .join('\n\n')
}

/** Maps a minimally validated JSON Resume document into Indexer's existing portfolio form values. */
export const fromJsonResume = (doc: unknown, template: TemplateWithMetadata | null): JsonResumeMappedValues => {
  if (!isRecord(doc)) throw new Error('resume.json must contain a JSON object at its root.')

  const basics = isRecord(doc.basics) ? doc.basics as JsonResumeBasics : {}
  const links = [text(basics.url)]
  if (Array.isArray(basics.profiles)) {
    for (const profile of basics.profiles) {
      if (isRecord(profile)) {
        const url = text(profile.url)
        if (url) links.push(url)
      }
    }
  }

  const skills = Array.isArray(doc.skills)
    ? doc.skills
        .filter(isRecord)
        .flatMap((skill) => [text(skill.name), ...stringList(skill.keywords)])
        .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index)
        .join(', ')
    : ''

  const sectionValues: Record<string, string> = {
    work_history: formatEntries(doc.work, ['name', 'position', 'startDate', 'endDate', 'summary']),
    experience: formatEntries(doc.work, ['name', 'position', 'startDate', 'endDate', 'summary']),
    education: formatEntries(doc.education, ['institution', 'studyType', 'area', 'startDate', 'endDate']),
    projects: formatEntries(doc.projects, ['name', 'description', 'startDate', 'endDate', 'url']),
    case_studies: formatEntries(doc.projects, ['name', 'description', 'startDate', 'endDate', 'url']),
    volunteer: formatEntries(doc.volunteer, ['organization', 'position', 'startDate', 'endDate', 'summary']),
    awards: formatEntries(doc.awards, ['title', 'awarder', 'date', 'summary']),
    publications: formatEntries(doc.publications, ['name', 'publisher', 'releaseDate', 'url', 'summary']),
    certifications: formatEntries(doc.certificates, ['name', 'issuer', 'date', 'url']),
    references: formatEntries(doc.references, ['name', 'reference']),
  }

  const fields = template?.metadata?.fields ?? []
  const sections = Object.fromEntries(fields
    .filter((field) => !['bio', 'skills', 'name', 'headline', 'links'].includes(field))
    .map((field) => [field, sectionValues[field] ?? ''])
    .filter(([, value]) => value))

  return {
    name: text(basics.name),
    headline: text(basics.label),
    bio: text(basics.summary),
    skills,
    links: Array.from(new Set(links)).filter(Boolean).join(', '),
    sections,
  }
}

/** Parses and minimally validates a JSON Resume document for the import preview. */
export const parseJsonResume = (textDocument: string): unknown => {
  let doc: unknown
  try {
    doc = JSON.parse(textDocument)
  } catch {
    throw new Error('resume.json is not valid JSON. Check for missing quotes, commas, or brackets.')
  }
  if (!isRecord(doc)) throw new Error('resume.json must contain a JSON object at its root.')

  const basics = isRecord(doc.basics) ? doc.basics : null
  if (!basics) throw new Error('Missing "basics" object. Add at least basics.name and basics.summary.')

  if ('name' in basics && typeof basics.name !== 'string') throw new Error('basics.name must be a string.')
  if ('label' in basics && typeof basics.label !== 'string') throw new Error('basics.label must be a string.')
  if ('summary' in basics && typeof basics.summary !== 'string') throw new Error('basics.summary must be a string.')
  if ('url' in basics && typeof basics.url !== 'string') throw new Error('basics.url must be a string.')
  if ('profiles' in basics && basics.profiles !== undefined && !Array.isArray(basics.profiles)) {
    throw new Error('basics.profiles must be an array.')
  }

  for (const key of ['skills', 'work', 'education', 'projects', 'volunteer', 'awards', 'publications', 'certificates', 'references'] as const) {
    if (key in doc && doc[key] !== undefined && !Array.isArray(doc[key])) {
      throw new Error(`"${key}" must be an array when provided.`)
    }
  }

  return doc
}
