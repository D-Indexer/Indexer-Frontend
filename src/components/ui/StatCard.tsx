import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string
  detail: string
}

export const StatCard = ({ label, value, detail }: StatCardProps) => {
  return (
    <Card>
      <p className="muted">{label}</p>
      <h3>{value}</h3>
      <p className="muted">{detail}</p>
    </Card>
  )
}
