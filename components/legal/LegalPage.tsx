import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { LegalDoc } from '@/lib/legal'

/** Pazarlama yüzeyinde yasal belge düzeni (Navbar + içerik + Footer). */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-bold text-slate-900">{doc.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{doc.updated}</p>
          <p className="mt-6 text-slate-600">{doc.intro}</p>
          <div className="mt-8 space-y-8">
            {doc.sections.map((s) => (
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
