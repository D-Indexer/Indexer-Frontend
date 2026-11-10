import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfigErrorScreen } from './ConfigErrorScreen'

describe('ConfigErrorScreen', () => {
  it('lists each configuration problem', () => {
    render(
      <ConfigErrorScreen
        issues={[
          { variable: 'VITE_API_URL', message: 'Required.' },
          { variable: 'VITE_FOLDER_CONTRACT_ID', message: 'Required.' },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Folder is not configured' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('VITE_FOLDER_CONTRACT_ID')).toBeInTheDocument()
  })
})
