import { Card, LinkButton } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { verificationSteps } from '@/data/verificationSteps'

export const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__content">
        <span className="hero__eyebrow">Stellar-native professional identity</span>
        <h1 className="text-balance">Build a portfolio people can verify.</h1>
        <p className="hero__lead">
          Folder lets you claim a name, pick a template and mint a portfolio NFT on Stellar testnet.
          Its content lives on IPFS and anyone can verify it against the contract.
        </p>
        <div className="hero__actions">
          <LinkButton to={appRoutes.dashboard}>Get started</LinkButton>
          <LinkButton to={appRoutes.templates} variant="secondary">
            Browse templates
          </LinkButton>
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
