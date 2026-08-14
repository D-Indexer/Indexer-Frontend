import { Link } from 'react-router-dom'
import { appRoutes } from '@/config/routes'
import { Badge, Button, Card } from '@/components/ui'
import type { Template } from '@/types'
import { formatXlm } from '@/utils/format'

interface TemplateCardProps {
  template: Template
}

export const TemplateCard = ({ template }: TemplateCardProps) => {
  return (
    <Card interactive className="template-card">
      <Badge>Template</Badge>
      <div>
        <h3>{template.name}</h3>
        <p className="muted">{template.description}</p>
      </div>
      <div className="template-card__footer">
        <span className="price">{formatXlm(template.price)}</span>
        <Link to={`${appRoutes.createPortfolio}?template=${template.id}`}>
          <Button variant="secondary">Use Template</Button>
        </Link>
      </div>
    </Card>
  )
}
