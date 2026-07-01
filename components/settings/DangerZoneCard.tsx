'use client'

import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'
import { SettingsRow } from '@/components/settings/SettingsList'

export function DangerZoneCard() {
  const { t } = useI18n()
  const d = t.settings.danger
  const [confirming, setConfirming] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleExport() {
    window.location.href = '/api/account/export'
  }

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        setError(d.deleteError)
        setDeleting(false)
        return
      }
      await createClient().auth.signOut()
      window.location.href = '/'
    } catch {
      setError(d.deleteError)
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Veri dışa aktarma */}
      <SettingsRow label={d.exportTitle} description={d.exportDesc}>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          {d.exportBtn}
        </button>
      </SettingsRow>

      {/* Hesap silme */}
      <SettingsRow label={d.deleteTitle} description={d.deleteDesc}>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {d.deleteBtn}
          </button>
        )}
      </SettingsRow>

      {/* Silme onayı — altında beliren satır */}
      {confirming && (
        <div className="space-y-3 bg-red-50 px-4 py-3.5">
          <p className="text-xs font-medium text-red-700">{d.deletePrompt}</p>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={d.deleteKeyword}
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-300 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || keyword.trim().toUpperCase() !== d.deleteKeyword.toUpperCase()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? d.deleting : d.deleteConfirm}
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); setKeyword(''); setError(null) }}
              disabled={deleting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-40"
            >
              {d.cancel}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
