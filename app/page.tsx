import Link from 'next/link'
import { Link as LinkIcon, FileSearch, MessageSquareText, Sparkles, Check } from 'lucide-react'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { NavbarAuth } from '@/components/layout/NavbarAuth'

const FEATURE_LISTS: Record<string, string[]> = {
  free: ['5 başvuru', '10 AI soru/ay', 'Temel kanban board'],
  pro: ['Sınırsız başvuru', '200 AI soru/ay', 'CV uyum skoru', 'CV otomatik uyarlama'],
  career_coach: [
    "Pro'daki her şey",
    'Sınırsız AI soru',
    'Şirket içgörüsü',
    'Maaş müzakere koçu',
    'Rakip analizi',
  ],
}

const FEATURES = [
  {
    icon: LinkIcon,
    title: 'Kanban ile takip',
    description:
      'İş ilanı linkini yapıştır, başvurunu otomatik oluştur ve Beklemede / Mülakat / Teklif / Reddedildi sütunlarında takip et.',
  },
  {
    icon: FileSearch,
    title: 'AI ile CV uyum skoru',
    description: "CV'ni yükle, AI ilana uyum oranını hesaplasın ve seni güçlendirecek önerileri sunsun.",
  },
  {
    icon: MessageSquareText,
    title: 'Mülakat hazırlık asistanı',
    description: "Mülakat öncesi AI'a sorularını sor, şirkete özel hazırlık tüyoları al.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Navbar */}
      <header className="mx-4 mt-4 rounded-[2rem] bg-neutral-900 shadow-lg shadow-black/60 sm:mx-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
          <Link href="/" className="col-start-1 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold text-white">Wisparkr</span>
          </Link>
          <nav className="col-start-2 hidden items-center gap-6 text-sm text-white/60 md:flex">
            <Link href="/#features" className="hover:text-white transition-colors">Özellikler</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Fiyatlandırma</Link>
          </nav>
          <div className="col-start-3 flex justify-end">
            <NavbarAuth />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-black">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI destekli iş başvuru yönetimi
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              İş başvurularını{' '}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Wisparkr
              </span>{' '}
              ile yönet
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/60">
              &ldquo;Başvurdum, ne oldu?&rdquo; sorusuna son. Wisparkr tüm başvuru sürecini tek bir
              yerden yönetmeni sağlar.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-black py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold text-white">
              Tüm ihtiyacın tek yerde
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-amber-900/20"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fiyatlandırma */}
        <section id="pricing" className="bg-black py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-3 text-center text-3xl font-bold text-white">
              İhtiyacına uygun planı seç
            </h2>
            <p className="mb-12 text-center text-white/50">İstediğin zaman değiştirebilirsin.</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PLAN_ORDER.map((planId) => {
                const plan = PLANS[planId]
                const highlighted = planId === 'pro'
                return (
                  <div
                    key={planId}
                    className={`flex flex-col gap-4 rounded-2xl border p-6 backdrop-blur-sm ${
                      highlighted
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {highlighted && (
                      <span className="self-start rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                        En Popüler
                      </span>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                      <p className="mt-1 text-3xl font-bold text-white">
                        ${plan.priceMonthly}
                        <span className="text-sm font-normal text-white/40">/ay</span>
                      </p>
                    </div>
                    <ul className="flex-1 space-y-2">
                      {FEATURE_LISTS[planId].map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-white/60">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href={planId === 'free' ? '/signup' : `/signup?plan=${planId}`}>
                      <button
                        className={`w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                          highlighted
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
                            : 'border border-white/20 bg-white/5 text-white'
                        }`}
                      >
                        {planId === 'free' ? 'Ücretsiz Başla' : 'Plana Geç'}
                      </button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black py-8 text-center text-sm text-white/30">
        © {new Date().getFullYear()} Wisparkr. Tüm hakları saklıdır.
      </footer>
    </div>
  )
}
