import type { FlowStage } from '../hooks/useContractTx'

export type StepStatus = 'pending' | 'current' | 'complete' | 'error'

interface StepDefinition {
  key: string
  label: string
  stages: FlowStage[]
}

/** Ordered transaction stages; `uploading` is optional and only used by flows that upload first. */
export const txSteps: StepDefinition[] = [
  { key: 'upload', label: 'Upload content', stages: ['uploading'] },
  { key: 'prepare', label: 'Prepare transaction', stages: ['preparing'] },
  { key: 'sign', label: 'Sign in wallet', stages: ['signing'] },
  { key: 'submit', label: 'Submit to network', stages: ['submitting'] },
  { key: 'confirm', label: 'Confirm on-chain', stages: ['confirming', 'done'] },
]

const stageOrder: FlowStage[] = ['uploading', 'preparing', 'signing', 'submitting', 'confirming', 'done']

const statusLabels: Record<StepStatus, string> = {
  pending: 'Pending',
  current: 'In progress',
  complete: 'Complete',
  error: 'Failed',
}

const stepIndexForStage = (stage: FlowStage): number => {
  if (stage === 'failed') return -1
  if (!stageOrder.includes(stage)) return -1
  return txSteps.findIndex((definition) => definition.stages.includes(stage))
}

/** Resolves the status of every step for a given flow stage. */
export const resolveStepStatuses = (stage: FlowStage): StepStatus[] => {
  const activeIndex = stepIndexForStage(stage)
  const failedIndex = stage === 'failed' ? txSteps.length - 1 : -1
  return txSteps.map((_, index) => {
    if (stage === 'done') return 'complete'
    if (failedIndex !== -1) return index < failedIndex ? 'complete' : index === failedIndex ? 'error' : 'pending'
    if (activeIndex === -1) return 'pending'
    if (index < activeIndex) return 'complete'
    return index === activeIndex ? 'current' : 'pending'
  })
}

interface TxStepperProps {
  stage: FlowStage
}

/** Ordered list of transaction stages with `aria-current="step"` and per-step status text. */
export const TxStepper = ({ stage }: TxStepperProps) => {
  const statuses = resolveStepStatuses(stage)

  return (
    <ol className="tx-stepper">
      {txSteps.map((step, index) => {
        const status = statuses[index]
        return (
          <li
            key={step.key}
            className={`tx-stepper__step tx-stepper__step--${status}`}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className="tx-stepper__marker" aria-hidden="true">
              {status === 'complete' ? '✓' : status === 'error' ? '!' : index + 1}
            </span>
            <span className="tx-stepper__label">{step.label}</span>
            <span className="tx-stepper__status">{statusLabels[status]}</span>
          </li>
        )
      })}
    </ol>
  )
}
