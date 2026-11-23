import { describe, expect, it } from 'vitest'
import { flagRegistry, MAX_FLAG_AGE_DAYS, parseFlagQuery, resolveFlags } from './flags'

describe('feature flags', () => {
  it('uses registry defaults', () => {
    expect(resolveFlags({ dev: false })).toEqual({ sponsorship: false, templateRegistration: false, trustlessIpfs: false })
  })

  it('applies runtime config in production but ignores query and localStorage overrides', () => {
    const values = resolveFlags({
      dev: false,
      query: 'templateRegistration',
      runtime: { sponsorship: true },
      stored: { trustlessIpfs: true },
    })
    expect(values).toEqual({ sponsorship: true, templateRegistration: false, trustlessIpfs: false })
  })

  it('layers defaults < runtime < query < localStorage in dev', () => {
    const values = resolveFlags({
      dev: true,
      query: 'sponsorship,-trustlessIpfs,templateRegistration',
      runtime: { sponsorship: false, trustlessIpfs: true },
      stored: { templateRegistration: false },
    })
    expect(values).toEqual({ sponsorship: true, templateRegistration: false, trustlessIpfs: false })
  })

  it('ignores unknown names and non-boolean values', () => {
    expect(resolveFlags({ dev: true, runtime: { sponsorship: 'yes', unknown: true } }).sponsorship).toBe(false)
    expect(parseFlagQuery(' a , -b ,')).toEqual({ a: true, b: false })
  })

  it.each(Object.entries(flagRegistry))('flag %s is documented and not stale', (_name, flag) => {
    expect(flag.description).not.toBe('')
    expect(flag.owner).not.toBe('')
    const ageDays = (Date.now() - Date.parse(flag.added)) / 86_400_000
    expect(ageDays, `remove the flag or bump its date after review (max ${MAX_FLAG_AGE_DAYS} days)`).toBeLessThan(MAX_FLAG_AGE_DAYS)
  })
})
