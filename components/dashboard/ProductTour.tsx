'use client'

import { useEffect, useState } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'

const STORAGE_KEY = 'wisparkr-tour-done'

/**
 * İlk girişte beliren adım adım ürün turu. Tamamlanınca veya geçilince
 * localStorage'a işaretlenir ve bir daha gösterilmez.
 */
export function ProductTour() {
  const { t } = useI18n()
  const steps = t.tour.steps
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  // Yalnızca daha önce görmemiş kullanıcıya göster (hydration sonrası).
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== '1') setVisible(true)
  }, [])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const isLast = step === steps.length - 1
  const current = steps[step]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={close}
          aria-label={t.tour.skip}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{current.desc}</p>

        {/* İlerleme noktaları */}
        <div className="mt-6 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-purple-600' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {format(t.tour.stepOf, { current: step + 1, total: steps.length })}
          </span>
        </div>

        {/* Aksiyonlar */}
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.tour.back}
            </button>
          ) : (
            <button
              onClick={close}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              {t.tour.skip}
            </button>
          )}

          <button
            onClick={() => (isLast ? close() : setStep((s) => s + 1))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {isLast ? t.tour.finish : t.tour.next}
            {!isLast && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
