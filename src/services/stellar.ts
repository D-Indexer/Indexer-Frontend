import { Keypair } from 'stellar-sdk'

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet'
const CONTRACT_ID = import.meta.env.VITE_FOLDER_CONTRACT_ID

const NETWORK_PASSPHRASES = {
  mainnet: 'Public Global Stellar Network ; September 2015',
  testnet: 'Test SDF Network ; September 2015',
}

export const stellarService = {
  getNetworkPassphrase: () => {
    return NETWORK_PASSPHRASES[NETWORK as keyof typeof NETWORK_PASSPHRASES] || NETWORK_PASSPHRASES.testnet
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
