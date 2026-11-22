import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { LoadingState } from '@/components/ui'
import type { PortfolioContent } from '@/types'
import { GenericLayout } from './layouts/GenericLayout'
import { getTemplateRenderer } from './registry'

interface ViewProps {
  content: PortfolioContent
}

interface PortfolioViewProps extends ViewProps {
  templateId: number | null
}

interface TemplateErrorBoundaryProps {
  children: ReactNode
  fallbackContent: PortfolioContent
}

interface TemplateErrorBoundaryState {
  hasError: boolean
}

class TemplateErrorBoundary extends Component<TemplateErrorBoundaryProps, TemplateErrorBoundaryState> {
  override state: TemplateErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): TemplateErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TemplateRenderer error, falling back to GenericLayout:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return <GenericLayout content={this.props.fallbackContent} />
    }
    return this.props.children
  }
}

/** Renders portfolio content using the lazy template registry, with fallback to generic layout. */
export const PortfolioView = ({ content, templateId }: PortfolioViewProps) => {
  const Renderer = getTemplateRenderer(templateId)

  return (
    <TemplateErrorBoundary fallbackContent={content}>
      <Suspense fallback={<LoadingState label="Loading template layout…" />}>
        <Renderer content={content} />
      </Suspense>
    </TemplateErrorBoundary>
  )
}
