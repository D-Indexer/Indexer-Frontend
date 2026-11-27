import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { PortfolioLink } from '@/types'
import { findA11yViolations } from '@/testing/axe'
import { LinksEditor } from './LinksEditor'

const Harness = () => {
  const [links, setLinks] = useState<PortfolioLink[]>([])
  return <LinksEditor id="links" value={links} onChange={setLinks} />
}

describe('LinksEditor', () => {
  it('adds, validates, reorders, and removes typed links', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Add link' }))
    await user.type(screen.getByLabelText('Link 1 URL'), 'not-a-url')
    expect(screen.getByLabelText('Link 1 URL')).not.toHaveAttribute('aria-invalid')
    await user.tab()
    expect(screen.getByLabelText('Link 1 URL')).toHaveAccessibleDescription(expect.stringContaining('valid http(s) URL'))
    expect(screen.getByLabelText('Link 1 URL')).toHaveAttribute('aria-invalid', 'true')

    await user.clear(screen.getByLabelText('Link 1 URL'))
    await user.type(screen.getByLabelText('Link 1 URL'), 'https://github.com/example')
    await user.selectOptions(screen.getByLabelText('Link 1 type'), 'github')
    await user.click(screen.getByRole('button', { name: 'Add link' }))
    await user.selectOptions(screen.getByLabelText('Link 2 type'), 'linkedin')
    await user.type(screen.getByLabelText('Link 2 URL'), 'https://linkedin.com/in/example')
    await user.click(screen.getByRole('button', { name: 'Move link 2 up' }))

    expect(screen.getByLabelText('Link 1 URL')).toHaveValue('https://linkedin.com/in/example')
    await user.click(screen.getByRole('button', { name: 'Remove link 1' }))
    expect(screen.queryByLabelText('Link 2 URL')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Link 1 URL')).toHaveValue('https://github.com/example')
  })

  it('has no accessibility violations when a row is present', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Add link' }))
    expect(await findA11yViolations(container)).toEqual([])
  })
})
