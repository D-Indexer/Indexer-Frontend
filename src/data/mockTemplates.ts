import type { Template } from '@/types'

export const mockTemplates: Template[] = [
  {
    id: 'developer',
    name: 'Developer Portfolio',
    creator: 'Folder',
    description: 'Technical profile layout for projects, repositories, skills, and proof of work.',
    price: 12,
    schema: { sections: ['bio', 'skills', 'projects', 'links'] },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'designer',
    name: 'Designer Portfolio',
    creator: 'Folder',
    description: 'Visual-first layout for case studies, media, brand work, and client outcomes.',
    price: 15,
    schema: { sections: ['bio', 'caseStudies', 'gallery', 'links'] },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'operator',
    name: 'Operator Portfolio',
    creator: 'Folder',
    description: 'Outcome-focused profile for operations, administration, process, and execution work.',
    price: 9,
    schema: { sections: ['bio', 'experience', 'systems', 'links'] },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]
