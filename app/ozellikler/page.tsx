import {
  LayoutGrid,
  FileText,
  FileSearch,
  PenLine,
  MessageSquareText,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getServerDict } from '@/lib/i18n-server'

const FEATURE_ICONS = [LayoutGrid, FileText, FileSearch, PenLine, MessageSquareText, CalendarDays]

export default function FeaturesPage() {
  const t = getServerDict()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h1 className="mb-3 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
              {t.features.heading}
            </h1>
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
      </main>
      <Footer />
    </div>
  )
}
