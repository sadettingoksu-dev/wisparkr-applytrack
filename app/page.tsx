'use client'

import Link from 'next/link'
import { Link as LinkIcon, FileSearch, MessageSquareText, Sparkles } from 'lucide-react'
import { AppDemo } from '@/components/landing/AppDemo'

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

// Baloncuklar demo panelinin sol kenarından çıkıp sola/yukarı akar
const BUBBLE_DEFS = [
  { size: 10, delay: '0s',   duration: '6s',  offsetY: '70%' },
  { size: 7,  delay: '1.2s', duration: '7s',  offsetY: '55%' },
  { size: 14, delay: '2.5s', duration: '8s',  offsetY: '80%' },
  { size: 6,  delay: '0.6s', duration: '5.5s',offsetY: '40%' },
  { size: 9,  delay: '3.1s', duration: '6.5s',offsetY: '65%' },
  { size: 5,  delay: '1.8s', duration: '7.5s',offsetY: '30%' },
  { size: 12, delay: '4s',   duration: '9s',  offsetY: '85%' },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0c29]">
      {/* Navbar */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold text-white">Wisparkr</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex ml-8">
            <Link href="/#features" className="hover:text-white transition-colors">Özellikler</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Fiyatlandırma</Link>
          </nav>
          {/* Giriş Yap tam sağa */}
          <div className="ml-auto">
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Giriş Yap
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
        >
          {/* Işık efektleri */}
          <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative mx-auto flex max-w-6xl items-center px-6 py-28">
            {/* Sol — yazılar */}
            <div className="relative z-10 w-full md:w-1/2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI destekli iş başvuru yönetimi
              </div>
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                İş başvurularını{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Wisparkr
                </span>{' '}
                ile yönet
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/60">
                &ldquo;Başvurdum, ne oldu?&rdquo; sorusuna son. Wisparkr tüm başvuru sürecini tek bir
                yerden yönetmeni sağlar.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/pricing">
                  <button className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors backdrop-blur-sm">
                    Fiyatlandırmayı Gör
                  </button>
                </Link>
              </div>
            </div>

            {/* Sağ — App Demo + baloncuklar */}
            <div className="pointer-events-none hidden md:flex md:w-1/2 justify-center items-center">
              <div className="relative scale-125 origin-center">
                <AppDemo />
                {/* Vignette */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{ boxShadow: 'inset 0 0 60px 30px rgba(15,12,41,0.9)' }}
                />
                {/* Baloncuklar — panelin tam sol kenarından çıkıp sola/yukarı akar */}
                {BUBBLE_DEFS.map((b, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border border-purple-400/50 bg-purple-500/15"
                    style={{
                      width: b.size,
                      height: b.size,
                      top: b.offsetY,
                      left: 0,
                      transform: 'translate(-50%, -50%)',
                      animation: `bubbleFloat ${b.duration} ${b.delay} infinite ease-in`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Alt yumuşak geçiş — keskin çizgi yok */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #0f0c29)' }}
          />
        </section>

        {/* Features */}
        <section
          id="features"
          className="py-24"
          style={{ background: '#0f0c29' }}
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold text-white">
              Tüm ihtiyacın tek yerde
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-900/20"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0f0c29] py-8 text-center text-sm text-white/30">
        © {new Date().getFullYear()} Wisparkr. Tüm hakları saklıdır.
      </footer>
    </div>
  )
}
