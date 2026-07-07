'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { PricingCard } from '@/components/pricing/PricingCard'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { useI18n } from '@/components/i18n/I18nProvider'

/** Aylık/yıllık geçişini tutan client sarmalayıcı — kartları ona göre render eder. */
export function PricingPlans() {
  const { t } = useI18n()
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const featureLists = t.pricing.lists as Record<string, string[]>

  return (
    <div>
      {/* Aylık / Yıllık geçişi */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-sm">
          {(['monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={clsx(
                'rounded-full px-4 py-1.5 font-medium transition',
                period === p ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {p === 'monthly' ? t.pricing.billingMonthly : t.pricing.billingYearly}
              {p === 'yearly' && (
                <span
                  className={clsx(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    period === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                  )}
                >
                  {t.pricing.yearlyBadge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 items-start gap-6 md:grid-cols-2">
        {PLAN_ORDER.map((planId) => (
          <PricingCard
            key={planId}
            plan={PLANS[planId]}
            featureList={featureLists[planId]}
            highlighted={planId === 'pro'}
            period={period}
            ctaHref={planId === 'free' ? '/signup' : '/settings/billing'}
          />
        ))}
      </div>
    </div>
  )
}
