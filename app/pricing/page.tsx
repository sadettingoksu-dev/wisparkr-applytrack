import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PricingCard } from '@/components/pricing/PricingCard'
import { PLANS, PLAN_ORDER } from '@/lib/plans'

const FEATURE_LISTS: Record<string, string[]> = {
  free: ['5 başvuru', '10 AI soru/ay', 'Temel kanban board'],
  pro: ['Sınırsız başvuru', '200 AI soru/ay', 'CV uyum skoru', 'CV otomatik uyarlama'],
  career_coach: [
    'Pro\'daki her şey',
    'Sınırsız AI soru',
    'Şirket içgörüsü',
    'Maaş müzakere koçu',
    'Rakip analizi',
  ],
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Fiyatlandırma</h1>
          <p className="mt-3 text-white/50">İhtiyacına uygun planı seç, istediğin zaman değiştir.</p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLAN_ORDER.map((planId) => (
              <PricingCard
                key={planId}
                plan={PLANS[planId]}
                featureList={FEATURE_LISTS[planId]}
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
