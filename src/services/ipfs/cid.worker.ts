import { computeRawCidV1Sync } from './cid'

export type CidWorkerRequest = { id: number; bytes: ArrayBuffer }

export type CidWorkerResponse =
  | { id: number; ok: true; cid: string }
  | { id: number; ok: false; error: string }

/** Worker entry point: hashes the transferred buffer and posts the CID back. */
export const handleCidWorkerRequest = async ({ id, bytes }: CidWorkerRequest): Promise<CidWorkerResponse> => {
  try {
    return { id, ok: true, cid: await computeRawCidV1Sync(new Uint8Array(bytes)) }
  } catch (error) {
    return { id, ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<CidWorkerRequest>) => void) | null
  postMessage: (message: CidWorkerResponse) => void
}

if (typeof scope.postMessage === 'function' && typeof window === 'undefined') {
  scope.onmessage = (event) => {
    void handleCidWorkerRequest(event.data).then((response) => scope.postMessage(response))
  }
}
