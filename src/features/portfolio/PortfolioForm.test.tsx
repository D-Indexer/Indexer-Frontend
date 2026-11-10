import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFolder, buildPortfolio, CID_V1, CID_V2, connectTestnetWallet, developerTemplate, OWNER, TX_HASH } from '@/testing/fixtures'

const invoke = vi.hoisted(() => vi.fn())
const upload = vi.hoisted(() => vi.fn())
const data = vi.hoisted(() => ({ listTemplates: vi.fn(), getPortfolioContent: vi.fn() }))

vi.mock('@/services/stellar/stellarService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/stellarService')>()
  return { ...original, stellarService: { ...original.stellarService, invoke } }
})
vi.mock('@/services/ipfs/ipfsService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/ipfs/ipfsService')>()
  return { ...original, ipfsService: { ...original.ipfsService, uploadPortfolioContent: upload } }
})
vi.mock('@/services/data/folderData', () => ({ folderData: data }))

const { PortfolioForm } = await import('./components/PortfolioForm')

describe('PortfolioForm', () => {
  beforeEach(() => {
    invoke.mockReset().mockResolvedValue({ hash: TX_HASH, ledger: 1 })
    upload.mockReset().mockResolvedValue(CID_V2)
    data.listTemplates.mockResolvedValue([developerTemplate])
    connectTestnetWallet()
  })

  it('validates required fields and URLs next to each field', async () => {
    render(<PortfolioForm owner={OWNER} folder={buildFolder()} portfolio={null} initialTemplateId="1" onPublished={vi.fn()} />)
    await screen.findByRole('option', { name: 'Developer (#1)' })
    await userEvent.type(screen.getByLabelText(/Links/), 'not-a-url')
    await userEvent.click(screen.getByRole('button', { name: 'Upload and mint portfolio' }))

    expect(screen.getByLabelText(/^Name/)).toHaveAccessibleDescription('Enter the name to show on your portfolio.')
    expect(screen.getByLabelText(/^Name/)).toHaveFocus()
    expect(screen.getByLabelText(/^Bio/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/Links/)).toHaveAccessibleDescription(expect.stringContaining('not-a-url'))
    expect(upload).not.toHaveBeenCalled()
  })

  it('uploads content through the backend, then mints with the returned CID', async () => {
    const onPublished = vi.fn()
    render(<PortfolioForm owner={OWNER} folder={buildFolder()} portfolio={null} initialTemplateId="1" onPublished={onPublished} />)
    await screen.findByRole('option', { name: 'Developer (#1)' })
    expect(screen.getByLabelText(/Template/)).toHaveValue('1')
    await userEvent.type(screen.getByLabelText(/^Name/), 'Jane Doe')
    await userEvent.type(screen.getByLabelText(/^Bio/), 'I build things.')
    await userEvent.type(screen.getByLabelText(/Skills/), 'Rust, React')
    await userEvent.type(screen.getByLabelText('Projects'), 'Folder')
    await userEvent.click(screen.getByRole('button', { name: 'Upload and mint portfolio' }))

    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        schema_version: 1,
        folder: 'jane.folder',
        template_id: 1,
        name: 'Jane Doe',
        skills: ['Rust', 'React'],
        sections: { projects: 'Folder' },
      }),
    )
    expect(invoke).toHaveBeenCalledWith(OWNER, { method: 'mint_portfolio', templateId: 1, ipfsCid: CID_V2 }, expect.any(Function), expect.any(Function))
    expect(onPublished).toHaveBeenCalledWith(TX_HASH)
    expect(await screen.findByText(/Portfolio minted on-chain/)).toBeInTheDocument()
  })

  it('prefills from IPFS and calls update_portfolio for an existing portfolio', async () => {
    data.getPortfolioContent.mockResolvedValue({
      schema_version: 1,
      folder: 'jane.folder',
      template_id: 1,
      name: 'Jane Doe',
      headline: '',
      bio: 'Old bio',
      skills: [],
      links: [],
      sections: {},
      updated_at: '',
    })
    render(<PortfolioForm owner={OWNER} folder={buildFolder({ templateId: 1 })} portfolio={buildPortfolio()} onPublished={vi.fn()} />)
    expect(await screen.findByDisplayValue('Old bio')).toBeInTheDocument()
    expect(data.getPortfolioContent).toHaveBeenCalledWith(CID_V1)
    expect(screen.getByLabelText(/Template/)).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Upload and update portfolio' }))
    expect(invoke).toHaveBeenCalledWith(OWNER, { method: 'update_portfolio', ipfsCid: CID_V2 }, expect.any(Function), expect.any(Function))
  })

  it('surfaces upload failures without sending a transaction', async () => {
    upload.mockRejectedValue(new Error('Indexer-Backend currently only accepts images and PDFs'))
    render(<PortfolioForm owner={OWNER} folder={buildFolder()} portfolio={null} initialTemplateId="1" onPublished={vi.fn()} />)
    await screen.findByRole('option', { name: 'Developer (#1)' })
    await userEvent.type(screen.getByLabelText(/^Name/), 'Jane')
    await userEvent.type(screen.getByLabelText(/^Bio/), 'Bio')
    await userEvent.click(screen.getByRole('button', { name: 'Upload and mint portfolio' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('only accepts images and PDFs')
    expect(invoke).not.toHaveBeenCalled()
  })
})
