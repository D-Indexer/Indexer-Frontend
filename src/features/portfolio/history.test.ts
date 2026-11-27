import { describe, expect, it } from 'vitest'
import { createHistoryState, historyReducer, MAX_HISTORY_ENTRIES } from './history'

describe('portfolio history reducer', () => {
  it('coalesces rapid edits to the same field into one undo step', () => {
    let state = createHistoryState({ bio: '' })
    state = historyReducer(state, { type: 'edit', field: 'bio', timestamp: 100, update: () => ({ bio: 'A' }) })
    state = historyReducer(state, { type: 'edit', field: 'bio', timestamp: 200, update: () => ({ bio: 'AB' }) })

    expect(state.past).toEqual([{ bio: '' }])
    expect(historyReducer(state, { type: 'undo' }).present).toEqual({ bio: '' })
  })

  it('starts new steps for other fields and edits outside the coalescing window', () => {
    let state = createHistoryState({ name: '', bio: '' })
    state = historyReducer(state, { type: 'edit', field: 'name', timestamp: 100, update: () => ({ name: 'A', bio: '' }) })
    state = historyReducer(state, { type: 'edit', field: 'bio', timestamp: 200, update: () => ({ name: 'A', bio: 'B' }) })
    state = historyReducer(state, { type: 'edit', field: 'bio', timestamp: 1_201, update: () => ({ name: 'A', bio: 'BC' }) })

    expect(state.past).toEqual([{ name: '', bio: '' }, { name: 'A', bio: '' }, { name: 'A', bio: 'B' }])
  })

  it('supports undo, redo, clears redo history on edit, and resets cleanly', () => {
    let state = createHistoryState('first')
    state = historyReducer(state, { type: 'edit', field: 'name', timestamp: 0, update: () => 'second' })
    state = historyReducer(state, { type: 'undo' })
    expect(state.present).toBe('first')
    state = historyReducer(state, { type: 'redo' })
    expect(state.present).toBe('second')
    state = historyReducer(state, { type: 'undo' })
    state = historyReducer(state, { type: 'edit', field: 'name', timestamp: 2_000, update: () => 'third' })
    expect(state.future).toEqual([])
    expect(historyReducer(state, { type: 'reset', value: 'loaded' })).toEqual(createHistoryState('loaded'))
  })

  it('bounds its history', () => {
    let state = createHistoryState(0)
    for (let value = 1; value <= MAX_HISTORY_ENTRIES + 1; value += 1) {
      state = historyReducer(state, { type: 'edit', field: `field-${value}`, timestamp: value * 2_000, update: () => value })
    }

    expect(state.past).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(state.past[0]).toBe(1)
  })
})
