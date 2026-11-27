export const MAX_HISTORY_ENTRIES = 100
export const HISTORY_COALESCE_WINDOW_MS = 1_000

interface LastEdit {
  field: string
  timestamp: number
}

export interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
  lastEdit: LastEdit | null
}

export type HistoryAction<T> =
  | { type: 'edit'; field: string; timestamp: number; update: (present: T) => T }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; value: T }

export const createHistoryState = <T>(present: T): HistoryState<T> => ({
  past: [],
  present,
  future: [],
  lastEdit: null,
})

export const historyReducer = <T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> => {
  switch (action.type) {
    case 'edit': {
      const present = action.update(state.present)
      const timeSinceLastEdit = state.lastEdit ? action.timestamp - state.lastEdit.timestamp : null
      const coalesce =
        state.lastEdit?.field === action.field &&
        timeSinceLastEdit !== null &&
        timeSinceLastEdit >= 0 &&
        timeSinceLastEdit <= HISTORY_COALESCE_WINDOW_MS &&
        state.past.length > 0

      return {
        past: coalesce ? state.past : [...state.past, state.present].slice(-MAX_HISTORY_ENTRIES),
        present,
        future: [],
        lastEdit: { field: action.field, timestamp: action.timestamp },
      }
    }
    case 'undo': {
      if (state.past.length === 0) return state
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
        lastEdit: null,
      }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY_ENTRIES),
        present: state.future[0],
        future: state.future.slice(1),
        lastEdit: null,
      }
    }
    case 'reset':
      return createHistoryState(action.value)
  }
}
