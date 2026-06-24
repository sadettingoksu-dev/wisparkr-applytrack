'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { Application } from '@/lib/types'

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  // Monday-first: Sunday=6, Mon=0
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { startOffset, daysInMonth }
}

export function CalendarGrid({ apps }: { apps: Application[] }) {
  const { t, locale } = useI18n()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prev() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) } else setMonth((m) => m - 1)
  }
  function next() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) } else setMonth((m) => m + 1)
  }

  const { startOffset, daysInMonth } = getMonthDays(year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })

  // interview_date olan başvuruları bu ay için grupla
  const byDay: Record<number, Application[]> = {}
  apps.forEach((a) => {
    if (!a.interview_date) return
    const d = new Date(a.interview_date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(a)
    }
  })

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="rounded-lg p-1.5 hover:bg-slate-100">
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>
        <p className="text-sm font-semibold text-slate-900 capitalize">{monthLabel}</p>
        <button onClick={next} className="rounded-lg p-1.5 hover:bg-slate-100">
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {t.calendar.days.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-slate-400">{d}</div>
        ))}

        {/* Cells */}
        {cells.map((day, i) => {
          const isToday = day !== null && year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
          const events = day ? (byDay[day] ?? []) : []
          return (
            <div
              key={i}
              className={`min-h-[64px] rounded-lg border p-1 text-xs ${
                day === null ? 'border-transparent' : isToday ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white'
              }`}
            >
              {day !== null && (
                <>
                  <p className={`mb-1 text-right font-medium ${isToday ? 'text-purple-600' : 'text-slate-500'}`}>{day}</p>
                  <div className="space-y-0.5">
                    {events.map((a) => (
                      <Link
                        key={a.id}
                        href={`/applications/${a.id}`}
                        className="block truncate rounded bg-purple-100 px-1 py-0.5 text-[10px] font-medium text-purple-700 hover:bg-purple-100"
                        title={`${a.position_title} — ${a.company_name}`}
                      >
                        {a.position_title}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
