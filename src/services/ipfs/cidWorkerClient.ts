import { computeRawCidV1Sync } from './cid'
import type { CidWorkerRequest, CidWorkerResponse } from './cid.worker'

type Pending = {
  resolve: (cid: string) => void
  reject: (error: Error) => void
}

let worker: Worker | null = null
let workerUnavailable = false
let nextId = 1
const pending = new Map<number, Pending>()

const failAll = (error: Error) => {
  for (const { reject } of pending.values()) reject(error)
  pending.clear()
}

const getWorker = (): Worker | null => {
  if (workerUnavailable || typeof Worker === 'undefined') return null
  if (worker) return worker
  try {
    worker = new Worker(new URL('./cid.worker.ts', import.meta.url), { type: 'module' })
  } catch {
    workerUnavailable = true
    return null
  }
  worker.onmessage = (event: MessageEvent<CidWorkerResponse>) => {
    const response = event.data
    const entry = pending.get(response.id)
    if (!entry) return
    pending.delete(response.id)
    if (response.ok) entry.resolve(response.cid)
    else entry.reject(new Error(response.error))
  }
  worker.onerror = () => {
    workerUnavailable = true
    worker?.terminate()
    worker = null
    failAll(new Error('CID worker failed'))
  }
  return worker
}

const hashInWorker = (bytes: Uint8Array): Promise<string> => {
  const active = getWorker()
  if (!active) return Promise.reject(new Error('CID worker unavailable'))
  const id = nextId++
  // Copy so the caller's buffer is never detached by the transfer.
  const buffer = bytes.slice().buffer
  return new Promise<string>((resolve, reject) => {
    pending.set(id, { resolve, reject })
    try {
      active.postMessage({ id, bytes: buffer } satisfies CidWorkerRequest, [buffer])
    } catch (error) {
      pending.delete(id)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/**
 * Computes a raw CIDv1 off the main thread when Workers are available, falling back to the
 * main thread otherwise (or if the worker fails).
 */
export const computeRawCidV1OffThread = async (content: Uint8Array | string): Promise<string> => {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
  if (getWorker()) {
    try {
      return await hashInWorker(bytes)
    } catch {
      // Fall through to the main-thread implementation.
    }
  }
  return computeRawCidV1Sync(bytes)
}
