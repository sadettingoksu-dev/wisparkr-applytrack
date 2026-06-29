import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PricingCard } from '@/components/pricing/PricingCard'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { getServerDict } from '@/lib/i18n-server'

export default function PricingPage() {
  const t = getServerDict()
  const featureLists = t.pricing.lists as Record<string, string[]>
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t.pricing.heading}</h1>
          <p className="mt-3 text-slate-500">{t.pricing.pageSubtitle}</p>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
            {t.pricing.monthlyNote}
          </span>

          <div className="mt-14 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
            {PLAN_ORDER.map((planId) => (
              <PricingCard
                key={planId}
                plan={PLANS[planId]}
                featureList={featureLists[planId]}
                highlighted={planId === 'pro'}
                ctaHref={planId === 'free' ? '/signup' : '/settings/billing'}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
