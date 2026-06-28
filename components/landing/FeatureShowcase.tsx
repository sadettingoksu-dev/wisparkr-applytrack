import { Reveal } from '@/components/landing/Reveal'

interface Shot {
  mock: React.ReactNode
  title: string
  description: string
}

/**
 * clipto tarzı kademeli (zigzag) ürün vitrinı: gerçek sayfa ekran görüntüleri
 * tarayıcı çerçevesi içinde, sıra sıra sağ/sol kayık dizilir; ortadan geçen kesik
 * çizgiyle bağlanır ve kaydırınca kayarak belirirler (Reveal).
 */
export function FeatureShowcase({
  heading,
  subtitle,
  shots,
}: {
  heading: string
  subtitle: string
  shots: Shot[]
}) {
  return (
    <section id="how" className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{heading}</h2>
          <p className="mt-3 text-lg text-slate-500">{subtitle}</p>
        </div>

        <div className="relative space-y-16 lg:space-y-24">
          {/* Ortadan geçen kesik bağlantı çizgisi (yalnızca geniş ekran) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-8 hidden h-[calc(100%-4rem)] -translate-x-1/2 border-l-2 border-dashed border-purple-200 lg:block"
          />

          {shots.map((shot, i) => {
            const right = i % 2 === 1
            return (
              <div
                key={shot.title}
                className={`relative flex flex-col items-center gap-8 lg:flex-row ${
                  right ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Ürün maketi — tarayıcı çerçevesinde (i18n metniyle, dil-duyarlı) */}
                <Reveal className="w-full lg:w-3/5">
                  <div className="wisparkr-float overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-purple-200/50">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    </div>
                    <div className="p-4 sm:p-5">{shot.mock}</div>
                  </div>
                </Reveal>

                {/* Metin */}
                <Reveal
                  delay={120}
                  className={`w-full lg:w-2/5 ${right ? 'lg:pr-12 lg:text-right' : 'lg:pl-12'}`}
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">{shot.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{shot.description}</p>
                </Reveal>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
