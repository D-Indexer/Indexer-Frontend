import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PortfolioContent } from '@/types'
import { computeRawCidV1 } from './cid'

const post = vi.hoisted(() => vi.fn())
vi.mock('@/services/http/client', () => ({ apiClient: { post } }))
vi.mock('@/config/env', () => ({ env: { apiUrl: 'http://localhost:3000', ipfsGatewayUrl: 'https://gw.test/ipfs' } }))

const { ipfsService, serializePortfolioContent } = await import('./ipfsService')

const content: PortfolioContent = {
  schema_version: 1,
  folder: 'jane.folder',
  template_id: 1,
  name: 'Jane',
  headline: '',
  bio: 'Bio',
  skills: [],
  links: [],
  sections: {},
  updated_at: '2026-11-10T00:00:00.000Z',
}

/** Minimal shape axios.isAxiosError() accepts, as returned for an HTTP error response. */
const httpError = (status: number, body: unknown) =>
  Object.assign(new Error('Request failed'), { isAxiosError: true, response: { status, data: body } })

describe('ipfsService.uploadPortfolioContent', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('posts JSON as multipart "file" to the backend /upload endpoint and returns the verified CID', async () => {
    const cid = await computeRawCidV1(serializePortfolioContent(content))
    post.mockResolvedValue({ data: { cid } })

    await expect(ipfsService.uploadPortfolioContent(content)).resolves.toBe(cid)
    const [path, body] = post.mock.calls[0] as [string, FormData]
    expect(path).toBe('/upload')
    const file = body.get('file') as File
    expect(file.type).toBe('application/json')
    expect(file.name).toBe('portfolio.json')
  })

  it('rejects CIDs the contract would refuse', async () => {
    post.mockResolvedValue({ data: { cid: 'bafy_not_a_cid' } })
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('the Folder contract would reject')
  })

  it('rejects a raw CID that is not the hash of the uploaded bytes', async () => {
    post.mockResolvedValue({ data: { cid: await computeRawCidV1('something else') } })
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('does not match CID')
  })

  it('explains when the backend does not accept JSON uploads yet', async () => {
    post.mockImplementation(() => Promise.reject(httpError(400, { error: 'Unsupported file type', requestId: 'r1' })))
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('needs to allow application/json')
  })

  it('reports other backend errors', async () => {
    post.mockImplementation(() => Promise.reject(httpError(502, { error: 'IPFS node unreachable' })))
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('Upload failed: IPFS node unreachable')
  })
})

describe('ipfsService.fetchJson', () => {
  it('verifies gateway content against its CID', async () => {
    const text = '{"ok":true}'
    const cid = await computeRawCidV1(text)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(text)))
    await expect(ipfsService.fetchJson(cid)).resolves.toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith(`https://gw.test/ipfs/${cid}`)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"tampered":true}')))
    await expect(ipfsService.fetchJson(cid)).rejects.toThrow('does not match CID')
    vi.unstubAllGlobals()
  })
})
