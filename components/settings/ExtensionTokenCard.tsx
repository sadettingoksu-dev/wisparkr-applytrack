'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/components/i18n/I18nProvider'

export function ExtensionTokenCard({ initialToken }: { initialToken: string }) {
  const { t } = useI18n()
  const [token, setToken] = useState(initialToken)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    if (!confirm(t.settings.regenerateConfirm)) {
      return
    }
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
    <Card className="space-y-2">
      <h2 className="text-sm font-semibold text-white">{t.settings.extensionTitle}</h2>
      <p className="text-sm text-white/50">
        {t.settings.extensionDesc}
      </p>
      <div className="flex items-center gap-2">
        <Input value={token} disabled />
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t.common.copied : t.common.copy}
        </Button>
      </div>
      <Button variant="secondary" onClick={handleRegenerate} disabled={loading}>
        <RefreshCw className="h-4 w-4" />
        {loading ? t.settings.regenerating : t.settings.regenerate}
      </Button>
    </Card>
  )
}
