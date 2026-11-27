import React, { lazy } from 'react'
import { GenericLayout } from './layouts/GenericLayout'
import type { TemplateRendererProps } from './types'

// Lazy loaded layout chunks
const DeveloperLayout = lazy(() => import('./layouts/DeveloperLayout'))
const DesignerLayout = lazy(() => import('./layouts/DesignerLayout'))
const OperationsLayout = lazy(() => import('./layouts/OperationsLayout'))

export interface TemplateRegistryEntry {
  id: number
  name: string
  version: string
  supportedSchemaVersions: number[]
  Renderer: React.LazyExoticComponent<React.ComponentType<TemplateRendererProps>> | React.ComponentType<TemplateRendererProps>
}

export const templateRegistry: Record<number, TemplateRegistryEntry> = {
  1: {
    id: 1,
    name: 'Developer',
    version: '1.0.0',
    supportedSchemaVersions: [1],
    Renderer: DeveloperLayout,
  },
  2: {
    id: 2,
    name: 'Designer',
    version: '1.0.0',
    supportedSchemaVersions: [1],
    Renderer: DesignerLayout,
  },
  3: {
    id: 3,
    name: 'Operations',
    version: '1.0.0',
    supportedSchemaVersions: [1],
    Renderer: OperationsLayout,
  },
}

export const getTemplateRenderer = (
  templateId: number | null,
): React.LazyExoticComponent<React.ComponentType<TemplateRendererProps>> | React.ComponentType<TemplateRendererProps> => {
  if (templateId !== null && templateRegistry[templateId]) {
    return templateRegistry[templateId].Renderer
  }
  return GenericLayout
}
