import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { GUIDES, getGuide } from '@/lib/guides'
import { getServerLocale, getServerDict } from '@/lib/i18n-server'

export function generateStaticParams() {
  // Slug'lar her iki dilde aynı; tr listesinden üret.
  return GUIDES.tr.map((g) => ({ slug: g.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const guide = getGuide(getServerLocale(), params.slug)
  return { title: guide ? `${guide.title} — Wisparkr` : 'Rehber — Wisparkr' }
}

export default function GuideDetailPage({ params }: { params: { slug: string } }) {
  const locale = getServerLocale()
  const t = getServerDict()
  const guide = getGuide(locale, params.slug)
  if (!guide) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <Link href="/rehber" className="text-sm font-medium text-purple-600 hover:underline">
            {t.guides.backToGuides}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">{guide.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{guide.readTime}</p>
          <p className="mt-6 text-slate-600">{guide.excerpt}</p>

          <div className="mt-8 space-y-8">
            {guide.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-lg font-semibold text-slate-900">{s.heading}</h2>
                <div className="mt-2 space-y-2">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-slate-600">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
