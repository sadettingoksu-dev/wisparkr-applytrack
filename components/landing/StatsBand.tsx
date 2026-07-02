import { getServerLocale } from '@/lib/i18n-server'
import { getMarketing } from '@/lib/marketing'

/**
 * paytr'ın "17 yıl / 200.000+ üye" istatistik bloğunun karşılığı.
 * Büyük rakamlar + kısa etiket. Yalnızca sunum; metin marketing.ts'ten.
 */
export function StatsBand() {
  const m = getMarketing(getServerLocale())
  return (
    <section className="bg-slate-900 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">{m.stats.heading}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">{m.stats.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {m.stats.items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-xl shadow-purple-900/20"
            >
              <p className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                {item.value}
              </p>
              <p className="mt-2 text-sm text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
