import type { Decorator } from '@storybook/react'
import type { Folder, Portfolio, PortfolioContent, TemplateWithMetadata } from '@/types'

/**
 * Deterministic fakes for stories. Stories must not reach the network, so they render components
 * with these values instead of calling `folderData` / `stellarService`.
 */
export const fakeOwner = 'GAPAMTTVHB7RZ5DQHEINZN3GQYRCXXWNCQNQSY5YAU6RKQUYX2QJT2CM'
export const fakeCid = 'bafkreie33ewzcjvpo3gldpvqgevtoy4oaygkqri3cwxqr6o6lsqc4jqvwu'
export const fakeTxHash = '3f659a4283badbb3ee509652b8fbb1ebf0c80124b02a0485f6695f830f94dc40'

export const fakeFolder: Folder = {
  owner: fakeOwner,
  name: 'jane.folder',
  templateId: 1,
  claimedAt: '2026-11-09T22:22:27.000Z',
  updatedAt: '2026-11-09T22:23:07.000Z',
}

export const fakePortfolio: Portfolio = {
  owner: fakeOwner,
  templateId: 1,
  ipfsCid: fakeCid,
  mintedAt: '2026-11-09T22:23:07.000Z',
  updatedAt: '2026-11-09T22:23:52.000Z',
}

export const fakePortfolioContent: PortfolioContent = {
  schema_version: 1,
  folder: 'jane.folder',
  template_id: 1,
  name: 'Jane Doe',
  headline: 'Backend engineer, Stellar enthusiast',
  bio: 'I build payment rails and developer tooling on Stellar.',
  skills: ['TypeScript', 'Rust', 'Soroban'],
  links: ['https://github.com/janedoe', 'https://janedoe.dev'],
  sections: {
    projects: 'Folder — verifiable portfolios on Stellar.',
    work_history: 'Acme — Payments engineer (2022–now).',
    experience: 'Acme — Payments engineer (2022–now).',
    certifications: 'Stellar Developer Fundamentals',
    references: 'Available on request.',
  },
  updated_at: '2026-11-09T22:23:52.000Z',
}

export const fakeTemplates: TemplateWithMetadata[] = [
  {
    id: 1,
    metadataUri: 'ipfs://bafkreiejxg6d3gqvi3737mcwxkv4u7gismaraxgv5zfoqtfuc3nbdgve7i',
    creator: null,
    registeredAt: '2026-11-09T22:14:42.000Z',
    metadata: {
      schema_version: 1,
      template_id: 1,
      name: 'Developer',
      description: 'Clean single-page layout for software engineers.',
      target_industry: 'Software Engineering',
      fields: ['bio', 'github', 'skills', 'projects', 'work_history'],
    },
  },
  {
    id: 2,
    metadataUri: 'ipfs://bafkreiejxg6d3gqvi3737mcwxkv4u7gismaraxgv5zfoqtfuc3nbdgve7i',
    creator: null,
    registeredAt: '2026-11-09T22:14:42.000Z',
    metadata: {
      schema_version: 1,
      template_id: 2,
      name: 'Designer',
      description: 'Visual-first layout with a card grid.',
      target_industry: 'Design',
      fields: ['bio', 'skills', 'case_studies'],
    },
  },
]

/** Wraps a story in a fixed-width container so layout primitives render at a realistic size. */
export const withContainer: Decorator = (Story) => (
  <div style={{ maxWidth: '48rem', padding: '1.5rem' }}>
    <Story />
  </div>
)
