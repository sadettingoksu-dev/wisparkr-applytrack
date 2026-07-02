import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  LayoutGrid,
  FileText,
  FileSearch,
  PenLine,
  MessageSquareText,
  CalendarDays,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PromoBar } from '@/components/landing/PromoBar'
import { StatsBand } from '@/components/landing/StatsBand'
import { IntegrationsBand } from '@/components/landing/IntegrationsBand'
import { HeroDemo } from '@/components/landing/HeroDemo'
import { FeatureShowcase } from '@/components/landing/FeatureShowcase'
import { ShowcaseMock } from '@/components/landing/ShowcaseMock'
import { Faq } from '@/components/landing/Faq'
import { ParkrcanWidget } from '@/components/assistant/ParkrcanWidget'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n'

const FEATURE_ICONS = [LayoutGrid, FileText, FileSearch, PenLine, MessageSquareText, CalendarDays]

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { home?: string }
}) {
  // Giriş yapmış kullanıcı pazarlama sayfasında oyalanmasın; doğrudan panele.
  // İstisna: `?home=1` ile bilinçli gelinmişse (panelden "Web sitesi" butonu)
  // pazarlama sayfası gösterilir, yönlendirme atlanır.
  const { data: { user } } = await createClient().auth.getUser()
  if (user && searchParams.home !== '1') redirect('/dashboard')

  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value)
  const t = getDictionary(locale)
  const featureLists = t.pricing.lists as Record<string, string[]>

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* paytr tarzı kampanya şeridi + iki katlı navbar */}
      <PromoBar />
      <Navbar />

      <main className="flex-1">
        {/* Hero — solda metin+CTA, sağda animasyonlu ürün demosu */}
        <section className="relative overflow-hidden bg-slate-50">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm text-purple-700">
                <Sparkles className="h-3.5 w-3.5" />
                {t.hero.badge}
              </div>
              <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                {t.hero.titleA}{' '}
                <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                  Wisparkr
                </span>{' '}
                {t.hero.titleB}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-500">{t.hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {/* Ana çağrı: ücretsiz CV oluştur → giriş yapılmamışsa kayıt/giriş, sonra /cv-builder */}
                <Link href="/signup?next=/cv-builder">
                  <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-300/40 transition-opacity hover:opacity-90">
                    <FileText className="h-4 w-4" />
                    {t.hero.ctaCv}
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
                    {t.hero.ctaPrimary}
                  </button>
                </Link>
                <Link href="/#features">
                  <button className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
                    {t.hero.ctaSecondary}
                  </button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <HeroDemo labels={t.hero.demo} />
            </div>
          </div>
        </section>

        {/* Güven şeridi — dürüst değer noktaları */}
        <section className="border-y border-slate-200 bg-white py-10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 lg:grid-cols-4">
            {t.trust.items.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* paytr tarzı istatistik bloğu */}
        <StatsBand />

        {/* Features */}
        <section id="features" className="bg-slate-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-3 text-center text-3xl font-bold text-slate-900">
              {t.features.heading}
            </h2>
            <p className="mb-12 text-center text-slate-500">{t.features.subtitle}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {t.features.items.map((feature, i) => {
                const Icon = FEATURE_ICONS[i] ?? Sparkles
                return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:bg-slate-100 hover:shadow-xl hover:shadow-purple-200/60"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
                </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Nasıl çalışır? — gerçek sayfa görselleriyle kademeli vitrin */}
        <FeatureShowcase
          heading={t.howItWorks.heading}
          subtitle={t.howItWorks.subtitle}
          shots={t.howItWorks.steps.map((s, i) => ({ ...s, mock: <ShowcaseMock index={i} t={t} /> }))}
        />

        {/* paytr tarzı entegrasyon/bağlantı bölümü */}
        <IntegrationsBand />

        {/* Fiyatlandırma */}
        <section id="pricing" className="bg-slate-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-3 text-center text-3xl font-bold text-slate-900">
              {t.pricing.heading}
            </h2>
            <p className="mb-12 text-center text-slate-500">{t.pricing.subtitle}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PLAN_ORDER.map((planId) => {
                const plan = PLANS[planId]
                const highlighted = planId === 'pro'
                return (
                  <div
                    key={planId}
                    className={`flex flex-col gap-4 rounded-2xl border p-6 backdrop-blur-sm ${
                      highlighted
                        ? 'border-purple-400 bg-purple-600/5'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {highlighted && (
                      <span className="self-start rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                        {t.pricing.popular}
                      </span>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                      <p className="mt-1 text-3xl font-bold text-slate-900">
                        ${plan.priceMonthly}
                        <span className="text-sm font-normal text-slate-400">{t.pricing.perMonth}</span>
                      </p>
                    </div>
                    <ul className="flex-1 space-y-2">
                      {featureLists[planId].map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-500">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href={planId === 'free' ? '/signup' : `/signup?plan=${planId}`}>
                      <button
                        className={`w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                          highlighted
                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white'
                            : 'border border-slate-200 bg-white text-slate-900'
                        }`}
                      >
                        {planId === 'free' ? t.pricing.freeCta : t.pricing.paidCta}
                      </button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* SSS */}
        <Faq heading={t.faq.heading} subtitle={t.faq.subtitle} items={t.faq.items} />
      </main>

      <Footer />

      {/* parkrcan — yalnızca panelden gelen (?home=1) görünümde */}
      {searchParams.home === '1' && <ParkrcanWidget />}
    </div>
  )
}
