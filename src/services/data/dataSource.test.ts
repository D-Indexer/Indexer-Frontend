import { describe, expect, it } from 'vitest'
import { demoFolder, demoPortfolio, demoPortfolioContent, demoTemplates } from '@/data/fixtures'
import { createDataSource, getDataSource, isDemoMode, setDataSource } from './dataSourceFactory'
import { DemoDataSource } from './DemoDataSource'
import { LiveDataSource } from './LiveDataSource'

describe('FolderDataSource Contract Tests', () => {
  it('instantiates LiveDataSource and DemoDataSource with correct isDemo flags', () => {
    const live = new LiveDataSource()
    const demo = new DemoDataSource()
    expect(live.isDemo).toBe(false)
    expect(demo.isDemo).toBe(true)
  })

  it('DemoDataSource serves bundled fixtures correctly', async () => {
    const demo = new DemoDataSource()

    const templates = await demo.listTemplates()
    expect(templates.length).toBe(demoTemplates.length)

    const folder = await demo.getFolderByName(demoFolder.name)
    expect(folder).toEqual(demoFolder)

    const nonexistent = await demo.getFolderByName('nonexistent.folder')
    expect(nonexistent).toBeNull()

    const portfolio = await demo.getPortfolio(demoFolder.owner)
    expect(portfolio?.owner).toBe(demoFolder.owner)
    expect(portfolio?.ipfsCid).toBe(demoPortfolio.ipfsCid)

    const content = await demo.getPortfolioContent(demoPortfolio.ipfsCid)
    expect(content.folder).toBe(demoPortfolioContent.folder)

    const verification = await demo.verifyPortfolio(demoFolder.owner)
    expect(verification).toBeNull()
  })

  it('createDataSource factory instantiates correct implementation', () => {
    const live = createDataSource(false)
    const demo = createDataSource(true)
    expect(live).toBeInstanceOf(LiveDataSource)
    expect(demo).toBeInstanceOf(DemoDataSource)
  })

  it('setDataSource and getDataSource allow test overrides', () => {
    const demo = new DemoDataSource()
    setDataSource(demo)
    expect(getDataSource()).toBe(demo)
    expect(isDemoMode()).toBe(true)
    setDataSource(null) // reset
  })
})
