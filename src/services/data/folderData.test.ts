import { afterEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  templateList: vi.fn(),
  folderByOwner: vi.fn(),
  portfolioByOwner: vi.fn(),
}))

vi.mock('@/services/templates/templateApi', () => ({ templateApi: { list: api.templateList } }))
vi.mock('@/services/folders/folderApi', () => ({ folderApi: { getByOwner: api.folderByOwner, getByName: vi.fn() } }))
vi.mock('@/services/portfolio/portfolioApi', () => ({ portfolioApi: { getByOwner: api.portfolioByOwner } }))

const loadWithEnv = async (demoMode: boolean) => {
  vi.resetModules()
  vi.doMock('@/config/env', () => ({ env: { demoMode, ipfsGatewayUrl: 'https://ipfs.io/ipfs', apiUrl: 'http://api' } }))
  return (await import('./folderData')).folderData
}

describe('folderData', () => {
  afterEach(() => vi.doUnmock('@/config/env'))

  it('propagates backend errors instead of falling back to fixtures', async () => {
    const folderData = await loadWithEnv(false)
    api.templateList.mockRejectedValue(new Error('Network Error'))
    await expect(folderData.listTemplates()).rejects.toThrow('Network Error')
  })

  it('resolves template metadata from the registered template files', async () => {
    const folderData = await loadWithEnv(false)
    api.templateList.mockResolvedValue([
      { id: 1, metadataUri: 'ipfs://bafkreiejxg6d3gqvi3737mcwxkv4u7gismaraxgv5zfoqtfuc3nbdgve7i', creator: null, registeredAt: '' },
    ])
    const [template] = await folderData.listTemplates()
    expect(template.metadata?.name).toBe('Developer')
  })

  it('serves fixtures only in demo mode, without calling the backend', async () => {
    const folderData = await loadWithEnv(true)
    const templates = await folderData.listTemplates()
    expect(templates.map((t) => t.metadata?.name)).toEqual(['Developer', 'Designer', 'Operations'])
    expect((await folderData.getFolderByName('demo.folder'))?.name).toBe('demo.folder')
    expect(await folderData.getFolderByName('other.folder')).toBeNull()
    expect(api.templateList).not.toHaveBeenCalled()
    expect(api.folderByOwner).not.toHaveBeenCalled()
  })
})
