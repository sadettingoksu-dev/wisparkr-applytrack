'use client'

import { Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import {
  CV_TEMPLATE_IDS,
  TEMPLATES,
  TEMPLATE_CATEGORY_ORDER,
  type CvTemplate,
  type CvTemplateDef,
} from '@/lib/cvTemplates'

export type { CvTemplate }

const Line = ({ w, color }: { w: string; color?: string }) => (
  <div className={`h-1 rounded-sm ${w}`} style={{ backgroundColor: color ?? '#e2e8f0' }} />
)

/** Bölüm: başlık stiline göre küçük renkli işaret + içerik satırları. */
function Section({ def, lines = 3, onDark = false }: { def: CvTemplateDef; lines?: number; onDark?: boolean }) {
  const widths = ['w-full', 'w-5/6', 'w-11/12', 'w-2/3']
  const { accent, headingStyle } = def
  const lineColor = onDark ? 'rgba(255,255,255,0.35)' : '#e2e8f0'
  const dividerColor = onDark ? 'rgba(255,255,255,0.28)' : '#e2e8f0'
  return (
    <div className="space-y-1">
      {headingStyle === 'boxed' ? (
        <div className="h-1.5 w-1/3 rounded-[1px]" style={{ backgroundColor: accent }} />
      ) : headingStyle === 'pill' ? (
        <div className="h-1.5 w-1/3 rounded-full border" style={{ borderColor: accent }} />
      ) : headingStyle === 'bar' ? (
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-[3px] rounded-sm" style={{ backgroundColor: accent }} />
          <div className="h-1 w-1/4 rounded-sm" style={{ backgroundColor: accent }} />
        </div>
      ) : headingStyle === 'timeline' ? (
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-1 w-1/4 rounded-sm" style={{ backgroundColor: accent }} />
        </div>
      ) : headingStyle === 'plain' ? (
        <div className="h-1 w-1/3 rounded-sm" style={{ backgroundColor: accent }} />
      ) : (
        <>
          <div className="h-1 w-1/3 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="h-px w-full" style={{ backgroundColor: dividerColor }} />
        </>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Line key={i} w={widths[i % widths.length]} color={lineColor} />
      ))}
    </div>
  )
}

function SingleThumb({ def }: { def: CvTemplateDef }) {
  const { accent, headerAlign } = def
  const centered = headerAlign === 'center'
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
      <Section def={def} lines={3} />
      <Section def={def} lines={2} />
    </div>
  )
}

/** Hex rengin koyu olup olmadığı (thumbnail metin/çizgi kontrastı için). */
function thumbIsDark(hex: string): boolean {
  const h = (hex || '').replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}

