import { CarWriter } from '@ipld/car'
import * as dagPb from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTrustless } from './trustless'

interface Block {
  cid: CID
  bytes: Uint8Array
}

const makeBlock = async (codec: number, bytes: Uint8Array): Promise<Block> => ({
  cid: CID.createV1(codec, await sha256.digest(bytes)),
  bytes,
})

/** Builds a two-leaf UnixFS file, the same shape a gateway returns for a chunked document. */
const buildFile = async () => {
  const chunks = [new TextEncoder().encode('hello '), new TextEncoder().encode('trustless world')]
  const leaves = await Promise.all(chunks.map((chunk) => makeBlock(raw.code, chunk)))
  const file = new UnixFS({ type: 'file', blockSizes: chunks.map((chunk) => BigInt(chunk.length)) })
  const rootBytes = dagPb.encode({
    Data: file.marshal(),
    Links: leaves.map((leaf, i) => ({ Name: '', Tsize: chunks[i].length, Hash: leaf.cid })),
  })
  const root = await makeBlock(dagPb.code, rootBytes)
  return { root, leaves, text: 'hello trustless world' }
}

const buildCar = async (root: CID, blocks: Block[]) => {
  const { writer, out } = CarWriter.create([root])
  const collected = (async () => {
    const parts: Uint8Array[] = []
    for await (const part of out) parts.push(part)
    return Buffer.concat(parts)
  })()
  for (const block of blocks) await writer.put(block)
  await writer.close()
  return new Uint8Array(await collected)
}

const respond = (body: Uint8Array | null, status = 200) =>
  vi.fn().mockResolvedValue(new Response(body as BodyInit | null, { status }))

describe('fetchTrustless', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('verifies every block and reassembles a multi-block file', async () => {
    const { root, leaves, text } = await buildFile()
    const fetchMock = respond(await buildCar(root.cid, [root, ...leaves]))
    vi.stubGlobal('fetch', fetchMock)

    const bytes = await fetchTrustless('https://gw.test/ipfs', root.cid.toString())

    expect(new TextDecoder().decode(bytes)).toBe(text)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`https://gw.test/ipfs/${root.cid.toString()}?format=car&dag-scope=entity`)
    expect(init.headers.Accept).toBe('application/vnd.ipld.car')
  })

  it('rejects a block whose bytes do not match its CID', async () => {
    const { root, leaves } = await buildFile()
    const tampered = { cid: leaves[1].cid, bytes: new TextEncoder().encode('evil bytes here') }
    vi.stubGlobal('fetch', respond(await buildCar(root.cid, [root, leaves[0], tampered])))

    await expect(fetchTrustless('https://gw.test/ipfs', root.cid.toString())).rejects.toThrow(/verification/)
  })

  it('rejects a CAR whose root is not the requested CID', async () => {
    const { root, leaves } = await buildFile()
    vi.stubGlobal('fetch', respond(await buildCar(root.cid, [root, ...leaves])))

    await expect(fetchTrustless('https://gw.test/ipfs', leaves[0].cid.toString())).rejects.toThrow(/root/)
  })

  it('rejects a CAR missing a block', async () => {
    const { root, leaves } = await buildFile()
    vi.stubGlobal('fetch', respond(await buildCar(root.cid, [root, leaves[0]])))

    await expect(fetchTrustless('https://gw.test/ipfs', root.cid.toString())).rejects.toThrow(/missing block/)
  })

  it.each([400, 406])('signals unsupported gateways on %i', async (status) => {
    vi.stubGlobal('fetch', respond(null, status))

    await expect(fetchTrustless('https://gw.test/ipfs', 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy')).rejects.toThrow(
      /does not support/,
    )
  })
})
