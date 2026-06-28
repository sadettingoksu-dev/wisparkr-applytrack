'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, LifeBuoy } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

/** Genel yardım merkezi — arama + kategoriler + açılır makaleler. */
export function HelpCenter() {
  const { t } = useI18n()
  const help = t.help
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const q = query.trim().toLocaleLowerCase('tr')

  // Aramayı kategori ve makale metinlerine uygula.
  const categories = useMemo(() => {
    if (!q) return help.categories
    return help.categories
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter(
          (a) =>
            a.q.toLocaleLowerCase('tr').includes(q) ||
            a.a.toLocaleLowerCase('tr').includes(q),
        ),
      }))
      .filter((cat) => cat.articles.length > 0)
  }, [help.categories, q])

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">{help.title}</h1>
      <p className="mt-2 text-slate-500">{help.subtitle}</p>

      {/* Arama */}
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={help.searchPlaceholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-purple-400"
        />
      </div>

      {/* Kategoriler */}
      {categories.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">{help.noResults}</p>
      ) : (
        <div className="mt-10 space-y-10">
          {categories.map((cat) => (
            <section key={cat.title}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{cat.title}</h2>
              <div className="space-y-3">
                {cat.articles.map((article) => {
                  const id = `${cat.title}:${article.q}`
                  const isOpen = open === id
                  return (
                    <div
                      key={id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">{article.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-purple-600 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500">
                          {article.a}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-purple-200 bg-purple-50 p-6 text-center">
        <LifeBuoy className="mx-auto mb-2 h-6 w-6 text-purple-600" />
        <h3 className="text-base font-semibold text-slate-900">{help.ctaTitle}</h3>
        <p className="mt-1 text-sm text-slate-500">{help.ctaDesc}</p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {help.ctaButton}
        </Link>
      </div>
    </div>
  )
}
