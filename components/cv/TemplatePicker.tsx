'use client'

import { Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import {
  CV_TEMPLATE_IDS,
  TEMPLATES,
  TEMPLATE_CATEGORY_ORDER,
  type CvTemplate,
} from '@/lib/cvTemplates'

export type { CvTemplate }

/**
 * Şablon seçici. Her kart, o şablonun GERÇEK PDF çıktısından üretilmiş
 * önizleme görselini (public/cv-templates/<id>.png) gösterir; görseller
 * scripts/gen-cv-thumbnails.mts ile yeniden üretilir.
 */
export function TemplatePicker({
  value,
  onChange,
}: {
  value: CvTemplate
  onChange: (t: CvTemplate) => void
}) {
  const { t } = useI18n()
  const names = t.templatePicker as unknown as Record<string, string>
  const categories = (t.templatePicker.categories ?? {}) as Record<string, string>

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-slate-900">{t.templatePicker.heading}</p>

      {TEMPLATE_CATEGORY_ORDER.map((cat) => {
        const ids = CV_TEMPLATE_IDS.filter((id) => TEMPLATES[id].category === cat)
        if (ids.length === 0) return null
        return (
          <div key={cat} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{categories[cat] ?? cat}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ids.map((id) => {
                const selected = value === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={`group relative rounded-xl border-2 p-2 text-left transition-all ${
                      selected
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white shadow">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="overflow-hidden rounded-md ring-1 ring-slate-200" style={{ aspectRatio: '210 / 297' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/cv-templates/${id}.png`}
                        alt={names[id] ?? id}
                        loading="lazy"
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    <p className={`mt-2 text-center text-xs font-medium ${selected ? 'text-purple-700' : 'text-slate-600'}`}>
                      {names[id] ?? id}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
