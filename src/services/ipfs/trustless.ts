/**
 * Trustless gateway retrieval (https://specs.ipfs.tech/http-gateways/trustless-gateway/).
 *
 * Requests the CID as a CAR (`dag-scope=entity`), verifies the hash of every block, checks the CAR
 * root is the requested CID, then reassembles the UnixFS file locally, so the gateway never has to
 * be trusted.
 */
import { CarBlockIterator } from '@ipld/car'
import * as dagPb from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'

const RAW_CODEC = 0x55
const DAG_PB_CODEC = dagPb.code
const SHA2_256 = sha256.code
const IDENTITY = 0x00

export class TrustlessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TrustlessError'
  }
}

/** Thrown when the gateway cannot serve CARs (406/400) so callers can use the plain fetch path. */
export class TrustlessUnsupportedError extends Error {
  constructor(status: number) {
    super(`Gateway does not support trustless CAR responses (HTTP ${status}).`)
    this.name = 'TrustlessUnsupportedError'
  }
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((byte, i) => byte === b[i])

/** Verifies every block in the CAR against its CID and returns them by CID string. */
export const readVerifiedBlocks = async (car: Uint8Array, expectedRoot: CID): Promise<Map<string, Uint8Array>> => {
  let iterator: CarBlockIterator
  try {
    iterator = await CarBlockIterator.fromBytes(car)
    const roots = await iterator.getRoots()
    if (!roots.some((root) => root.equals(expectedRoot))) {
      throw new TrustlessError(`CAR root does not match requested CID ${expectedRoot.toString()}.`)
    }
  } catch (error) {
    if (error instanceof TrustlessError) throw error
    throw new TrustlessError('Gateway returned an invalid CAR.')
  }

  const blocks = new Map<string, Uint8Array>()
  try {
    for await (const { cid, bytes } of iterator) {
      if (cid.multihash.code === IDENTITY) {
        if (!equal(cid.multihash.digest, bytes)) throw new TrustlessError(`Block ${cid.toString()} failed verification.`)
      } else if (cid.multihash.code === SHA2_256) {
        const digest = (await sha256.digest(bytes)).digest
        if (!equal(digest, cid.multihash.digest)) throw new TrustlessError(`Block ${cid.toString()} failed hash verification.`)
      } else {
        throw new TrustlessError(`Block ${cid.toString()} uses an unsupported hash function.`)
      }
      blocks.set(cid.toString(), bytes)
    }
  } catch (error) {
    if (error instanceof TrustlessError) throw error
    throw new TrustlessError('Gateway returned a malformed CAR.')
  }
  return blocks
}

/** Reassembles UnixFS file content (raw leaves or dag-pb files) from verified blocks. */
export const assembleFile = (cid: CID, blocks: Map<string, Uint8Array>): Uint8Array => {
  if (cid.multihash.code === IDENTITY && !blocks.has(cid.toString())) {
    if (cid.code === RAW_CODEC) return cid.multihash.digest
  }
  const bytes = blocks.get(cid.toString())
  if (!bytes) throw new TrustlessError(`CAR is missing block ${cid.toString()}.`)

  if (cid.code === RAW_CODEC) return bytes
  if (cid.code !== DAG_PB_CODEC) throw new TrustlessError(`Unsupported codec 0x${cid.code.toString(16)} in CAR.`)

  const node = dagPb.decode(bytes)
  if (!node.Data) throw new TrustlessError(`Block ${cid.toString()} has no UnixFS data.`)
  const file = UnixFS.unmarshal(node.Data)
  if (!file.isFile()) throw new TrustlessError(`Block ${cid.toString()} is not a UnixFS file.`)

  const parts: Uint8Array[] = []
  if (file.data?.length) parts.push(file.data)
  for (const link of node.Links) parts.push(assembleFile(link.Hash, blocks))
  return concat(parts)
}

/**
 * Fetches and verifies `cid` from `gatewayUrl` (`<base>/ipfs`). Throws `TrustlessUnsupportedError`
 * on 406/400 so the caller can fall back to a plain fetch.
 */
export const fetchTrustless = async (gatewayUrl: string, cidString: string): Promise<Uint8Array> => {
  let cid: CID
  try {
    cid = CID.parse(cidString)
  } catch {
    throw new TrustlessError(`"${cidString}" is not a parseable CID.`)
  }
  const response = await fetch(`${gatewayUrl}/${cidString}?format=car&dag-scope=entity`, {
    headers: { Accept: 'application/vnd.ipld.car' },
  })
  if (response.status === 406 || response.status === 400) throw new TrustlessUnsupportedError(response.status)
  if (!response.ok) throw new TrustlessError(`The IPFS gateway returned ${response.status} for ${cidString}.`)

  const car = new Uint8Array(await response.arrayBuffer())
  return assembleFile(cid, await readVerifiedBlocks(car, cid))
}
