import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TxStatus } from './TxStatus'

describe('TxStatus inspection drawer', () => {
  it('renders a keyboard-accessible details disclosure for a prepared transaction', () => {
    render(<TxStatus error={null} hash={null} stage="signing" successMessage="done" prepared={{ method: 'claim_folder', hash: 'abc', xdr: 'AAAA' }} />)
    expect(screen.getByText('Show technical details')).toBeTruthy()
    expect(screen.getByLabelText('Prepared transaction XDR')).toHaveValue('AAAA')
  })
})
