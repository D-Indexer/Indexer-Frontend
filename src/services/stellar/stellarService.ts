import { Keypair } from 'stellar-sdk'
import { env } from '@/config/env'
import { getNetworkPassphrase } from './network'

type SignableTransaction = {
  sign: (keypair: Keypair) => void
  toEnvelope: () => {
    toXDR: (encoding: 'base64') => string
  }
}

export const stellarService = {
  getNetworkPassphrase,
  getContractId: () => env.folderContractId,
  createKeypair: () => Keypair.random(),
  signTransaction: (transaction: SignableTransaction, keypair: Keypair) => {
    transaction.sign(keypair)
    return transaction.toEnvelope().toXDR('base64')
  },
  verifyAddress: (address: string): boolean => {
    try {
      Keypair.fromPublicKey(address)
      return true
    } catch {
      return false
    }
  },
}
