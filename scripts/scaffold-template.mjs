#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Parse CLI arguments: --id, --name, --industry, --fields
const args = process.argv.slice(2)
const getArg = (flag, fallback) => {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback
}

const idStr = getArg('--id', '4')
const templateId = parseInt(idStr, 10)
const name = getArg('--name', 'Executive')
const industry = getArg('--industry', 'Leadership')
const rawFields = getArg('--fields', 'bio,leadership_roles,achievements')
const fields = rawFields.split(',').map((f) => f.trim()).filter(Boolean)

console.log(`Scaffolding template #${templateId}: "${name}" (${industry})...`)

// 1. Layout Component
const layoutDir = path.join(rootDir, 'src/features/public-portfolio/templates/layouts')
fs.mkdirSync(layoutDir, { recursive: true })
const layoutFile = path.join(layoutDir, `${name}Layout.tsx`)

const layoutContent = `import { ExternalLink } from '@/components/ui'
import { humanizeField } from '@/utils/format'
import type { TemplateRendererProps } from '../types'

export const ${name}Layout = ({ content }: TemplateRendererProps) => {
  return (
    <article className="portfolio portfolio--${name.toLowerCase()}">
      <header className="portfolio__header">
        <h1>{content.name}</h1>
        {content.headline ? <p className="portfolio__headline">{content.headline}</p> : null}
        <p className="muted mono">{content.folder}</p>
      </header>
      <p className="portfolio__prose">{content.bio}</p>
      {content.skills.length > 0 ? (
        <section className="portfolio__section" aria-label="Skills">
          <h2>Skills</h2>
          <ul className="tag-list">
            {content.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {Object.entries(content.sections)
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => (
          <section key={key} className="portfolio__section">
            <h2>{humanizeField(key)}</h2>
            <p className="portfolio__prose">{value}</p>
          </section>
        ))}
      {content.links.length > 0 ? (
        <ul className="portfolio__links" aria-label="Links">
          {content.links.map((link) => (
            <li key={link}>
              <ExternalLink href={link}>{link.replace(/^https?:\\/\\//, '')}</ExternalLink>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export default ${name}Layout
`

fs.writeFileSync(layoutFile, layoutContent)
console.log(`Created layout: ${path.relative(rootDir, layoutFile)}`)

// 2. Layout Test
const testFile = path.join(layoutDir, `${name}Layout.test.tsx`)
const testContent = `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PortfolioContent } from '@/types'
import { ${name}Layout } from './${name}Layout'

const sampleContent: PortfolioContent = {
  schema_version: 1,
  folder: 'sample.folder',
  template_id: ${templateId},
  name: 'Sample Person',
  headline: 'Executive Lead',
  bio: 'Track record of delivering results.',
  skills: ['Leadership', 'Strategy'],
  links: ['https://example.com'],
  sections: { leadership_roles: 'CEO at Global Inc.' },
  updated_at: '2026-11-22T00:00:00.000Z',
}

describe('${name}Layout', () => {
  it('renders sample portfolio content', () => {
    render(<${name}Layout content={sampleContent} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Sample Person' })).toBeInTheDocument()
    expect(screen.getByText('Leadership')).toBeInTheDocument()
  })
})
`

fs.writeFileSync(testFile, testContent)
console.log(`Created test: ${path.relative(rootDir, testFile)}`)

// 3. Metadata JSON
const metaDir = path.join(rootDir, 'templates')
fs.mkdirSync(metaDir, { recursive: true })
const metaFile = path.join(metaDir, `${templateId}.json`)
const metaContent = {
  schema_version: 1,
  template_id: templateId,
  name,
  description: `${industry} portfolio layout for professionals.`,
  target_industry: industry,
  fields,
}
fs.writeFileSync(metaFile, JSON.stringify(metaContent, null, 2) + '\n')
console.log(`Created metadata: ${path.relative(rootDir, metaFile)}`)

console.log(`\nTemplate #${templateId} successfully scaffolded!`)
