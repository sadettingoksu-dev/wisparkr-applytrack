import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FitScoreCard } from '@/components/cv/FitScoreCard'
import { AIChatPanel } from '@/components/chat/AIChatPanel'
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '@/utils/constants'
import type { Application, AiMessage } from '@/lib/types'

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: application } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!application) notFound()

  const app = application as Application

  const { data: messages } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('application_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{app.position_title}</h1>
            <p className="text-sm text-slate-500">{app.company_name}</p>
          </div>
          <Badge className={STATUS_BADGE_CLASSES[app.status]}>{STATUS_LABELS[app.status]}</Badge>
        </div>

        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">İlan Açıklaması</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">
            {app.job_description || 'Açıklama eklenmemiş.'}
          </p>
        </Card>

        <FitScoreCard
          applicationId={app.id}
          initialScore={app.fit_score}
          initialSuggestions={(app.fit_suggestions as string[] | null) ?? null}
        />
      </div>

      <div className="lg:col-span-1">
        <div className="h-[600px]">
          <AIChatPanel applicationId={app.id} initialMessages={(messages ?? []) as AiMessage[]} />
        </div>
      </div>
    </div>
  )
}
