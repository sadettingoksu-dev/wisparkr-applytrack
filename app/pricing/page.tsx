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
        <section className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t.nav.pricing}</h1>
          <p className="mt-3 text-white/50">{t.pricing.pageSubtitle}</p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
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
