'use client'

import { Check } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import type { PlanConfig } from '@/lib/plans'

interface PricingCardProps {
  plan: PlanConfig
  featureList: string[]
  highlighted?: boolean
  ctaHref?: string
}

export function PricingCard({ plan, featureList, highlighted, ctaHref = '/signup' }: PricingCardProps) {
  return (
    <Card className={clsx('flex flex-col gap-4', highlighted && 'border-2 border-amber-500')}>
      {highlighted && (
        <span className="self-start rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
          En Popüler
        </span>
      )}
      <div>
        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
        <p className="mt-1 text-3xl font-bold text-white">
          ${plan.priceMonthly}
          <span className="text-sm font-normal text-white/50">/ay</span>
        </p>
      </div>
      <ul className="flex-1 space-y-2">
        {featureList.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            {feature}
          </li>
        ))}
      </ul>
      {plan.priceMonthly === 0 ? (
        <a href={ctaHref}>
          <Button variant="secondary" className="w-full">Ücretsiz Başla</Button>
        </a>
      ) : (
        <UpgradeButton
          planId={plan.id as 'pro' | 'career_coach'}
          label="Plana Geç"
        />
      )}
    </Card>
  )
}
