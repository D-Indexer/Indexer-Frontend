import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { verificationSteps } from '@/data/verificationSteps'

export const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__content">
        <span className="hero__eyebrow">Stellar-native professional identity</span>
        <h1 className="text-balance">Build a portfolio people can verify.</h1>
        <p className="hero__lead">
          Folder turns professional profiles into portable identity records with IPFS metadata,
          Stellar ownership, and credential-ready API flows.
        </p>
        <div className="hero__actions">
          <Link to={appRoutes.createPortfolio}>
            <Button>Create portfolio</Button>
          </Link>
          <Link to={appRoutes.templates}>
            <Button variant="secondary">Browse templates</Button>
          </Link>
        </div>
      </div>

      <Card className="hero-panel">
        {verificationSteps.map((step, index) => (
          <div className="status-row" key={step.title}>
            <span>{index + 1}. {step.title}</span>
            <span className="muted">{step.description}</span>
          </div>
        ))}
      </Card>
    </section>
  )
}
