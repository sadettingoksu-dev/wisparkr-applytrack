import Link from 'next/link'
import { cookies } from 'next/headers'
import { Link as LinkIcon, FileSearch, MessageSquareText, Sparkles, Check } from 'lucide-react'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { NavbarAuth } from '@/components/layout/NavbarAuth'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { getDictionary, LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n'

const FEATURE_ICONS = [LinkIcon, FileSearch, MessageSquareText]

export default function LandingPage() {
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value)
  const t = getDictionary(locale)
  const featureLists = t.pricing.lists as Record<string, string[]>

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar */}
      <header className="mx-4 mt-4 rounded-[2rem] bg-white shadow-lg shadow-slate-300/50 sm:mx-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
          <Link href="/" className="col-start-1 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold text-slate-900">Wisparkr</span>
          </Link>
          <nav className="col-start-2 hidden items-center gap-6 text-sm text-slate-500 md:flex">
            <Link href="/#features" className="hover:text-slate-900 transition-colors">{t.nav.features}</Link>
            <Link href="/#pricing" className="hover:text-slate-900 transition-colors">{t.nav.pricing}</Link>
          </nav>
          <div className="col-start-3 flex items-center justify-end gap-4">
            <LanguageSwitcher />
            <NavbarAuth />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-50">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center">
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
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-slate-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
              {t.features.heading}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {t.features.items.map((feature, i) => {
                const Icon = FEATURE_ICONS[i]
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
      </main>

      <footer className="bg-slate-50 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Wisparkr. {t.footer.rights}
      </footer>
    </div>
  )
}
