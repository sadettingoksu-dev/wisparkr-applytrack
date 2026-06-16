import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FitScoreCard } from '@/components/cv/FitScoreCard'
import { CvTailorCard } from '@/components/cv/CvTailorCard'
import { RequiredDocumentsCard } from '@/components/cv/RequiredDocumentsCard'
import { AIChatPanel } from '@/components/chat/AIChatPanel'
import { MockInterviewCard } from '@/components/interview/MockInterviewCard'
import { DeleteApplicationButton } from '@/components/applications/DeleteApplicationButton'
import { InterviewDateField } from '@/components/applications/InterviewDateField'
import { NotesCard } from '@/components/applications/NotesCard'
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '@/utils/constants'
import type { Application, AiMessage, MockInterview, RequiredDocument } from '@/lib/types'

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

  const { data: mockInterviewSessions } = await supabase
    .from('mock_interviews')
    .select('*')
    .eq('application_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{app.position_title}</h1>
            <p className="text-sm text-slate-500">{app.company_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={STATUS_BADGE_CLASSES[app.status]}>{STATUS_LABELS[app.status]}</Badge>
            <DeleteApplicationButton applicationId={app.id} />
          </div>
        </div>

        <Card>
          <InterviewDateField applicationId={app.id} initialDate={app.interview_date} />
        </Card>

        <RequiredDocumentsCard
          applicationId={app.id}
          initialDocuments={app.required_documents as RequiredDocument[] | null}
        />

        <FitScoreCard
          applicationId={app.id}
          initialScore={app.fit_score}
          initialSuggestions={(app.fit_suggestions as string[] | null) ?? null}
        />

        <CvTailorCard
          applicationId={app.id}
          initialScore={app.tailored_fit_score}
          hasTailoredCv={Boolean(app.tailored_cv_text)}
        />

        <MockInterviewCard
          applicationId={app.id}
          sessions={(mockInterviewSessions ?? []) as MockInterview[]}
        />

        <NotesCard applicationId={app.id} initialNotes={app.notes} />
      </div>

      <div className="lg:col-span-1">
        <div className="h-[600px]">
          <AIChatPanel applicationId={app.id} initialMessages={(messages ?? []) as AiMessage[]} />
        </div>
      </div>
    </div>
  )
}
