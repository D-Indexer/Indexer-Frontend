import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfflineBanner } from './DemoBanner'

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('announces offline state and clears on reconnect', () => {
    render(<OfflineBanner />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByRole('status')).toHaveTextContent('You are offline.')

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('announces an unreachable backend', () => {
    render(<OfflineBanner />)

    act(() => {
      window.dispatchEvent(new Event('indexer:backend-unreachable'))
    })
    expect(screen.getByRole('status')).toHaveTextContent('Backend unreachable.')
  })
})