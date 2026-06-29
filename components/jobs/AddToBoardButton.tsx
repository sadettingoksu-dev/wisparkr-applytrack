'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type JobPayload = {
  company_name: string
  position_title: string
  job_url: string
  job_description: string
}

interface Labels {
  addCta: string
  adding: string
  added: string
  addError: string
  limitError: string
}

/**
 * Feed'deki bir ilanı kullanıcının başvuru paneline ekler.
 * Yalnızca kendi kimlik-doğrulamalı `/api/applications` endpoint'imize POST atar;
 * sunucu zod ile doğrular, plan limitini uygular ve user_id'yi oturumdan alır.
 */
export function AddToBoardButton({ job, labels }: { job: JobPayload; labels: Labels }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error' | 'limit'>('idle')

  async function add() {
    setState('loading')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      })
      if (res.ok) return setState('done')
      if (res.status === 403) return setState('limit')
      setState('error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
        <Check className="h-4 w-4" />
        {labels.added}
      </span>
    )
  }

  const label =
    state === 'loading' ? labels.adding
    : state === 'limit' ? labels.limitError
    : state === 'error' ? labels.addError
    : labels.addCta

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={add}
      disabled={state === 'loading' || state === 'limit'}
    >
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  )
}
