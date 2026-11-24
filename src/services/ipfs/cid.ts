/**
 * CID helpers that mirror Indexer-Contract `src/validation.rs` and `docs/VALIDATION.md`.
 *
 * - CIDv0: `Qm` + base58btc, exactly 46 chars.
 * - CIDv1: `ba` + lowercase base32 (`[a-z2-7]`), 46–128 chars.
 *
 * The contract only checks the textual shape. `computeRawCidV1` lets the client also check that a
 * CID really is the hash of the bytes it uploaded or downloaded.
 */

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

const toBase32Lower = (bytes: Uint8Array) => {
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
export const computeRawCidV1 = async (content: Uint8Array | string): Promise<string> => {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
  // Copy into a plain ArrayBuffer-backed view (TS rejects SharedArrayBuffer-backed views here).
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))
  const cidBytes = new Uint8Array([0x01, 0x55, 0x12, 0x20, ...digest])
  return `b${toBase32Lower(cidBytes)}`
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const decodeBase58 = (input: string): Uint8Array => {
  const bytes: number[] = []
  for (const char of input) {
    let carry = BASE58_ALPHABET.indexOf(char)
    if (carry < 0) throw new Error(`Invalid base58 character "${char}".`)
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  for (const char of input) {
    if (char !== '1') break
    bytes.push(0)
  }
  return new Uint8Array(bytes.reverse())
}

/**
 * Subdomain gateways need a case-insensitive, DNS-safe label, so a CIDv0 (`Qm…`, base58) is
 * re-encoded as CIDv1 (dag-pb, base32). CIDv1 base32 input is returned unchanged.
 */
export const toDnsSafeCid = (cid: string): string => {
  if (!cid.startsWith('Qm') || cid.length !== CID_RULES.cidV0Length) return cid
  return `b${toBase32Lower(new Uint8Array([0x01, 0x70, ...decodeBase58(cid)]))}`
}

/** True when `cid` is a raw CIDv1 we can recompute locally (single-block content). */
export const isRawCidV1 = (cid: string) => cid.startsWith('bafkrei')

/** `ipfs://<cid>[/path]` → `<cid>`; returns null for anything else. */
export const cidFromIpfsUri = (uri: string): string | null => {
  const match = /^ipfs:\/\/([^/?#]+)/.exec(uri)
  return match ? match[1] : null
}
