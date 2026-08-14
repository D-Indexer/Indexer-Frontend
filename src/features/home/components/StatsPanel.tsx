import { StatCard } from '@/components/ui'
import { platformStats } from '@/data/platformStats'

export const StatsPanel = () => {
  return (
    <section className="grid grid--3">
      {platformStats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />
      ))}
    </section>
  )
}
