import { Check } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { PlanConfig } from '@/lib/plans'

interface PricingCardProps {
  plan: PlanConfig
  featureList: string[]
  highlighted?: boolean
  ctaHref?: string
}

export function PricingCard({ plan, featureList, highlighted, ctaHref = '/signup' }: PricingCardProps) {
  return (
    <Card
      className={clsx(
        'flex flex-col gap-4',
        highlighted && 'border-2 border-purple-600'
      )}
    >
      {highlighted && (
        <span className="self-start rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
          En Popüler
        </span>
      )}
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{plan.name}</h3>
        <p className="mt-1 text-3xl font-bold text-slate-800">
          ${plan.priceMonthly}
          <span className="text-sm font-normal text-slate-500">/ay</span>
        </p>
      </div>
      <ul className="flex-1 space-y-2">
        {featureList.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
            {feature}
          </li>
        ))}
      </ul>
      <a href={ctaHref}>
        <Button variant={highlighted ? 'primary' : 'secondary'} className="w-full">
          {plan.priceMonthly === 0 ? 'Ücretsiz Başla' : 'Plana Geç'}
        </Button>
      </a>
    </Card>
  )
}
