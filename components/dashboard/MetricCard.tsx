import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
}

export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-white/50">{label}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </div>
    </Card>
  )
}
