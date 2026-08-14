import { Badge, Card } from '@/components/ui'
import { verificationSteps } from '@/data/verificationSteps'
import { getVerificationStepTone } from '@/domain/verification'
import type { PortfolioStatus } from '@/types'

interface VerificationChecklistProps {
  status: PortfolioStatus
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
            <Badge tone={getVerificationStepTone(index, status)}>{index + 1}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
