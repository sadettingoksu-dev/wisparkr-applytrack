import { Puzzle, Mail, Share2, Languages } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getServerLocale } from '@/lib/i18n-server'
import { getMarketing } from '@/lib/marketing'

const ICONS: LucideIcon[] = [Puzzle, Mail, Share2, Languages]

/**
 * paytr'ın "Entegrasyonlar / İş Ortakları" bölümünün karşılığı.
 * Wisparkr'ın bağlantı noktalarını (eklenti, e-posta, paylaşım linki, çok dil)
 * kart gridinde tanıtır. Yalnızca sunum; metin marketing.ts'ten.
 */
export function IntegrationsBand() {
  const m = getMarketing(getServerLocale())
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-3 text-center text-3xl font-bold text-slate-900">{m.integrations.heading}</h2>
        <p className="mb-12 text-center text-slate-500">{m.integrations.subtitle}</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {m.integrations.items.map((item, i) => {
            const Icon = ICONS[i] ?? Puzzle
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:border-purple-500/40 hover:bg-purple-50/50"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
