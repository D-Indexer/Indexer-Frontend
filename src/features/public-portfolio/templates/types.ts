import type React from 'react'
import type { PortfolioContent } from '@/types'
import type { Verification } from '../hooks/usePublicPortfolio'

export interface TemplateRendererProps {
  content: PortfolioContent
  verification?: Verification
}

export interface TemplateRenderer {
  Component: React.ComponentType<TemplateRendererProps>
  id: number
  name: string
  supportedSchemaVersions: number[]
  version: string
}
