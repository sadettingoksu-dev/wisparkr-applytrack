import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { FileText, Sparkles, ShieldCheck } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { IntegrationsBand } from '@/components/landing/IntegrationsBand'
import { FeatureShowcase } from '@/components/landing/FeatureShowcase'
import { ShowcaseMock } from '@/components/landing/ShowcaseMock'
import { ParkrcanWidget } from '@/components/assistant/ParkrcanWidget'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n'

// Yumuşak marka ışıması — kareli zemin kaldırıldı. Üstte hafif mor/fuşya
// glow, aşağı doğru temiz beyaza karışır. Yalnızca sunum; yapıyı bozmaz.
const HERO_BG: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  backgroundImage:
    'radial-gradient(60% 55% at 50% 0%, rgba(168,85,247,0.10), transparent 70%)',
}

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero — soluk kareli zemin üzerinde ortalanmış metin + tek CTA.
            (Sağdaki ürün animasyonu kaldırıldı; yeni sahne sonra eklenecek.) */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={HERO_BG} />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center lg:py-32">
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
            <div className="mt-8 flex justify-center">
              {/* Tek çağrı: ücretsiz CV oluştur → giriş/kayıt, sonra /cv-builder */}
              <Link href="/signup?next=/cv-builder">
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-300/40 transition-opacity hover:opacity-90">
                  <FileText className="h-4 w-4" />
                  {t.hero.ctaCv}
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Güven şeridi — dürüst değer noktaları (sayısal iddia yok) */}
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

        {/* Nasıl çalışır? — gerçek sayfa görselleriyle kademeli vitrin */}
        <FeatureShowcase
          heading={t.howItWorks.heading}
          subtitle={t.howItWorks.subtitle}
          shots={t.howItWorks.steps.map((s, i) => ({ ...s, mock: <ShowcaseMock index={i} t={t} /> }))}
        />

        {/* İş akışına sorunsuz bağlanır — entegrasyon bölümü */}
        <IntegrationsBand />
      </main>

      <Footer />

      {/* parkrcan — yalnızca panelden gelen (?home=1) görünümde, sayfada aşağıda */}
      {searchParams.home === '1' && <ParkrcanWidget lower />}
    </div>
  )
}
