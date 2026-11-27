import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { findA11yViolations } from '@/testing/axe'
import { TagInput } from './TagInput'

const Harness = () => {
  const [skills, setSkills] = useState<string[]>([])
  return <TagInput id="skills" label="Skills" value={skills} onChange={setSkills} />
}

describe('TagInput', () => {
  it('adds skills with Enter and Tab, normalizes whitespace, and prevents case-insensitive duplicates', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Skills' })

    await user.type(input, '  Type   Script  {Enter}')
    await user.type(input, 'type script{Enter}')

    expect(screen.getByText('Type Script')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('already in your skills')

    await user.type(input, 'React')
    await user.tab()
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('removes the last skill with Backspace on an empty field and reorders focused tags with Alt+Arrow', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Skills' })
    await user.type(input, 'Rust{Enter}React{Enter}')

    input.focus()
    await user.keyboard('{Backspace}')
    expect(screen.queryByText('React')).not.toBeInTheDocument()

    await user.type(input, 'React{Enter}')
    const rust = screen.getByText('Rust').closest('li')
    expect(rust).not.toBeNull()
    rust?.focus()
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}')

    const tags = screen.getByRole('list', { name: 'Added skills' })
    expect(within(tags).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['React×', 'Rust×'])
    expect(screen.getByRole('status')).toHaveTextContent('moved to position 2 of 2')
  })

  it('splits pasted comma- and newline-separated values and announces the result', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Skills' })

    await user.click(input)
    await user.paste('React, TypeScript\nNode.js')

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Added React, TypeScript, Node.js to skills')
  })

  it('enforces the skill count and length limits', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Skills' })

    await user.click(input)
    await user.paste(`${'x'.repeat(51)}\n${Array.from({ length: 20 }, (_, index) => `Skill ${index + 1}`).join('\n')}`)
    expect(screen.queryByText('x'.repeat(51))).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('at most 50 characters')

    expect(screen.getAllByRole('listitem')).toHaveLength(20)
    await user.paste(',One too many')
    expect(screen.getByRole('status')).toHaveTextContent('up to 20 skills')
  })

  it('removes a skill using its labelled button', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Skills' })
    await user.type(input, 'Rust{Enter}')
    await user.click(screen.getByRole('button', { name: 'Remove Rust' }))

    expect(screen.queryByText('Rust')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Rust removed from skills')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Harness />)
    expect(await findA11yViolations(container)).toEqual([])
  })
})
