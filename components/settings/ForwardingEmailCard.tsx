'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/components/i18n/I18nProvider'

export function ForwardingEmailCard({ userId }: { userId: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const address = `user_${userId}@inbox.wisparkr.com`

  async function handleCopy() {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="space-y-2">
      <h2 className="text-sm font-semibold text-white">{t.settings.forwardingTitle}</h2>
      <p className="text-sm text-white/50">
        {t.settings.forwardingDesc}
      </p>
      <div className="flex items-center gap-2">
        <Input value={address} disabled />
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t.common.copied : t.common.copy}
        </Button>
      </div>

      <div className="rounded-lg bg-white/5 p-3 text-sm text-white/70">
        <p className="font-medium text-white/90">{t.settings.forwardingHowTitle}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>{t.settings.forwardingStep1}</li>
          <li>{t.settings.forwardingStep2}</li>
          <li>{t.settings.forwardingStep3}</li>
        </ol>
      </div>
    </Card>
  )
}
