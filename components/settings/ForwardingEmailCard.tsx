'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { SettingsRow, ResultRow } from '@/components/settings/SettingsList'
import { CopyButton } from '@/components/settings/CopyButton'

export function ForwardingEmailCard({ userId }: { userId: string }) {
  const { t } = useI18n()
  const [shown, setShown] = useState(false)
  const address = `user_${userId}@inbox.wisparkr.com`

  return (
    <>
      <SettingsRow label={t.settings.forwardingTitle} description={t.settings.forwardingDesc}>
        {!shown && (
          <button
            type="button"
            onClick={() => setShown(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.settings.generate}
          </button>
        )}
      </SettingsRow>

      {/* Oluştur'a basınca: altında adres satırı + nasıl kullanılır */}
      {shown && (
        <>
          <ResultRow value={address}>
            <CopyButton text={address} />
          </ResultRow>
          <SettingsRow
            description={
              <div>
                <p className="font-medium text-slate-700">{t.settings.forwardingHowTitle}</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  <li>{t.settings.forwardingStep1}</li>
                  <li>{t.settings.forwardingStep2}</li>
                  <li>{t.settings.forwardingStep3}</li>
                </ol>
              </div>
            }
          />
        </>
      )}
    </>
  )
}
