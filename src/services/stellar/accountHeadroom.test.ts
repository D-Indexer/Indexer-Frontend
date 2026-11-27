import { describe, expect, it } from 'vitest'
import { canCoverFee, spendableStroops } from './accountHeadroom'
describe('account headroom', () => { it('uses reserve and liabilities before fees', () => { expect(spendableStroops(100n, 25n, 15n)).toBe(60n); expect(canCoverFee(60n, 61n)).toBe(false) }) })
