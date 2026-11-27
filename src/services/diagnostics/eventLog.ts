/**
 * In-memory ring buffer of the last N service events (backend, IPFS, Soroban RPC, wallet).
 * Feeds the "Copy diagnostics" bundle. Nothing is persisted and nothing leaves the browser
 * unless the user copies it.
 */

export type ServiceEventKind = 'backend' | 'ipfs' | 'rpc' | 'wallet'

export interface ServiceEvent {
  /** Monotonic id, useful to order events that share a timestamp. */
  id: number
  kind: ServiceEventKind
  /** Short operation name, e.g. `GET /folders/:owner` or `claim_folder`. */
  operation: string
  ok: boolean
  /** Duration in milliseconds. */
  durationMs: number
  /** Backend `requestId` or Soroban RPC request id, when the service returned one. */
  requestId?: string
  /** Contract error code (`Error(Contract, #N)`) or HTTP status, when known. */
  errorCode?: number | string
  /** Redacted error message. */
  error?: string
  at: string
}

export const DIAGNOSTICS_BUFFER_SIZE = 25

const buffer: ServiceEvent[] = []
let nextId = 1

const push = (event: Omit<ServiceEvent, 'id' | 'at'>) => {
  buffer.push({ ...event, id: nextId++, at: new Date().toISOString() })
  if (buffer.length > DIAGNOSTICS_BUFFER_SIZE) buffer.splice(0, buffer.length - DIAGNOSTICS_BUFFER_SIZE)
}

/** Records one service call. Never throws: diagnostics must not break the request path. */
export const recordServiceEvent = (event: Omit<ServiceEvent, 'id' | 'at'>) => {
  try {
    push(event)
  } catch {
    // Diagnostics are best-effort.
  }
}

/** Runs `task`, recording its duration, request id and error code. Rethrows the original error. */
export const trackServiceCall = async <T>(
  kind: ServiceEventKind,
  operation: string,
  task: () => Promise<T>,
  extract: (result: T) => { requestId?: string } = () => ({}),
): Promise<T> => {
  const started = Date.now()
  try {
    const result = await task()
    recordServiceEvent({ kind, operation, ok: true, durationMs: Date.now() - started, ...extract(result) })
    return result
  } catch (error) {
    recordServiceEvent({
      kind,
      operation,
      ok: false,
      durationMs: Date.now() - started,
      errorCode: errorCodeOf(error),
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

const errorCodeOf = (error: unknown): number | string | undefined => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { options?: { contractErrorCode?: number }; status?: number; response?: { status?: number } }
    if (typeof candidate.options?.contractErrorCode === 'number') return candidate.options.contractErrorCode
    if (typeof candidate.response?.status === 'number') return candidate.response.status
    if (typeof candidate.status === 'number') return candidate.status
  }
  return undefined
}

/** Snapshot of the buffer, oldest first. */
export const getServiceEvents = (): ServiceEvent[] => buffer.map((event) => ({ ...event }))

/** Test/teardown helper. */
export const clearServiceEvents = () => {
  buffer.length = 0
  nextId = 1
}
