'use client'

import { useI18n } from '@/components/i18n/I18nProvider'

const TEMPLATE_IDS = ['classic', 'modern', 'minimal'] as const

export type CvTemplate = (typeof TEMPLATE_IDS)[number]

export function TemplatePicker({
  value,
  onChange,
}: {
  value: CvTemplate
  onChange: (t: CvTemplate) => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-white/40">{t.templatePicker.label}</span>
      {TEMPLATE_IDS.map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            value === id
              ? 'bg-amber-500/15 text-amber-300'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          {t.templatePicker[id]}
        </button>
      ))}
    </div>
  )
}
