'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Sparkles, Chrome, FileText, CalendarDays } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

const STEP_META = [
  { icon: FileText, href: '/cv-builder' },
  { icon: Sparkles, href: '/applications/new' },
  { icon: Chrome, href: '/settings' },
  { icon: CalendarDays, href: '/calendar' },
]

export function OnboardingBanner({ hasApplications, hasCv }: { hasApplications: boolean; hasCv: boolean }) {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(false)

  // Tüm adımlar tamamlandıysa veya kullanıcı kapattıysa gösterme
  if (dismissed || (hasApplications && hasCv)) return null

  const completedCount = [hasCv, hasApplications].filter(Boolean).length
  const pct = Math.round((completedCount / 2) * 100)

  return (
    <div className="rounded-xl border border-amber-500/15 bg-gradient-to-r from-amber-500/10 to-white/5 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{t.onboarding.welcome}</h2>
          <p className="text-xs text-white/50 mt-0.5">{t.onboarding.subtitle}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white/70">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-amber-500/15">
        <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STEP_META.map(({ icon: Icon, href }, i) => {
          const { title, desc, cta } = t.onboarding.steps[i]
          const done = i === 0 ? hasCv : i === 1 ? hasApplications : false
          return (
            <div
              key={title}
              className={`rounded-lg border p-3 text-left ${done ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
            >
              <Icon className={`h-4 w-4 mb-2 ${done ? 'text-emerald-400' : 'text-amber-400'}`} />
              <p className={`text-xs font-semibold ${done ? 'text-emerald-400 line-through' : 'text-white/90'}`}>{title}</p>
              {!done && (
                <>
                  <p className="mt-0.5 text-xs text-white/40">{desc}</p>
                  <Link href={href} className="mt-2 inline-block text-xs font-medium text-amber-500 hover:underline">
                    {cta} →
                  </Link>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
