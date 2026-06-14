'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
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
        setError(json.error?.message ?? 'Bir hata oluştu.')
        setLoading(false)
        return
      }
      router.push('/applications')
      router.refresh()
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Sil
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Başvuruyu sil">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Bu başvuruyu silmek istediğine emin misin? Bu işlem geri alınamaz.
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              İptal
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              {loading ? <Spinner /> : 'Sil'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
