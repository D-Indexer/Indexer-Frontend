import { Keypair, Networks, TransactionBuilder, Operation, BASE_FEE } from 'stellar-sdk'

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet'
const CONTRACT_ID = import.meta.env.VITE_FOLDER_CONTRACT_ID

export const stellarService = {
  getNetworkPassphrase: () => {
    return NETWORK === 'mainnet' ? Networks.PUBLIC_NETWORK_PASSPHRASE : Networks.TESTNET_NETWORK_PASSPHRASE
  },

  getContractId: () => CONTRACT_ID,

  createKeypair: () => Keypair.random(),

  signTransaction: (transaction: any, keypair: Keypair) => {
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
