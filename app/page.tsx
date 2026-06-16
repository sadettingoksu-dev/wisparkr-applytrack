import Link from 'next/link'
import { Link as LinkIcon, FileSearch, MessageSquareText } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'

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
    <div className="flex min-h-screen flex-col bg-[#0f0c29]">
      {/* Navbar — koyu tema */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold text-white">Wisparkr</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
            <Link href="/#features" className="hover:text-white transition-colors">Özellikler</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Fiyatlandırma</Link>
          </nav>
          <div className="flex items-center gap-3">
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
          style={{
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          }}
        >
          {/* Işık efektleri */}
          <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-28 text-center md:flex-row md:text-left">
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI destekli iş başvuru yönetimi
              </div>
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                İş başvurularını{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI desteğiyle
                </span>{' '}
                yönet
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/60">
                &ldquo;Başvurdum, ne oldu?&rdquo; sorusuna son. Wisparkr tüm başvuru sürecini tek bir
                yerden yönetmeni sağlar.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
<Link href="/pricing">
                  <button className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors backdrop-blur-sm">
                    Fiyatlandırmayı Gör
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="py-24"
          style={{ background: 'linear-gradient(180deg, #24243e 0%, #0f0c29 100%)' }}
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

      <footer className="border-t border-white/10 bg-[#0f0c29] py-8 text-center text-sm text-white/30">
        © {new Date().getFullYear()} Wisparkr. Tüm hakları saklıdır.
      </footer>
    </div>
  )
}
