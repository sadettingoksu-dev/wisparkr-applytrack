'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { CvTemplate } from '@/lib/cvTemplates'

/**
 * CV önizlemesi = indirilecek olan GERÇEK PDF'in A4 oranında gömülü hâli.
 * Böylece "önizleme" ile "indirilen PDF" bire bir aynıdır (tek render motoru:
 * lib/cvDocument.tsx). Kaydedilmiş cv_data okunur; builder ileri giderken
 * otomatik kaydettiği için önizleme daima günceldir. `reloadKey` değişince
 * (ör. kayıt sonrası) iframe yeniden yüklenir.
 */
export function PdfPreview({
  template,
  reloadKey = 0,
}: {
  template: CvTemplate
  reloadKey?: number
}) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  // Her yeniden yüklemede cache'i kır + iframe'i sıfırla.
  const [nonce, setNonce] = useState(0)
  const firstRender = useRef(true)

  // template ya da reloadKey değişince yeniden yükle.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setLoading(true)
    setNonce((n) => n + 1)
  }, [template, reloadKey])

  const src = `/api/cv/pdf?template=${encodeURIComponent(template)}&inline=1&k=${reloadKey}-${nonce}#toolbar=0&navpanes=0&view=FitH`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{t.cvBuilder.wizard.previewTitle}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            setNonce((n) => n + 1)
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t.common.refresh}
        </button>
      </div>

      {/* A4 oranı (210 × 297 → 1 / 1.4142). */}
      <div
        className="relative w-full overflow-hidden rounded-xl bg-neutral-200 shadow-xl ring-1 ring-slate-300"
        style={{ aspectRatio: '1 / 1.4142' }}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-100">
            <Spinner />
          </div>
        )}
        <iframe
          key={`${template}-${reloadKey}-${nonce}`}
          src={src}
          title={t.cvBuilder.wizard.previewTitle}
          className="absolute inset-0 h-full w-full border-0"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  )
}
