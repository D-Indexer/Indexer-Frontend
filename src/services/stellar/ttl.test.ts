import { describe, expect, it } from 'vitest'
import { ledgersToDays, ttlStatus } from './ttl'
describe('TTL state', () => { it('classifies archive and threshold boundaries', () => { expect(ttlStatus(10, 10)).toBe('archived'); expect(ttlStatus(15, 10, 5)).toBe('expiring'); expect(ledgersToDays(17_280)).toBe(1) }) })
