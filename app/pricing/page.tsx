import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PricingPlans } from '@/components/pricing/PricingPlans'
import { getServerDict } from '@/lib/i18n-server'

export default function PricingPage() {
  const t = getServerDict()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t.pricing.heading}</h1>
          <p className="mt-3 text-slate-500">{t.pricing.pageSubtitle}</p>

          <div className="mt-10">
            <PricingPlans />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
