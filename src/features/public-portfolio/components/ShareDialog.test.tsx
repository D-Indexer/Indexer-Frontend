import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ShareDialog } from './ShareDialog'

describe('ShareDialog', () => {
  it('shows a labelled dialog with a QR code and closes on Escape without network calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const onClose = vi.fn()
    render(<ShareDialog onClose={onClose} title="jane.folder" url="https://folder.example/p/jane.folder" />)
    expect(screen.getByRole('dialog', { name: 'Share jane.folder' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /QR code for https:\/\/folder\.example\/p\/jane\.folder/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download SVG' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
