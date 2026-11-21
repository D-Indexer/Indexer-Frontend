/**
 * CID helpers that mirror Indexer-Contract `src/validation.rs` and `docs/VALIDATION.md`.
 *
 * - CIDv0: `Qm` + base58btc, exactly 46 chars.
 * - CIDv1: `ba` + lowercase base32 (`[a-z2-7]`), 46–128 chars.
 *
 * The contract only checks the textual shape. `computeRawCidV1` lets the client also check that a
 * CID really is the hash of the bytes it uploaded or downloaded.
 */

import { computeRawCidV1OffThread } from './cidWorkerClient'

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/
const BASE32_LOWER_RE = /^[a-z2-7]+$/

export const CID_RULES = {
  cidV0Length: 46,
  minLength: 46,
  maxLength: 128,
} as const

export const isValidContractCid = (cid: string): boolean => {
  if (cid.startsWith('Qm')) {
    return cid.length === CID_RULES.cidV0Length && BASE58_RE.test(cid)
  }
  if (cid.startsWith('ba')) {
    return cid.length >= CID_RULES.minLength && cid.length <= CID_RULES.maxLength && BASE32_LOWER_RE.test(cid)
  }
  return false
}

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

export const toBase32Lower = (bytes: Uint8Array) => {
  let output = ''
  let buffer = 0
  let bits = 0
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31]
  }
  return output
}

/**
 * CIDv1, raw codec (0x55), sha2-256 multihash, base32 multibase: the `bafkrei…` CID that
 * `ipfs add --cid-version 1` produces for a single-block file (< 256 KiB), which is what
 * Indexer-Backend `/upload` and the contract's template manifest use.
 */
export const computeRawCidV1Sync = async (content: Uint8Array | string): Promise<string> => {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
  // Copy into a plain ArrayBuffer-backed view (TS rejects SharedArrayBuffer-backed views here).
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))
  const cidBytes = new Uint8Array([0x01, 0x55, 0x12, 0x20, ...digest])
  return `b${toBase32Lower(cidBytes)}`
}

/**
 * Same as `computeRawCidV1Sync`, but hashes in a Web Worker when one is available so large
 * payloads do not block the main thread. Falls back to the main thread otherwise.
 */
export const computeRawCidV1 = (content: Uint8Array | string): Promise<string> =>
  computeRawCidV1OffThread(content)

/** True when `cid` is a raw CIDv1 we can recompute locally (single-block content). */
export const isRawCidV1 = (cid: string) => cid.startsWith('bafkrei')

/**
 * Verifies that `bytes` hash to `cid` when `cid` is a recomputable raw CIDv1. Hashing runs off the
 * main thread when a Worker is available. Returns false on mismatch, true when it matches or when
 * the CID cannot be recomputed locally.
 */
export const verifyRawCidV1 = async (cid: string, bytes: Uint8Array): Promise<boolean> =>
  !isRawCidV1(cid) || (await computeRawCidV1(bytes)) === cid

/** `ipfs://<cid>[/path]` → `<cid>`; returns null for anything else. */
export const cidFromIpfsUri = (uri: string): string | null => {
  const match = /^ipfs:\/\/([^/?#]+)/.exec(uri)
  return match ? match[1] : null
}
