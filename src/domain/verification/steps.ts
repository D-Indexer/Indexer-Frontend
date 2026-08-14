import type { BadgeTone } from '@/components/ui'
import type { PortfolioStatus } from '@/types'

export const getVerificationStepTone = (index: number, status: PortfolioStatus): BadgeTone => {
  if (status === 'verified') {
    return 'success'
  }

  if (status === 'credentials_pending' && index === 1) {
    return 'warning'
  }

  return index === 0 ? 'success' : 'neutral'
}
