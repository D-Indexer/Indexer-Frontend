import { Badge, Card } from '@/components/ui'
import { verificationSteps } from '@/data/verificationSteps'
import type { PortfolioStatus } from '@/types'

interface VerificationChecklistProps {
  status: PortfolioStatus
}

const getStepTone = (index: number, status: PortfolioStatus) => {
  if (status === 'verified') {
    return 'success'
  }

  if (status === 'credentials_pending' && index === 1) {
    return 'warning'
  }

  return index === 0 ? 'success' : 'neutral'
}

export const VerificationChecklist = ({ status }: VerificationChecklistProps) => {
  return (
    <Card>
      <div className="status-list">
        {verificationSteps.map((step, index) => (
          <div className="status-row" key={step.title}>
            <div>
              <strong>{step.title}</strong>
              <p className="muted">{step.description}</p>
            </div>
            <Badge tone={getStepTone(index, status)}>{index + 1}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
