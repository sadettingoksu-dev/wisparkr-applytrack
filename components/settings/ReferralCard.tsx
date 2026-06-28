'use client'

import { useEffect, useState } from 'react'
import { Gift, Copy, Check, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/components/i18n/I18nProvider'

export function ReferralCard() {
  const { t } = useI18n()
  const r = t.referral
  const [link, setLink] = useState('')
  const [count, setCount] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.code) {
          setLink(`${window.location.origin}/signup?ref=${json.data.code}`)
          setCount(json.data.count ?? 0)
        }
      })
      .catch(() => {})
  }, [])

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* yoksay */
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-purple-600" />
        <h2 className="text-base font-semibold text-slate-900">{r.title}</h2>
      </div>
      <p className="text-xs text-slate-500">{r.desc}</p>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">{r.yourLink}</label>
        <div className="flex gap-2">
          <input
            value={link}
            readOnly
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none"
          />
          <button
            onClick={copy}
            disabled={!link}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? r.copied : r.copy}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-purple-50 px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-purple-700">
          <Users className="h-4 w-4" />
          {r.invited}
        </span>
        <span className="text-lg font-bold text-purple-700">{count}</span>
      </div>

      <p className="text-center text-xs text-slate-400">{r.reward}</p>
    </Card>
  )
}
