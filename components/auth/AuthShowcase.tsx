'use client'

import {
  FileSearch,
  MessageSquareText,
  LayoutGrid,
  Sparkles,
  FileText,
  Share2,
  Check,
} from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

/** Yüzen özellik rozetleri — ikon + konum; etiketler çeviriden gelir. */
const CHIPS = [
  { icon: FileSearch, pos: 'left-[8%] top-[16%]', delay: '0s' },
  { icon: MessageSquareText, pos: 'right-[10%] top-[12%]', delay: '0.8s' },
  { icon: LayoutGrid, pos: 'left-[4%] top-[52%]', delay: '1.6s' },
  { icon: Sparkles, pos: 'right-[6%] top-[46%]', delay: '0.4s' },
  { icon: FileText, pos: 'left-[14%] bottom-[14%]', delay: '1.2s' },
  { icon: Share2, pos: 'right-[12%] bottom-[16%]', delay: '2s' },
]

export function AuthShowcase() {
  const { t } = useI18n()
  return (
    <div className="relative hidden w-full overflow-hidden rounded-[2rem] border border-purple-100 bg-gradient-to-br from-purple-100 via-fuchsia-50 to-white lg:flex lg:flex-col">
      {/* Mor ışıltı */}
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl" />

      {/* Radar halkaları + merkez */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[34rem] w-[34rem]">
          {/* Konsantrik halkalar */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-0 m-auto rounded-full border border-purple-300/40"
              style={{
                width: `${100 - i * 22}%`,
                height: `${100 - i * 22}%`,
              }}
            />
          ))}
          {/* Yavaş dönen tarama çizgisi */}
          <div className="wisparkr-spin-slow absolute inset-0 m-auto h-full w-full rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(147,51,234,0.12)_40deg,transparent_80deg)]" />
          {/* Nabız halkası */}
          <div className="wisparkr-pulse-ring absolute inset-0 m-auto h-40 w-40 rounded-full border border-purple-300" />

          {/* Merkez logo + isim */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Wisparkr"
              width={64}
              height={64}
              className="wisparkr-float mb-4 rounded-2xl shadow-lg shadow-purple-300/50"
            />
            <h2 className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-700 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent xl:text-6xl">
              Wisparkr
            </h2>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              {t.showcase.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Yüzen özellik rozetleri */}
      {CHIPS.map((chip, i) => (
        <div
          key={i}
          className={`wisparkr-float absolute ${chip.pos} flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xl shadow-purple-200/40 backdrop-blur-md`}
          style={{ animationDelay: chip.delay }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <chip.icon className="h-4 w-4" />
          </span>
          <span className="whitespace-nowrap text-sm font-medium text-slate-700">{t.showcase.chips[i]}</span>
        </div>
      ))}

      {/* Alt reklam şeridi */}
      <div className="wisparkr-fade-up absolute inset-x-0 bottom-0 flex flex-col gap-3 p-8">
        <div className="flex flex-wrap gap-2">
          {t.showcase.taglines.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700"
            >
              <Check className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
