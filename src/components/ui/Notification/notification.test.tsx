import { render, screen, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastContainer } from './ToastContainer'
import { notificationStore, notify } from './notificationStore'

describe('Accessible Notification System', () => {
  beforeEach(() => {
    notificationStore.clear()
    vi.useFakeTimers()
  })

  it('renders into polite region for info/success and assertive for errors', () => {
    render(<ToastContainer />)

    act(() => {
      notify.info('Portfolio saved')
      notify.error('Transaction failed')
    })

    const politeRegion = screen.getByRole('status')
    const assertiveRegion = screen.getByRole('alert')

    expect(politeRegion).toHaveTextContent('Portfolio saved')
    expect(assertiveRegion).toHaveTextContent('Transaction failed')
  })

  it('deduplicates identical messages', () => {
    render(<ToastContainer />)

    act(() => {
      notify.info('Same message')
      notify.info('Same message')
    })

    const items = screen.getAllByText('Same message')
    expect(items.length).toBe(1)
  })

  it('limits to 3 visible messages', () => {
    render(<ToastContainer />)

    act(() => {
      notify.info('Msg 1')
      notify.info('Msg 2')
      notify.info('Msg 3')
      notify.info('Msg 4')
    })

    expect(screen.queryByText('Msg 1')).not.toBeInTheDocument()
    expect(screen.getByText('Msg 2')).toBeInTheDocument()
    expect(screen.getByText('Msg 3')).toBeInTheDocument()
    expect(screen.getByText('Msg 4')).toBeInTheDocument()
  })

  it('never auto-dismisses errors', () => {
    render(<ToastContainer />)

    act(() => {
      notify.error('Persistent Error')
    })

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(screen.getByText('Persistent Error')).toBeInTheDocument()
  })

  it('auto-dismisses info messages after duration', () => {
    render(<ToastContainer />)

    act(() => {
      notify.info('Temporary Info')
    })

    expect(screen.getByText('Temporary Info')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5500)
    })

    expect(screen.queryByText('Temporary Info')).not.toBeInTheDocument()
  })
})
