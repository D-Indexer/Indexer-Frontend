export interface Portfolio {
  id: string
  userId: string
  templateId: string
  metadataCid: string
  status: 'created' | 'credentials_pending' | 'verified' | 'unverified'
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  creator: string
  schema: Record<string, unknown>
  price: number
  description: string
  createdAt: string
}

export interface Credential {
  id: string
  portfolioId: string
  type: 'github' | 'linkedin' | 'onchain'
  externalId: string
  verified: boolean
  verifiedAt?: string
}

export interface ProofOfWork {
  id: string
  portfolioId: string
  transactionHash: string
  amount: number
  recordedAt: string
}

export interface User {
  address: string
  name?: string
  email?: string
  portfolios: Portfolio[]
}
