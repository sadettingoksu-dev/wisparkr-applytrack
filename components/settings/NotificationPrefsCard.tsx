'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/components/i18n/I18nProvider'

type PrefKey = 'notify_status_change' | 'notify_interview' | 'notify_product'

export function NotificationPrefsCard({
  initial,
}: {
  initial: { notify_status_change: boolean; notify_interview: boolean; notify_product: boolean }
}) {
  const { t } = useI18n()
  const n = t.settings.notify
  const [prefs, setPrefs] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(key: PrefKey) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next[key] }),
      })
      if (!res.ok) {
        setPrefs(prefs) // geri al
        setError(n.saveError)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch {
      setPrefs(prefs)
      setError(n.saveError)
    }
  }

  const rows: { key: PrefKey; label: string }[] = [
    { key: 'notify_status_change', label: n.statusChange },
    { key: 'notify_interview', label: n.interview },
    { key: 'notify_product', label: n.product },
  ]

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          <h2 className="text-base font-semibold text-slate-900">{n.title}</h2>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="h-3.5 w-3.5" />
            {n.saved}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500">{n.desc}</p>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-700">{row.label}</span>
            <button
              role="switch"
              aria-checked={prefs[row.key]}
              onClick={() => toggle(row.key)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                prefs[row.key] ? 'bg-purple-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[row.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </Card>
  )
}
