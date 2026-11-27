import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'
import { useWalletStore } from '@/store'

const initialWalletState = useWalletStore.getState()

/** Fails the test that leaves fake timers installed, so the next test cannot inherit them. */
const assertNoFakeTimers = () => {
  expect(vi.isFakeTimers(), 'test leaked fake timers: call vi.useRealTimers() before it ends').toBe(false)
}

/** Fails the test that leaves a global (e.g. a fetch mock) stubbed, so the next test cannot inherit it. */
const assertNoStubbedGlobals = () => {
  expect(vi.getMockedSystemTime(), 'test leaked a mocked system time: call vi.useRealTimers()').toBeNull()
}

afterEach(() => {
  cleanup()
  assertNoFakeTimers()
  assertNoStubbedGlobals()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  useWalletStore.setState(initialWalletState, true)
  localStorage.clear()
})
