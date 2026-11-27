import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CID_V1 } from '@/testing/fixtures'
import { PrintFooter } from './PrintFooter'

describe('PrintFooter', () => {
  it('renders the print-only verification summary with a QR code', () => {
    render(
      <PrintFooter checkedAt={new Date('2026-11-25T10:00:00Z')} cid={CID_V1} url="https://folder.example/p/jane.folder" verified />,
    )
    const footer = screen.getByRole('contentinfo', { name: 'Verification summary' })
    expect(footer).toHaveClass('print-only')
    expect(footer).toHaveTextContent(`Verified on Stellar`)
    expect(footer).toHaveTextContent(`CID ${CID_V1}, checked 2026-11-25`)
    expect(footer.querySelector('svg')).not.toBeNull()
  })
})
