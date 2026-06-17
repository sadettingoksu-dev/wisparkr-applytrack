'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { getInterviewReadiness } from '@/utils/constants'
import type { MockInterview } from '@/lib/types'

interface MockInterviewCardProps {
  applicationId: string
  sessions: MockInterview[]
}

export function MockInterviewCard({ applicationId, sessions }: MockInterviewCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mock-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      router.push(`/applications/${applicationId}/mock-interview/${json.data.interview_id}`)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-white">Mock Mülakat Provası</h3>

      <p className="text-sm text-white/50">
        AI, bu pozisyon ve CV&apos;ne göre seninle {' '}
        <strong>6 soruluk</strong> bir mülakat provası yapar; sonunda kategori bazlı bir geri
        bildirim raporu alırsın.
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button onClick={handleStart} disabled={loading} variant="secondary">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Yeni Mülakat Provası Başlat
          </>
        )}
      </Button>

      {sessions.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setSessionsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-xs font-medium text-white/50 hover:text-white/90"
          >
            <span>Geçmiş Oturumlar ({sessions.length})</span>
            {sessionsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {sessionsOpen && (
            <div className="mt-2 space-y-2">
              {(showAll ? sessions : sessions.slice(0, 3)).map((session) => {
                const readiness =
                  session.status === 'completed' && session.overall_score !== null
                    ? getInterviewReadiness(session.overall_score)
                    : null
                return (
                  <Link
                    key={session.id}
                    href={`/applications/${applicationId}/mock-interview/${session.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                  >
                    <span className="text-white/70">
                      {new Date(session.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                    {session.status === 'completed' ? (
                      session.overall_score !== null && readiness ? (
                        <Badge className={`bg-white/5 ${readiness.className}`}>
                          %{session.overall_score} · {readiness.label}
                        </Badge>
                      ) : (
                        <Badge className="bg-white/5 text-white/50">Rapor bekliyor</Badge>
                      )
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-500">Devam ediyor</Badge>
                    )}
                  </Link>
                )
              })}

              {sessions.length > 3 && (
                <button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="w-full pt-1 text-xs text-amber-500 hover:text-amber-700"
                >
                  {showAll ? 'Daha az göster' : `Daha fazla göster (${sessions.length - 3} oturum daha)`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
