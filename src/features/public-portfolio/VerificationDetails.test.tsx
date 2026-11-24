import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CID_V2, OWNER } from '@/testing/fixtures'
import { buildVerificationCommands, VerificationDetails } from './components/VerificationDetails'
import type { VerificationFacts } from './hooks/usePublicPortfolio'

const CONTRACT = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

const facts = (overrides: Partial<VerificationFacts> = {}): VerificationFacts => ({
  contractId: CONTRACT,
  network: 'testnet',
  owner: OWNER,
  onChainCid: CID_V2,
  templateId: 3,
  mintedAt: 1_700_000_000,
  contentLoaded: true,
  ...overrides,
})

describe('VerificationDetails', () => {
  it('lists every fact and reproducible commands when verified', () => {
    const f = facts()
    render(<VerificationDetails facts={f} status="verified" />)
    expect(screen.getByText('How this was verified')).toBeInTheDocument()
    expect(screen.getByText(CID_V2)).toBeInTheDocument()
    expect(screen.getByText('2023-11-14T22:13:20.000Z')).toBeInTheDocument()
    expect(screen.getByText('Content fetched by the on-chain CID')).toBeInTheDocument()
    expect(buildVerificationCommands(f)).toEqual([
      `stellar contract invoke --id ${CONTRACT} --network testnet -- get_portfolio --owner ${OWNER}`,
      `ipfs cat ${CID_V2} | sha256sum`,
      `ipfs cid format -v 1 -b base32 ${CID_V2}`,
    ])
    expect(screen.getByRole('link', { name: 'Contract on stellar.expert' })).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/testnet/contract/${CONTRACT}`,
    )
    expect(screen.getByRole('link', { name: 'Owner on stellar.expert' })).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/testnet/account/${OWNER}`,
    )
    expect(screen.getByRole('button', { name: 'Copy Contract ID' })).toBeInTheDocument()
  })

  it('omits IPFS commands when nothing is minted', () => {
    const f = facts({ onChainCid: null, templateId: null, mintedAt: null, contentLoaded: false })
    render(<VerificationDetails facts={f} status="not_minted" />)
    expect(screen.getByText('Nothing to check: no portfolio minted')).toBeInTheDocument()
    expect(buildVerificationCommands(f)).toHaveLength(1)
    expect(screen.queryByText(/sha256sum/)).not.toBeInTheDocument()
  })

  it('says the check was not performed when the contract is unavailable', () => {
    render(<VerificationDetails facts={facts({ onChainCid: null, templateId: null, mintedAt: null, contentLoaded: false })} status="unavailable" />)
    expect(screen.getByText('Not checked')).toBeInTheDocument()
    expect(screen.getAllByText('Not available').length).toBeGreaterThan(0)
  })
})
