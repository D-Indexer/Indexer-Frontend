import { describe, expect, it } from 'vitest'
import { walletSync } from './walletSync'
describe('wallet lifecycle', () => { it('exposes a cross-tab sync API', () => expect(walletSync.post).toBeTypeOf('function')) })
