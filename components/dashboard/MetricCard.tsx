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
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
    </Card>
  )
}
