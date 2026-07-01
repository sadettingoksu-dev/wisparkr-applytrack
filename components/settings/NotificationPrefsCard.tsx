'use client'

import { useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { SettingsRow } from '@/components/settings/SettingsList'

type PrefKey = 'notify_status_change' | 'notify_interview' | 'notify_product'

export function NotificationPrefsCard({
  initial,
}: {
  initial: { notify_status_change: boolean; notify_interview: boolean; notify_product: boolean }
}) {
  const { t } = useI18n()
  const n = t.settings.notify
  const [prefs, setPrefs] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  async function toggle(key: PrefKey) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setError(null)
    try {
      const res = await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next[key] }),
      })
      if (!res.ok) {
        setPrefs(prefs) // geri al
        setError(n.saveError)
      }
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
    <>
      {rows.map((row) => (
        <SettingsRow key={row.key} label={row.label}>
          <button
            type="button"
            role="switch"
            aria-checked={prefs[row.key]}
            aria-label={row.label}
            onClick={() => toggle(row.key)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[row.key] ? 'bg-purple-600' : 'bg-slate-200'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[row.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
            />
          </button>
        </SettingsRow>
      ))}
      {error && <SettingsRow description={<span className="text-red-500">{error}</span>} />}
    </>
  )
}
