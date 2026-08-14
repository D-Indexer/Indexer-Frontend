import { appRoutes } from '@/config/routes'
import { Badge, Card, LinkButton } from '@/components/ui'
import { getTemplatePriceTierLabel } from '@/domain/templates'
import type { Template } from '@/types'
import { formatXlm } from '@/utils/format'

interface TemplateCardProps {
  template: Template
}

export const TemplateCard = ({ template }: TemplateCardProps) => {
  return (
    <Card interactive className="template-card">
      <div className="cluster">
        <Badge>Template</Badge>
        <Badge tone={template.price > 0 ? 'warning' : 'success'}>
          {getTemplatePriceTierLabel(template.price)}
        </Badge>
      </div>
      <div>
        <h3>{template.name}</h3>
        <p className="muted">{template.description}</p>
      </div>
      <div className="template-card__footer">
        <span className="price">{formatXlm(template.price)}</span>
        <LinkButton to={`${appRoutes.createPortfolio}?template=${template.id}`} variant="secondary">
          Use Template
        </LinkButton>
      </div>
    </Card>
  )
}
