'use client'

import { Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { CV_TEMPLATE_IDS, type CvTemplate } from '@/lib/cvTemplates'

export type { CvTemplate }

// PDF motoru (lib/cvDocument.tsx THEMES) ile eşleşen görsel ipuçları.
interface TemplateStyle {
  layout: 'single' | 'sidebar'
  accent: string
  align: 'left' | 'center'
  rule: boolean
  photo: boolean
  filled: boolean // sidebar dolu renk mi (creative)
}

const STYLES: Record<CvTemplate, TemplateStyle> = {
  classic: { layout: 'single', accent: '#1f2937', align: 'left', rule: true, photo: true, filled: false },
  professional: { layout: 'single', accent: '#1e3a8a', align: 'left', rule: true, photo: true, filled: false },
  minimal: { layout: 'single', accent: '#111111', align: 'center', rule: false, photo: false, filled: false },
  elegant: { layout: 'single', accent: '#6d28d9', align: 'center', rule: true, photo: false, filled: false },
  modern: { layout: 'sidebar', accent: '#7c3aed', align: 'left', rule: true, photo: true, filled: false },
  creative: { layout: 'sidebar', accent: '#c026d3', align: 'left', rule: true, photo: true, filled: true },
}

const Line = ({ w, color }: { w: string; color?: string }) => (
  <div className={`h-1 rounded-sm ${w}`} style={{ backgroundColor: color ?? '#e2e8f0' }} />
)

/** Bir bölüm: küçük renkli başlık + (varsa) çizgi + gri içerik satırları. */
function Section({ accent, rule, lines = 3 }: { accent: string; rule: boolean; lines?: number }) {
  const widths = ['w-full', 'w-5/6', 'w-11/12', 'w-2/3']
  return (
    <div className="space-y-1">
      <div className="h-1 w-1/3 rounded-sm" style={{ backgroundColor: accent }} />
      {rule && <div className="h-px w-full bg-slate-200" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Line key={i} w={widths[i % widths.length]} />
      ))}
    </div>
  )
}

function SingleThumb({ st }: { st: TemplateStyle }) {
  const center = st.align === 'center'
  return (
    <div className="flex aspect-[3/4] w-full flex-col gap-2 overflow-hidden rounded-md bg-white p-3 shadow-inner">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex flex-1 flex-col gap-1 ${center ? 'items-center' : 'items-start'}`}>
          <div className="h-2 w-2/3 rounded-sm" style={{ backgroundColor: st.accent }} />
          <div className="h-1 w-1/2 rounded-sm bg-slate-300" />
          <div className="h-1 w-3/4 rounded-sm bg-slate-200" />
        </div>
        {st.photo && !center && (
          <div className="h-7 w-6 shrink-0 rounded-sm bg-slate-300" />
        )}
      </div>
      {st.rule && <div className="h-[2px] w-full rounded" style={{ backgroundColor: st.accent }} />}
      <Section accent={st.accent} rule={st.rule} lines={3} />
      <Section accent={st.accent} rule={st.rule} lines={2} />
    </div>
  )
}

function SidebarThumb({ st }: { st: TemplateStyle }) {
  const sideBg = st.filled ? st.accent : '#f3effb'
  const sideAccent = st.filled ? 'rgba(255,255,255,0.92)' : st.accent
  const sideLine = st.filled ? 'rgba(255,255,255,0.55)' : '#cdbef0'
  const photoBg = st.filled ? 'rgba(255,255,255,0.85)' : '#cdbef0'
  return (
    <div className="flex aspect-[3/4] w-full overflow-hidden rounded-md bg-white shadow-inner">
      {/* Sidebar */}
      <div className="flex w-[37%] flex-col gap-2 p-2" style={{ backgroundColor: sideBg }}>
        <div className="mx-auto h-7 w-7 rounded-full" style={{ backgroundColor: photoBg }} />
        <div className="space-y-1">
          <div className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: sideAccent }} />
          <div className="h-1 w-full rounded-sm" style={{ backgroundColor: sideLine }} />
          <div className="h-1 w-5/6 rounded-sm" style={{ backgroundColor: sideLine }} />
        </div>
        <div className="space-y-1">
          <div className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: sideAccent }} />
          <div className="h-1 w-full rounded-sm" style={{ backgroundColor: sideLine }} />
        </div>
      </div>
      {/* Main */}
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="flex flex-col gap-1">
          <div className="h-2 w-3/4 rounded-sm" style={{ backgroundColor: st.accent }} />
          <div className="h-1 w-1/2 rounded-sm bg-slate-300" />
        </div>
        <Section accent={st.accent} rule lines={3} />
        <Section accent={st.accent} rule lines={2} />
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
          const st = STYLES[id]
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
              {st.layout === 'sidebar' ? <SidebarThumb st={st} /> : <SingleThumb st={st} />}
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
