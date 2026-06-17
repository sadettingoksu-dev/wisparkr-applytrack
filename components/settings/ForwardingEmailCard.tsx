'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ForwardingEmailCard({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false)
  const address = `user_${userId}@inbox.wisparkr.com`

  async function handleCopy() {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="space-y-2">
      <h2 className="text-sm font-semibold text-white">Mail Yönlendirme Adresi</h2>
      <p className="text-sm text-white/50">
        Şirketlerden gelen mailleri Gmail/Outlook&apos;ta bu adrese yönlendirecek bir filtre
        kurabilirsin. ApplyTrack, gelen mailleri otomatik sınıflandırıp başvuru durumunu günceller.
      </p>
      <div className="flex items-center gap-2">
        <Input value={address} disabled />
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </Button>
      </div>

      <div className="rounded-lg bg-white/5 p-3 text-sm text-white/70">
        <p className="font-medium text-white/90">Nasıl kurulur? (Gmail örneği)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Gmail&apos;de <strong>Ayarlar (⚙️) → Tüm ayarları gör → İleti Yönlendirme ve POP/IMAP</strong> sekmesine git.</li>
          <li><strong>&quot;Yönlendirme adresi ekle&quot;</strong> ile yukarıdaki adresi ekle ve doğrula.</li>
          <li><strong>Filtreler</strong> sekmesinden, şirket/başvuru mailleri için bir filtre oluştur ve
            &quot;Şu adrese ilet&quot; seçeneğinde bu adresi seç.</li>
        </ol>
      </div>
    </Card>
  )
}
