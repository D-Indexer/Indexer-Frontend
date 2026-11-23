import { backendHandlers } from './backend'
import { ipfsHandlers } from './ipfs'
import { rpcHandlers } from './rpc'

export const handlers = [...backendHandlers, ...ipfsHandlers, ...rpcHandlers]
