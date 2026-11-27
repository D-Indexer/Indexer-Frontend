import axios from 'axios'
import { env } from '@/config/env'
import { freighterWallet } from './freighterWallet'

let token: string | null = null
export const sep10Client = {
  token: () => token,
  clear: () => { token = null },
  authenticate: async (address: string, homeDomain: string) => {
    if (!env.webAuthEndpoint || !env.webAuthSigningKey) throw new Error('SEP-10 is not configured.')
    const challenge = await axios.get<{ transaction: string }>(env.webAuthEndpoint, { params: { account: address, home_domain: homeDomain } })
    if (!challenge.data.transaction) throw new Error('SEP-10 server returned no challenge transaction.')
    // Freighter signs only after the configured backend has issued this challenge; token remains memory-only.
    const signed = await freighterWallet.signTransaction(challenge.data.transaction, address, 'Test SDF Network ; September 2015')
    const result = await axios.post<{ token?: string }>(env.webAuthEndpoint, { transaction: signed })
    if (!result.data.token) throw new Error('SEP-10 server returned no JWT.')
    token = result.data.token
    return token
  },
}
