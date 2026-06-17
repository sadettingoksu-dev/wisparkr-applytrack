'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, UploadCloud } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export function CvUploadCard({ initialFilename }: { initialFilename: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filename, setFilename] = useState(initialFilename)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Önce bir PDF dosyası seç.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/cv/upload', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'CV yüklenemedi.')
        return
      }

      setFilename(file.name)
      setSuccess(true)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/90">CV Dosyası</label>
      <Input value={filename ?? 'Henüz CV yüklenmedi'} disabled />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="text-sm text-white/50"
        onChange={() => {
          setError(null)
          setSuccess(false)
        }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && (
        <p className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          CV başarıyla yüklendi.
        </p>
      )}

      <Button onClick={handleUpload} disabled={loading} variant="secondary">
        {loading ? <Spinner /> : <UploadCloud className="h-4 w-4" />}
        {loading ? 'Yükleniyor...' : 'CV Yükle'}
      </Button>
    </div>
  )
}
