import Link from 'next/link'
import { cookies } from 'next/headers'
import { FileText, Sparkles, ShieldCheck, Wrench, Bot, Mic, Banknote, Users, Kanban } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { IntegrationsBand } from '@/components/landing/IntegrationsBand'
import { FeatureShowcase } from '@/components/landing/FeatureShowcase'
import { ShowcaseMock } from '@/components/landing/ShowcaseMock'
import { ParkrcanWidget } from '@/components/assistant/ParkrcanWidget'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n'

// Yumuşak marka ışıması — kareli zemin kaldırıldı. Üstte hafif mor/fuşya
// glow, aşağı doğru zemine karışır. Yalnızca sunum; yapıyı bozmaz.
// Zemin rengi değişkenden gelir: inline style'a CSS sınıf override'ı
// ulaşamadığı için sabit #f8fafc koyu temada kocaman beyaz bir blok
// bırakıyordu (navbar ve alttaki şerit koyuyken hero bembeyazdı).
const HERO_BG: React.CSSProperties = {
  backgroundColor: 'var(--hero-bg)',
  backgroundImage:
    'radial-gradient(60% 55% at 50% 0%, rgba(168,85,247,0.10), transparent 70%)',
}

export default async function LandingPage() {
  // Giriş yapmış kullanıcı da pazarlama sayfasını görebilir — YÖNLENDİRME YOK.
  //
  // Eskiden burada `if (user) redirect('/dashboard')` vardı ve tek kaçışı
  // `?home=1` parametresiydi; onu da yalnızca sidebar'daki "Web sitesi" linki
  // veriyordu. O link kaldırılınca, giriş yapmış bir kullanıcının adres
  // çubuğuna "wisparkr.com" yazması hiçbir işe yaramıyordu: sayfa onu inatla
  // panele geri atıyordu. Kullanıcı URL'yi bilerek yazdıysa siteyi görmek
  // istiyordur.
  //
  // Panele dönüş: navbar'da oturum açıkken "Panele git" butonu (NavbarAuth) —
  // Notion/Linear/Vercel'in yaptığı gibi. Giriş akışı zaten doğrudan
  // /dashboard'a gidiyor, yani bu yönlendirmenin başka bir görevi yoktu.
  const { data: { user } } = await createClient().auth.getUser()

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

        {/* Özellikler — yeni yapay zeka yeteneklerinin vitrini */}
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900">{t.landingFeatures.heading}</h2>
              <p className="mt-3 text-slate-500">{t.landingFeatures.subtitle}</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {t.landingFeatures.items.map((item, i) => {
                const Icon = [Wrench, Bot, Mic, Banknote, Users, Kanban][i] ?? Sparkles
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition hover:border-purple-200 hover:bg-white hover:shadow-sm"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* İş akışına sorunsuz bağlanır — entegrasyon bölümü */}
        <IntegrationsBand />

        {/* Kapanış CTA — ücretsiz başla */}
        <section className="relative overflow-hidden border-t border-slate-200">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={HERO_BG} />
          <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
            <h2 className="text-3xl font-bold text-slate-900">{t.landingCta.heading}</h2>
            <p className="mt-3 text-slate-500">{t.landingCta.subtitle}</p>
            <div className="mt-8 flex justify-center">
              <Link href="/signup?next=/cv-builder">
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-300/40 transition-opacity hover:opacity-90">
                  <FileText className="h-4 w-4" />
                  {t.landingCta.button}
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* parkrcan — yalnızca giriş yapmış kullanıcıya (uygulama içi rehber);
          anonim ziyaretçi için pazarlama sayfasında anlamı yok. Eskiden
          `?home=1` ile gösteriliyordu, o parametre artık kullanılmıyor. */}
      {user && <ParkrcanWidget lower />}
    </div>
  )
}
