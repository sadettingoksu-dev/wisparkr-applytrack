'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Sparkles, Chrome, FileText, CalendarDays } from 'lucide-react'

const STEPS = [
  {
    icon: FileText,
    title: 'CV\'ini yükle',
    desc: 'Ayarlar sayfasından CV\'ini yükle, AI başvurularını analiz etsin.',
    href: '/settings',
    cta: 'Ayarlara Git',
  },
  {
    icon: Sparkles,
    title: 'İlk başvurunu ekle',
    desc: 'Manuel ekle veya LinkedIn eklentisiyle tek tıkla kaydet.',
    href: '/applications/new',
    cta: 'Başvuru Ekle',
  },
  {
    icon: Chrome,
    title: 'Tarayıcı eklentisini kur',
    desc: 'Ayarlar\'dan token\'ını al, LinkedIn\'de ilanları tek tıkla kaydet.',
    href: '/settings',
    cta: 'Token Al',
  },
  {
    icon: CalendarDays,
    title: 'Mülakat tarihi gir',
    desc: 'Başvuru detayında mülakat tarihini gir, takvimde takip et.',
    href: '/calendar',
    cta: 'Takvimi Aç',
  },
]

export function OnboardingBanner({ hasApplications, hasCv }: { hasApplications: boolean; hasCv: boolean }) {
  const [dismissed, setDismissed] = useState(false)

  // Tüm adımlar tamamlandıysa veya kullanıcı kapattıysa gösterme
  if (dismissed || (hasApplications && hasCv)) return null

  const completedCount = [hasCv, hasApplications].filter(Boolean).length
  const totalSteps = STEPS.length
  const pct = Math.round((completedCount / 2) * 100)

  return (
    <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Wisparkr&apos;e Hoş Geldin! 👋</h2>
          <p className="text-xs text-slate-500 mt-0.5">Başlamak için şu adımları tamamla</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
        <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, desc, href, cta }, i) => {
          const done = i === 0 ? hasCv : i === 1 ? hasApplications : false
          return (
            <div
              key={title}
              className={`rounded-lg border p-3 text-left ${done ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-white'}`}
            >
              <Icon className={`h-4 w-4 mb-2 ${done ? 'text-emerald-500' : 'text-purple-500'}`} />
              <p className={`text-xs font-semibold ${done ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>{title}</p>
              {!done && (
                <>
                  <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
                  <Link href={href} className="mt-2 inline-block text-xs font-medium text-purple-600 hover:underline">
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
