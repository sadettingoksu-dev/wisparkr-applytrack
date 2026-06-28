import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { GUIDES } from '@/lib/guides'
import { getServerLocale, getServerDict } from '@/lib/i18n-server'

export const metadata = {
  title: 'Rehberler — Wisparkr',
  description: 'İş arama, CV ve mülakat sürecinde sana yol gösteren pratik rehberler.',
}

export default function GuidesPage() {
  const locale = getServerLocale()
  const t = getServerDict()
  const guides = GUIDES[locale]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-bold text-slate-900">{t.guides.title}</h1>
          <p className="mt-2 text-slate-500">{t.guides.subtitle}</p>

          <div className="mt-10 space-y-4">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/rehber/${g.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-slate-900">{g.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{g.excerpt}</p>
                  <p className="mt-2 text-xs text-slate-400">{g.readTime}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-purple-400 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
