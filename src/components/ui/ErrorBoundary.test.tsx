import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

const BadComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Explosion!')
  }
  return <div>Safe Content</div>
}

const TestHarness = () => {
  const [shouldThrow, setShouldThrow] = useState(true)
  const [resetKey, setResetKey] = useState(0)

  return (
    <div>
      <button type="button" onClick={() => setResetKey((k) => k + 1)}>
        Bump Key
      </button>
      <button type="button" onClick={() => setShouldThrow(false)}>
        Fix Component
      </button>
      <ErrorBoundary resetKeys={[resetKey]}>
        <BadComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  )
}

describe('ErrorBoundary', () => {
  it('catches render errors and recovers when Try again is clicked after fix', async () => {
    // Suppress console.error during expected throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<TestHarness />)

    expect(screen.getByRole('alert')).toHaveTextContent('Explosion!')
    expect(screen.queryByText('Safe Content')).not.toBeInTheDocument()

    // Fix underlying error then trigger reset via button
    await userEvent.click(screen.getByRole('button', { name: 'Fix Component' }))
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('Safe Content')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('automatically resets when resetKeys change', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<TestHarness />)

    expect(screen.getByRole('alert')).toHaveTextContent('Explosion!')

    await userEvent.click(screen.getByRole('button', { name: 'Fix Component' }))
    await userEvent.click(screen.getByRole('button', { name: 'Bump Key' }))

    expect(screen.getByText('Safe Content')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
