import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findA11yViolations } from '@/testing/axe'
import { buildFolder, buildPortfolio, connectTestnetWallet, developerTemplate, OWNER } from '@/testing/fixtures'

const data = vi.hoisted(() => ({
  getFolderByOwner: vi.fn(),
  getFolderByName: vi.fn(),
  getPortfolio: vi.fn(),
  getPortfolioContent: vi.fn(),
  listTemplates: vi.fn(),
}))
vi.mock('@/services/data/folderData', () => ({ folderData: data }))
vi.mock('@/services/stellar/freighterWallet', () => ({
  freighterWallet: { restore: vi.fn().mockResolvedValue(null), watch: vi.fn(() => () => undefined), connect: vi.fn() },
  WalletError: class extends Error {},
}))

const { App } = await import('@/App')

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<App />} />
      </Routes>
    </MemoryRouter>,
  )

describe('accessibility of the main flow', () => {
  beforeEach(() => {
    connectTestnetWallet()
    data.listTemplates.mockResolvedValue([developerTemplate])
    data.getPortfolioContent.mockResolvedValue({
      schema_version: 1,
      folder: 'jane.folder',
      template_id: 1,
      name: 'Jane Doe',
      headline: '',
      bio: 'Bio',
      skills: ['Rust'],
      links: ['https://example.com'],
      sections: { projects: 'Folder' },
      updated_at: '',
    })
  })

  it('claim step has no axe violations, including with validation errors shown', async () => {
    data.getFolderByOwner.mockResolvedValue(null)
    data.getPortfolio.mockResolvedValue(null)
    const { container } = renderAt('/dashboard')
    await screen.findByRole('heading', { name: 'Claim your folder name' })
    expect(await findA11yViolations(container)).toEqual([])

    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))
    expect(screen.getByText('Enter a folder name.')).toBeInTheDocument()
    expect(await findA11yViolations(container)).toEqual([])
  })

  it('mint step has no axe violations', async () => {
    data.getFolderByOwner.mockResolvedValue(buildFolder())
    data.getPortfolio.mockResolvedValue(null)
    const { container } = renderAt('/dashboard?template=1')
    await screen.findByRole('option', { name: 'Developer (#1)' })
    expect(await findA11yViolations(container)).toEqual([])
  })

  it('templates and public pages have no axe violations', async () => {
    const templates = renderAt('/templates')
    await screen.findByRole('heading', { name: 'Developer' })
    expect(await findA11yViolations(templates.container)).toEqual([])
    templates.unmount()

    data.getFolderByName.mockResolvedValue(buildFolder({ templateId: 1 }))
    data.getPortfolio.mockResolvedValue(buildPortfolio())
    const page = renderAt('/p/jane.folder')
    await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })
    expect(await findA11yViolations(page.container)).toEqual([])
  })

  it('can be operated with the keyboard: skip link, then claim form', async () => {
    data.getFolderByOwner.mockResolvedValue(null)
    data.getPortfolio.mockResolvedValue(null)
    renderAt('/dashboard')
    await screen.findByRole('heading', { name: 'Claim your folder name' })

    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()

    const input = screen.getByLabelText(/Folder name/)
    input.focus()
    await userEvent.keyboard('ab{Enter}')
    expect(input).toHaveFocus()
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Use at least 3 characters'))
    expect(OWNER).toBeTruthy()
  })
})
