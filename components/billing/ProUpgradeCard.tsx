'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'
import { PLANS, currencySymbol, effectiveMonthlyFromYearly } from '@/lib/plans'

/** Faturalama sayfasında tek Pro planına aylık/yıllık geçişle yükseltme kartı. */
export function ProUpgradeCard() {
  const { t } = useI18n()
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const plan = PLANS.pro
  const symbol = currencySymbol(plan.currency)
  const yearly = period === 'yearly'
  const price = yearly ? plan.priceYearly : plan.priceMonthly

  return (
    <div className="rounded-xl border border-purple-400 bg-purple-50/50 p-4">
      {/* Aylık / Yıllık geçişi */}
      <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs">
        {(['monthly', 'yearly'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={clsx(
              'rounded-full px-3 py-1 font-medium transition',
              period === p ? 'bg-purple-600 text-white' : 'text-slate-500'
            )}
          >
            {p === 'monthly' ? t.pricing.billingMonthly : t.pricing.billingYearly}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
      <p className="text-2xl font-bold text-slate-900">
        {symbol}{price.toLocaleString('tr-TR')}
        <span className="text-xs font-normal text-slate-400">{yearly ? t.pricing.perYear : t.billing.perMonth}</span>
      </p>
      {yearly && (
        <p className="mb-3 text-xs font-medium text-emerald-600">
          {format(t.pricing.yearlyEffective, { price: `${symbol}${effectiveMonthlyFromYearly(plan).toLocaleString('tr-TR')}` })} · {t.pricing.yearlySave}
        </p>
      )}
      <div className={yearly ? '' : 'mt-3'}>
        <UpgradeButton planId="pro" period={period} label={t.billing.upgradeNow} />
      </div>
    </div>
  )
}
