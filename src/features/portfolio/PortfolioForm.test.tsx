import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFolder, buildPortfolio, CID_V1, CID_V2, connectTestnetWallet, developerTemplate, OWNER, TX_HASH } from '@/testing/fixtures'

const invoke = vi.hoisted(() => vi.fn())
const onChain = vi.hoisted(() => vi.fn())
const upload = vi.hoisted(() => vi.fn())
const data = vi.hoisted(() => ({ listTemplates: vi.fn(), getPortfolioContent: vi.fn() }))

vi.mock('@/services/stellar/stellarService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/stellarService')>()
  return { ...original, stellarService: { ...original.stellarService, invoke, getOnChainPortfolio: onChain } }
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
    onChain.mockReset().mockResolvedValue({ ipfsCid: CID_V1, templateId: 1, mintedAt: 0 })
    upload.mockReset().mockResolvedValue(CID_V2)
    data.listTemplates.mockResolvedValue([developerTemplate])
    connectTestnetWallet()
  })

  it('validates required fields and URLs next to each field', async () => {
    render(<PortfolioForm owner={OWNER} folder={buildFolder()} portfolio={null} initialTemplateId="1" onPublished={vi.fn()} />)
    await screen.findByRole('option', { name: 'Developer (#1)' })
    await userEvent.click(screen.getByRole('button', { name: 'Add link' }))
    await userEvent.type(screen.getByLabelText('Link 1 URL'), 'not-a-url')
    await userEvent.click(screen.getByRole('button', { name: 'Upload and mint portfolio' }))

    expect(screen.getByLabelText(/^Name/)).toHaveAccessibleDescription('Enter the name to show on your portfolio.')
    expect(screen.getByLabelText(/^Name/)).toHaveFocus()
    expect(screen.getByLabelText(/^Bio/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Link 1 URL')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Link 1 URL')).toHaveAccessibleDescription(expect.stringContaining('valid http(s) URL'))
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
    await userEvent.click(screen.getByRole('button', { name: 'Add link' }))
    await userEvent.selectOptions(screen.getByLabelText('Link 1 type'), 'github')
    await userEvent.type(screen.getByLabelText('Link 1 URL'), 'https://github.com/janedoe')
    await userEvent.type(screen.getByLabelText('Link 1 label'), 'GitHub')
    await userEvent.type(screen.getByLabelText('Projects'), 'Folder')
    await userEvent.click(screen.getByRole('button', { name: 'Upload and mint portfolio' }))

    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        schema_version: 1,
        folder: 'jane.folder',
        template_id: 1,
        name: 'Jane Doe',
        skills: ['Rust', 'React'],
        links: ['https://github.com/janedoe'],
        link_meta: [{ kind: 'github', url: 'https://github.com/janedoe', label: 'GitHub' }],
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
    expect(invoke).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Review your changes' })).toBeInTheDocument()
    expect(screen.getByText(/No changes compared/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm and upload update' }))
    expect(invoke).toHaveBeenCalledWith(OWNER, { method: 'update_portfolio', ipfsCid: CID_V2 }, expect.any(Function), expect.any(Function))
  })

  it('previews a JSON Resume and applies it only after confirmation', async () => {
    render(<PortfolioForm owner={OWNER} folder={buildFolder()} portfolio={null} initialTemplateId="1" onPublished={vi.fn()} />)
    await screen.findByRole('option', { name: 'Developer (#1)' })

    const resume = new File([JSON.stringify({ basics: { name: 'Richard Hendriks', label: 'Programmer', summary: 'Richard hails from Tulsa.', url: 'https://richardhendricks.com' }, skills: [{ name: 'Web Development', keywords: ['HTML', 'CSS'] }] })], 'resume.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Import JSON Resume'), resume)

    expect(await screen.findByRole('region', { name: 'JSON Resume import preview' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveValue('')
    await userEvent.click(screen.getByRole('button', { name: 'Use imported values' }))
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Richard Hendriks')
    expect(screen.getByLabelText(/^Headline/)).toHaveValue('Programmer')
    expect(screen.getByLabelText(/Skills/)).toHaveValue('Web Development, HTML, CSS')
  })

  it('shows a precise error for invalid JSON without changing fields', async () => {
    render(<PortfolioForm owner={OWNER} folder={buildFolder()} portfolio={null} initialTemplateId="1" onPublished={vi.fn()} />)
    await screen.findByRole('option', { name: 'Developer (#1)' })
    await userEvent.type(screen.getByLabelText(/^Name/), 'Existing Name')

    const resume = new File(['{"basics":{"name":42}}'], 'resume.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Import JSON Resume'), resume)

    expect(await screen.findByRole('alert')).toHaveTextContent('basics.name must be a string')
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Existing Name')
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

  describe('concurrent edits', () => {
    const published = { schema_version: 1, folder: 'jane.folder', template_id: 1, name: 'Jane Doe', headline: '', bio: 'Old bio', skills: [], links: [], sections: {}, updated_at: '' }

    const openReview = async () => {
      data.getPortfolioContent.mockResolvedValue(published)
      render(<PortfolioForm owner={OWNER} folder={buildFolder({ templateId: 1 })} portfolio={buildPortfolio()} onPublished={vi.fn()} />)
      await screen.findByDisplayValue('Old bio')
      await userEvent.type(screen.getByLabelText(/^Bio/), ' edited')
      await userEvent.click(screen.getByRole('button', { name: 'Upload and update portfolio' }))
      onChain.mockResolvedValue({ ipfsCid: CID_V2, templateId: 1, mintedAt: 0 })
    }

    it('stops before upload and signing when the on-chain CID changed since the editor opened', async () => {
      await openReview()
      await userEvent.click(screen.getByRole('button', { name: 'Confirm and upload update' }))
      expect(await screen.findByRole('alert')).toHaveTextContent(/updated on-chain after you opened the editor/)
      expect(upload).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
    })

    it('lets the owner overwrite deliberately', async () => {
      await openReview()
      await userEvent.click(screen.getByRole('button', { name: 'Confirm and upload update' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Overwrite anyway' }))
      expect(upload).toHaveBeenCalledTimes(1)
      expect(invoke).toHaveBeenCalledTimes(1)
    })

    it('re-bases on the newer version when merging, then saves without a conflict', async () => {
      await openReview()
      await userEvent.click(screen.getByRole('button', { name: 'Confirm and upload update' }))
      data.getPortfolioContent.mockResolvedValue({ ...published, bio: 'Newer bio' })
      await userEvent.click(await screen.findByRole('button', { name: /^Merge/ }))
      await userEvent.click(await screen.findByRole('button', { name: 'Confirm and upload update' }))
      expect(data.getPortfolioContent).toHaveBeenCalledWith(CID_V2)
      expect(invoke).toHaveBeenCalledTimes(1)
    })
  })
})
