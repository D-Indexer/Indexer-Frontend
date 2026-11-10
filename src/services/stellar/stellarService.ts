import { StrKey } from '@stellar/stellar-sdk'
import { env } from '@/config/env'
import { getNetworkPassphrase } from './network'

export const stellarService = {
  getNetworkPassphrase,
  getContractId: () => env.folderContractId,
  isValidAccountAddress: (address: string) => StrKey.isValidEd25519PublicKey(address),
}
