'use client'

import { useEffect, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { SettingsRow, ResultRow } from '@/components/settings/SettingsList'
import { CopyButton } from '@/components/settings/CopyButton'

export function ReferralCard() {
  const { t } = useI18n()
  const r = t.referral
  const [link, setLink] = useState('')
  const [count, setCount] = useState(0)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.code) {
          setLink(`${window.location.origin}/signup?ref=${json.data.code}`)
          setCount(json.data.count ?? 0)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <SettingsRow label={r.title} description={r.desc}>
        {!shown && (
          <button
            type="button"
            onClick={() => setShown(true)}
            disabled={!link}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.settings.generate}
          </button>
        )}
      </SettingsRow>

      {/* Oluştur'a basınca: altında davet linki satırı */}
      {shown && link && (
        <ResultRow value={link}>
          <CopyButton text={link} />
        </ResultRow>
      )}

      {/* Davet edilen sayısı */}
      <SettingsRow label={<span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-purple-600" />{r.invited}</span>} description={r.reward}>
        <span className="text-lg font-bold text-purple-700">{count}</span>
      </SettingsRow>
    </>
  )
}
