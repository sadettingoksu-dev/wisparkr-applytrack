'use client'

import { Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { CV_TEMPLATE_IDS, TEMPLATE_VISUALS, type CvTemplate } from '@/lib/cvTemplates'

export type { CvTemplate }

const Line = ({ w, color }: { w: string; color?: string }) => (
  <div className={`h-1 rounded-sm ${w}`} style={{ backgroundColor: color ?? '#e2e8f0' }} />
)

/** Bir bölüm: küçük renkli başlık + çizgi + gri içerik satırları. */
function Section({ accent, lines = 3 }: { accent: string; lines?: number }) {
  const widths = ['w-full', 'w-5/6', 'w-11/12', 'w-2/3']
  return (
    <div className="space-y-1">
      <div className="h-1 w-1/3 rounded-sm" style={{ backgroundColor: accent }} />
      <div className="h-px w-full bg-slate-200" />
      {Array.from({ length: lines }).map((_, i) => (
        <Line key={i} w={widths[i % widths.length]} />
      ))}
    </div>
  )
}

function SingleThumb({ accent, centered }: { accent: string; centered: boolean }) {
  return (
    <div className="flex aspect-[3/4] w-full flex-col gap-2 overflow-hidden rounded-md bg-white p-3 shadow-inner">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex flex-1 flex-col gap-1 ${centered ? 'items-center' : 'items-start'}`}>
          <div className="h-2 w-2/3 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="h-1 w-1/2 rounded-sm bg-slate-300" />
          <div className="h-1 w-3/4 rounded-sm bg-slate-200" />
        </div>
        {!centered && <div className="h-7 w-6 shrink-0 rounded-sm bg-slate-300" />}
      </div>
      <div className="h-[2px] w-full rounded" style={{ backgroundColor: accent }} />
      <Section accent={accent} lines={3} />
      <Section accent={accent} lines={2} />
    </div>
  )
}

function SidebarThumb({ accent, filled }: { accent: string; filled: boolean }) {
  const sideBg = filled ? accent : '#f3effb'
  const sideAccent = filled ? 'rgba(255,255,255,0.92)' : accent
  const sideLine = filled ? 'rgba(255,255,255,0.55)' : '#cdbef0'
  const photoBg = filled ? 'rgba(255,255,255,0.85)' : '#cdbef0'
  return (
    <div className="flex aspect-[3/4] w-full overflow-hidden rounded-md bg-white shadow-inner">
      <div className="flex w-[37%] flex-col gap-2 p-2" style={{ backgroundColor: sideBg }}>
        <div className="mx-auto h-7 w-7 rounded-full" style={{ backgroundColor: photoBg }} />
        {[0, 1].map((b) => (
          <div key={b} className="space-y-1">
            <div className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: sideAccent }} />
            <div className="h-1 w-full rounded-sm" style={{ backgroundColor: sideLine }} />
            {b === 0 && <div className="h-1 w-5/6 rounded-sm" style={{ backgroundColor: sideLine }} />}
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="flex flex-col gap-1">
          <div className="h-2 w-3/4 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="h-1 w-1/2 rounded-sm bg-slate-300" />
        </div>
        <Section accent={accent} lines={3} />
        <Section accent={accent} lines={2} />
      </div>
    </div>
  )
}

function BandThumb({ accent }: { accent: string }) {
  return (
    <div className="flex aspect-[3/4] w-full flex-col overflow-hidden rounded-md bg-white shadow-inner">
      <div className="flex items-center justify-between gap-2 p-3" style={{ backgroundColor: accent }}>
        <div className="flex flex-1 flex-col gap-1">
          <div className="h-2 w-2/3 rounded-sm bg-white/90" />
          <div className="h-1 w-1/2 rounded-sm bg-white/60" />
        </div>
        <div className="h-6 w-6 shrink-0 rounded-full bg-white/80" />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <Section accent={accent} lines={3} />
        <Section accent={accent} lines={2} />
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
          const v = TEMPLATE_VISUALS[id]
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
              {v.layout === 'sidebar' ? (
                <SidebarThumb accent={v.accent} filled={v.sidebarFilled} />
              ) : v.layout === 'band' ? (
                <BandThumb accent={v.accent} />
              ) : (
                <SingleThumb accent={v.accent} centered={v.centered} />
              )}
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
