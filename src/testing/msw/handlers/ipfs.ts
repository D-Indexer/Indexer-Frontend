import { http, HttpResponse } from 'msw'
import { env } from '@/config/env'
import { mockDb } from '../db'

/** IPFS gateway: serves content seeded in `mockDb.ipfs` by CID, 504 otherwise (not propagated). */
export const ipfsHandlers = [
  http.get(`${env.ipfsGatewayUrl}/:cid`, ({ params }) => {
    const body = mockDb.ipfs.get(String(params.cid))
    return body === undefined
      ? new HttpResponse(null, { status: 504 })
      : new HttpResponse(body, { headers: { 'Content-Type': 'application/json' } })
  }),
]
