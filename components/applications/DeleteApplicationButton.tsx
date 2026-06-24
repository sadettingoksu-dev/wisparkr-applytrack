'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        setLoading(false)
        return
      }
      router.push('/applications')
      router.refresh()
    } catch {
      setError(t.common.connectionError)
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        {t.common.delete}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t.appDetail.deleteTitle}>
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {t.appDetail.deleteConfirm}
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              {loading ? <Spinner /> : t.common.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
