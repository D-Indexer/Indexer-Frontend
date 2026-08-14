export type PortfolioStatus = 'created' | 'credentials_pending' | 'verified' | 'unverified'
export type CredentialType = 'github' | 'linkedin' | 'onchain'

export interface PortfolioMetadata {
  name: string
  bio: string
  links: string[]
  skills: string[]
}

export interface Portfolio {
  id: string
  userId: string
  templateId: string
  metadataCid: string
  status: PortfolioStatus
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
  type: CredentialType
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

export interface ApiError {
  message: string
  status?: number
}