function SidebarThumb({ def }: { def: CvTemplateDef }) {
  const { accent, sidebarFilled: filled, sidebarSide } = def
  const onRight = sidebarSide === 'right'
  const sideBg = def.sidebarBg ?? (filled ? accent : '#f3effb')
  const mainBg = def.mainBg ?? '#ffffff'
  const sideDark = thumbIsDark(sideBg)
  const mainDark = thumbIsDark(mainBg)
  const sideAccent = def.sidebarHeadColor ?? (sideDark ? 'rgba(255,255,255,0.92)' : accent)
  const sideLine = sideDark ? 'rgba(255,255,255,0.5)' : filled ? 'rgba(255,255,255,0.55)' : `${accent}44`
  const photoBg = sideDark ? 'rgba(255,255,255,0.85)' : `${accent}55`
  const photoRadius = def.photoShape === 'square' ? 'rounded-[2px]' : def.photoShape === 'rounded' ? 'rounded' : 'rounded-full'
  const rated = def.skillStyle === 'stars' || def.skillStyle === 'bars'
  const nameInSide = def.nameIn === 'sidebar'

  // Yan panelde küçük "puan" satırları (yıldız → noktalar, çubuk → bar).
  const RatedRows = (
    <div className="space-y-1">
      {[0, 1, 2].map((r) => (
        <div key={r} className="flex items-center justify-between gap-1">
          <div className="h-1 rounded-sm" style={{ width: '40%', backgroundColor: sideLine }} />
          {def.skillStyle === 'bars' ? (
            <div className="h-1 w-1/2 rounded-sm" style={{ backgroundColor: sideDark ? 'rgba(255,255,255,0.25)' : `${accent}33` }}>
              <div className="h-full rounded-sm" style={{ width: `${70 - r * 12}%`, backgroundColor: accent }} />
            </div>
          ) : (
            <div className="flex gap-[2px]">
              {[0, 1, 2, 3, 4].map((d) => (
                <div key={d} className="h-1 w-1 rounded-full" style={{ backgroundColor: d < 4 - (r % 2) ? accent : sideLine }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const Side = (
    <div className="flex w-[37%] flex-col gap-2 p-2" style={{ backgroundColor: sideBg }}>
      <div className={`mx-auto h-7 w-7 ${photoRadius}`} style={{ backgroundColor: photoBg }} />
      {nameInSide && (
        <div className="space-y-1">
          <div className="h-1.5 w-3/4 rounded-sm" style={{ backgroundColor: sideAccent }} />
          <div className="h-1 w-1/2 rounded-sm" style={{ backgroundColor: sideLine }} />
        </div>
      )}
      {[0, 1].map((b) => (
        <div key={b} className="space-y-1">
          <div className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: sideAccent }} />
          <div className="h-1 w-full rounded-sm" style={{ backgroundColor: sideLine }} />
          {b === 0 && <div className="h-1 w-5/6 rounded-sm" style={{ backgroundColor: sideLine }} />}
        </div>
      ))}
      {rated && RatedRows}
    </div>
  )
  const Main = (
    <div className="flex flex-1 flex-col gap-2 p-2.5" style={{ backgroundColor: mainBg }}>
      {!nameInSide && (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-3/4 rounded-sm" style={{ backgroundColor: mainDark ? '#ffffff' : accent }} />
          <div className="h-1 w-1/2 rounded-sm" style={{ backgroundColor: def.headlineColor ?? '#cbd5e1' }} />
        </div>
      )}
      <Section def={def} lines={3} onDark={mainDark} />
      <Section def={def} lines={2} onDark={mainDark} />
    </div>
  )
  return (
    <div className="flex aspect-[3/4] w-full overflow-hidden rounded-md shadow-inner" style={{ backgroundColor: mainBg }}>
      {onRight ? (<>{Main}{Side}</>) : (<>{Side}{Main}</>)}
    </div>
  )
}

function BandThumb({ def }: { def: CvTemplateDef }) {
  const { accent, headerAlign } = def
  const centered = headerAlign === 'center'
  return (
    <div className="flex aspect-[3/4] w-full flex-col overflow-hidden rounded-md bg-white shadow-inner">
      <div className={`flex items-center gap-2 p-3 ${centered ? 'justify-center' : 'justify-between'}`} style={{ backgroundColor: accent }}>
        <div className={`flex flex-1 flex-col gap-1 ${centered ? 'items-center' : ''}`}>
          <div className="h-2 w-2/3 rounded-sm bg-white/90" />
          <div className="h-1 w-1/2 rounded-sm bg-white/60" />
        </div>
        {!centered && <div className="h-6 w-6 shrink-0 rounded-full bg-white/80" />}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <Section def={def} lines={3} />
        <Section def={def} lines={2} />
      </div>
    </div>
  )
}

function Thumb({ def }: { def: CvTemplateDef }) {
  if (def.layout === 'sidebar') return <SidebarThumb def={def} />
  if (def.layout === 'band') return <BandThumb def={def} />
  return <SingleThumb def={def} />
}

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
                const def = TEMPLATES[id]
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
                    <Thumb def={def} />
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
