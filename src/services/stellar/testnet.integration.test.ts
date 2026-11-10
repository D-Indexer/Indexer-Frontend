// @vitest-environment node
/**
 * Opt-in smoke test against the deployed testnet contract: FOLDER_TESTNET_SMOKE=1 npm test -- testnet
 *
 * Runs the exact build → simulate → prepare → sign → submit → poll pipeline the app uses, with a
 * local Keypair signer standing in for Freighter and a fresh Friendbot-funded account.
 */
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk'
import { describe, expect, it, vi } from 'vitest'

declare const process: { env: Record<string, string | undefined> }

const CONTRACT_ID = 'CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV'

vi.mock('@/config/env', () => ({
  env: {
    folderContractId: process.env.VITE_FOLDER_CONTRACT_ID ?? CONTRACT_ID,
    sorobanRpcUrl: process.env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
    stellarNetwork: 'testnet',
  },
}))

const { stellarService, TransactionError } = await import('./stellarService')
const { computeRawCidV1 } = await import('@/services/ipfs/cid')

describe.skipIf(process.env.FOLDER_TESTNET_SMOKE !== '1')('testnet smoke', () => {
  it('claims a folder, mints, updates and verifies a portfolio', async () => {
    const keypair = Keypair.random()
    const owner = keypair.publicKey()
    const funded = await fetch(`https://friendbot.stellar.org/?addr=${owner}`)
    expect(funded.ok).toBe(true)

    const sign = async (xdr: string, _address: string, passphrase: string) => {
      const tx = TransactionBuilder.fromXDR(xdr, passphrase)
      tx.sign(keypair)
      return tx.toXDR()
    }
    const stages: string[] = []
    const folderName = `fe-smoke-${Date.now()}.folder`
    const log = (step: string, hash: string) => console.log(`${step}: https://stellar.expert/explorer/testnet/tx/${hash}`)

    expect(await stellarService.verifyPortfolio(owner)).toBe(false)

    const claim = await stellarService.invoke(owner, { method: 'claim_folder', folderName }, sign, (stage) => stages.push(stage))
    log(`claim_folder ${folderName}`, claim.hash)
    expect(stages).toEqual(['preparing', 'signing', 'submitting', 'confirming'])

    const cidV1 = await computeRawCidV1(`{"folder":"${folderName}","v":1}`)
    const mint = await stellarService.invoke(owner, { method: 'mint_portfolio', templateId: 1, ipfsCid: cidV1 }, sign)
    log('mint_portfolio', mint.hash)

    const cidV2 = await computeRawCidV1(`{"folder":"${folderName}","v":2}`)
    const update = await stellarService.invoke(owner, { method: 'update_portfolio', ipfsCid: cidV2 }, sign)
    log('update_portfolio', update.hash)

    expect(await stellarService.verifyPortfolio(owner)).toBe(true)
    expect(await stellarService.getOnChainPortfolio(owner)).toMatchObject({ ipfsCid: cidV2, templateId: 1 })

    // Contract errors surface as readable messages before anything is signed.
    await expect(stellarService.invoke(owner, { method: 'claim_folder', folderName: `x${folderName}` }, sign)).rejects.toMatchObject({
      options: { contractErrorCode: 16 },
    })
    await expect(stellarService.invoke(owner, { method: 'mint_portfolio', templateId: 1, ipfsCid: cidV1 }, sign)).rejects.toThrow(
      'You already minted a portfolio. Update it instead.',
    )
    await expect(stellarService.invoke(owner, { method: 'update_portfolio', ipfsCid: 'not-a-cid' }, sign)).rejects.toBeInstanceOf(
      TransactionError,
    )
  }, 180_000)
})
