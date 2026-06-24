'use client'

import { Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { CV_TEMPLATE_IDS, type CvTemplate } from '@/lib/cvTemplates'

export type { CvTemplate }

interface TemplateStyle {
  accent: string
  align: 'left' | 'center'
  rule: boolean
  block: boolean
}

// Görsel ipucu: PDF'teki vurgu rengi ve yerleşimle eşleşir.
const STYLES: Record<CvTemplate, TemplateStyle> = {
  classic: { accent: '#111827', align: 'left', rule: true, block: false },
  modern: { accent: '#7c3aed', align: 'left', rule: true, block: false },
  minimal: { accent: '#000000', align: 'center', rule: false, block: false },
  elegant: { accent: '#6d28d9', align: 'center', rule: true, block: false },
  professional: { accent: '#1e3a8a', align: 'left', rule: true, block: true },
  creative: { accent: '#c026d3', align: 'left', rule: false, block: true },
}

/** Şablon kartının içindeki küçük CV önizleme taslağı. */
function Thumb({ style }: { style: TemplateStyle }) {
  const itemsAlign = style.align === 'center' ? 'items-center' : 'items-start'
  return (
    <div className="flex aspect-[3/4] w-full flex-col gap-1.5 overflow-hidden rounded-md bg-white p-3 shadow-inner">
      {style.block && (
        <div className="-mx-3 -mt-3 mb-1 h-4" style={{ backgroundColor: style.accent }} />
      )}
      <div className={`flex w-full flex-col gap-1 ${itemsAlign}`}>
        <div className="h-1.5 w-2/3 rounded-sm" style={{ backgroundColor: style.accent }} />
        <div className="h-1 w-1/2 rounded-sm bg-slate-300" />
      </div>
      {style.rule && <div className="my-1 h-px w-full" style={{ backgroundColor: style.accent }} />}
      <div className="mt-1 space-y-1">
        <div className="h-1 w-1/3 rounded-sm" style={{ backgroundColor: style.accent }} />
        <div className="h-1 w-full rounded-sm bg-slate-200" />
        <div className="h-1 w-5/6 rounded-sm bg-slate-200" />
        <div className="h-1 w-11/12 rounded-sm bg-slate-200" />
      </div>
      <div className="mt-1 space-y-1">
        <div className="h-1 w-1/3 rounded-sm" style={{ backgroundColor: style.accent }} />
        <div className="h-1 w-full rounded-sm bg-slate-200" />
        <div className="h-1 w-2/3 rounded-sm bg-slate-200" />
      </div>
    </div>
  )
}

export function TemplatePicker({
  value,
  onChange,
}: {
  value: CvTemplate
  onChange: (t: CvTemplate) => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">{t.templatePicker.heading}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CV_TEMPLATE_IDS.map((id) => {
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
              <Thumb style={STYLES[id]} />
              <p className={`mt-2 text-center text-xs font-medium ${selected ? 'text-purple-700' : 'text-slate-600'}`}>
                {t.templatePicker[id]}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
