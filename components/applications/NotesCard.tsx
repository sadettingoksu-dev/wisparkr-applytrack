'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { StickyNote, Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

export function NotesCard({ applicationId, initialNotes }: { applicationId: string; initialNotes: string | null }) {
  const { t } = useI18n()
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/applications/${applicationId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      setSaved(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-white">{t.appDetail.notes}</h3>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t.appDetail.notesPlaceholder}
        rows={4}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/40 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving} variant="secondary">
          {saving ? <Spinner /> : saved ? <><Check className="h-3.5 w-3.5" /> {t.common.saved}</> : t.common.save}
        </Button>
      </div>
    </Card>
  )
}
