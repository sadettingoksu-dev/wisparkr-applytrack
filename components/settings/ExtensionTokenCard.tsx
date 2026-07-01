'use client'

import { useState } from 'react'
import { RefreshCw, Plus } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'
import { SettingsRow, ResultRow } from '@/components/settings/SettingsList'
import { CopyButton } from '@/components/settings/CopyButton'

export function ExtensionTokenCard({ initialToken }: { initialToken: string }) {
  const { t } = useI18n()
  const [token, setToken] = useState(initialToken)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    // Mevcut token varsa yenileme → önce onay al.
    if (token && !confirm(t.settings.regenerateConfirm)) return
    setLoading(true)
    try {
      const res = await fetch('/api/extension/token', { method: 'POST' })
      const json = await res.json()
      if (json.data?.token) setToken(json.data.token)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SettingsRow label={t.settings.extensionTitle} description={t.settings.extensionDesc}>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? <Spinner /> : token ? <RefreshCw className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {loading ? t.settings.regenerating : token ? t.settings.regenerate : t.settings.generate}
        </button>
      </SettingsRow>

      {/* Oluşturunca / mevcutsa: altında token satırı */}
      {token && (
        <ResultRow value={token}>
          <CopyButton text={token} />
        </ResultRow>
      )}
    </>
  )
}
