'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FaqItem = { q: string; a: string }

interface FaqProps {
  heading: string
  subtitle: string
  items: FaqItem[]
}

/** Landing sayfası SSS bölümü — tıklayınca açılan akordeon. */
export function Faq({ heading, subtitle, items }: FaqProps) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-3 text-center text-3xl font-bold text-slate-900">{heading}</h2>
        <p className="mb-12 text-center text-slate-500">{subtitle}</p>

        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-purple-600 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500">{item.a}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
