'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ExtensionTokenCard({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    if (!confirm('Yeni bir token oluşturulursa eski token ile bağlı tarayıcı eklentileri çalışmayı durdurur. Devam edilsin mi?')) {
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
      <h2 className="text-sm font-semibold text-slate-800">Tarayıcı Eklentisi</h2>
      <p className="text-sm text-slate-500">
        Wisparkr tarayıcı eklentisini LinkedIn ve Indeed&apos;deki ilan sayfalarında
        &quot;Wisparkr&apos;e Kaydet&quot; düğmesiyle kullanmak için aşağıdaki kişisel
        anahtarı eklentiye yapıştır. Bu anahtarı kimseyle paylaşma.
      </p>
      <div className="flex items-center gap-2">
        <Input value={token} disabled />
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </Button>
      </div>
      <Button variant="secondary" onClick={handleRegenerate} disabled={loading}>
        <RefreshCw className="h-4 w-4" />
        {loading ? 'Oluşturuluyor...' : 'Anahtarı Yenile'}
      </Button>
    </Card>
  )
}
