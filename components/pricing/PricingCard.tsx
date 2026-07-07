'use client'

import { Check, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/Button'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'
import { currencySymbol, effectiveMonthlyFromYearly, type PlanConfig } from '@/lib/plans'

interface PricingCardProps {
  plan: PlanConfig
  featureList: string[]
  highlighted?: boolean
  ctaHref?: string
  period?: 'monthly' | 'yearly'
}

export function PricingCard({ plan, featureList, highlighted, ctaHref = '/signup', period = 'monthly' }: PricingCardProps) {
  const { t } = useI18n()
  const isFree = plan.priceMonthly === 0
  const yearly = period === 'yearly' && !isFree
  const symbol = currencySymbol(plan.currency)
  const price = yearly ? plan.priceYearly : plan.priceMonthly
  const periodSuffix = yearly ? t.pricing.perYear : t.pricing.perMonth
  const tagline = (t.pricing.taglines as Record<string, string>)[plan.id]
  const credits =
    plan.limits.aiQuestionsPerMonth === null
      ? t.pricing.creditsUnlimited
      : format(t.pricing.creditsPerMonth, { n: plan.limits.aiQuestionsPerMonth })

  return (
    <div
      className={clsx(
        'relative flex flex-col rounded-2xl bg-white p-6 transition',
        highlighted
          ? 'border-2 border-purple-400 shadow-xl shadow-purple-100 lg:-translate-y-2'
          : 'border border-slate-200 shadow-sm'
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
          {t.pricing.popular}
        </span>
      )}

      {/* Başlık + slogan */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
        <p className="text-sm text-slate-500">{tagline}</p>
      </div>

      {/* Fiyat */}
      <div className="mt-5">
        <span className="text-4xl font-bold tracking-tight text-slate-900">{symbol}{price.toLocaleString('tr-TR')}</span>
        <span className="text-sm font-normal text-slate-400">{periodSuffix}</span>
        {isFree && <p className="mt-1.5 text-xs font-medium text-purple-600">{t.pricing.trialPrice}</p>}
        {yearly && (
          <p className="mt-1.5 text-xs font-medium text-emerald-600">
            {format(t.pricing.yearlyEffective, { price: `${symbol}${effectiveMonthlyFromYearly(plan).toLocaleString('tr-TR')}` })} · {t.pricing.yearlySave}
          </p>
        )}
      </div>

      {/* AI işlem (kredi) rozeti */}
      <div className="mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          <Sparkles className="h-3.5 w-3.5" />
          {credits}
        </span>
      </div>

      {/* CTA */}
      <div className="mt-6">
        {isFree ? (
          <a href={ctaHref} className="block">
            <Button variant={highlighted ? 'primary' : 'secondary'} className="w-full">
              {t.pricing.freeCta}
            </Button>
          </a>
        ) : (
          <UpgradeButton
            planId={plan.id as 'pro' | 'career_coach'}
            period={period}
            label={t.pricing.paidCta}
            variant={highlighted ? 'primary' : 'secondary'}
            fullWidth
          />
        )}
      </div>

      {/* Özellik listesi */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.pricing.includedTitle}
        </p>
        <ul className="space-y-2.5">
          {featureList.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
