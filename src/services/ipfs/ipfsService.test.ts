import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PortfolioContent } from '@/types'
import { computeRawCidV1 } from './cid'

const post = vi.hoisted(() => vi.fn())
vi.mock('@/services/http/client', () => ({ apiClient: { post } }))
const testEnv = vi.hoisted(() => ({
  apiUrl: 'http://localhost:3000',
  ipfsGatewayUrl: 'https://gw.test/ipfs',
  ipfsSubdomainGateway: '',
  ipfsDevKuboApi: '',
}))
vi.mock('@/config/env', () => ({ env: testEnv }))

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

describe('ipfsService.uploadPortfolioContent with VITE_IPFS_DEV_KUBO_API', () => {
  beforeEach(() => {
    post.mockReset()
    testEnv.ipfsDevKuboApi = 'http://localhost:5001'
  })
  afterEach(() => {
    testEnv.ipfsDevKuboApi = ''
    vi.unstubAllGlobals()
  })

  it('adds the JSON directly to Kubo as raw CIDv1 and skips the backend', async () => {
    const cid = await computeRawCidV1(serializePortfolioContent(content))
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ Name: 'portfolio.json', Hash: cid })))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ipfsService.uploadPortfolioContent(content)).resolves.toBe(cid)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:5001/api/v0/add?cid-version=1&raw-leaves=true')
    expect(init.method).toBe('POST')
    expect((init.body as FormData).get('file')).toBeInstanceOf(Blob)
    expect(post).not.toHaveBeenCalled()
  })

  it('rejects a Kubo CID that does not match the bytes, and reports HTTP failures', async () => {
    const wrong = await computeRawCidV1('something else')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ Hash: wrong }))))
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('does not match CID')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })))
    await expect(ipfsService.uploadPortfolioContent(content)).rejects.toThrow('Direct Kubo upload failed')
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

describe('gatewayBrowseUrl', () => {
  const v0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

  it('falls back to the path gateway when no subdomain gateway is set', async () => {
    const { env } = await import('@/config/env')
    env.ipfsSubdomainGateway = ''
    expect(ipfsService.gatewayBrowseUrl(v0)).toBe(`https://gw.test/ipfs/${v0}`)
  })

  it('builds a DNS-safe subdomain URL, converting CIDv0 to CIDv1', async () => {
    const { env } = await import('@/config/env')
    env.ipfsSubdomainGateway = 'https://dweb.link'
    expect(ipfsService.gatewayBrowseUrl(v0)).toBe(
      'https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.dweb.link/',
    )
    env.ipfsSubdomainGateway = ''
  })
})
