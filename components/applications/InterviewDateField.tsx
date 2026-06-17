'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

function toInputValue(date: string | null): string {
  if (!date) return ''
  // datetime-local input bekler: YYYY-MM-DDTHH:mm
  return new Date(date).toISOString().slice(0, 16)
}

export function InterviewDateField({
  applicationId,
  initialDate,
}: {
  applicationId: string
  initialDate: string | null
}) {
  const router = useRouter()
  const [value, setValue] = useState(toInputValue(initialDate))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_date: value ? new Date(value).toISOString() : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      router.refresh()
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-white/40" />
      <label htmlFor="interview_date" className="text-sm text-white/70">
        Mülakat Tarihi
      </label>
      <input
        id="interview_date"
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-white/10 px-2 py-1 text-sm text-white/90 focus:border-amber-400 focus:outline-none"
      />
      <Button variant="secondary" onClick={handleSave} disabled={loading}>
        {loading ? <Spinner /> : 'Kaydet'}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
