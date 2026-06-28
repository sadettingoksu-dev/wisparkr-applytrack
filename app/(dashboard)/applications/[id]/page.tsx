import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { FitScoreCard } from '@/components/cv/FitScoreCard'
import { CvTailorCard } from '@/components/cv/CvTailorCard'
import { CoverLetterCard } from '@/components/cv/CoverLetterCard'
import { SkillsGapCard } from '@/components/cv/SkillsGapCard'
import { RequiredDocumentsCard } from '@/components/cv/RequiredDocumentsCard'
import { DeleteApplicationButton } from '@/components/applications/DeleteApplicationButton'
import { InterviewDateField } from '@/components/applications/InterviewDateField'
import { NotesCard } from '@/components/applications/NotesCard'
import { StatusSelector } from '@/components/applications/StatusSelector'
import type { Application, RequiredDocument } from '@/lib/types'

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: application } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!application) notFound()

  const app = application as Application

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">{app.position_title}</h1>
          <p className="text-sm text-slate-500">{app.company_name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StatusSelector applicationId={app.id} initialStatus={app.status} />
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

      <SkillsGapCard
        applicationId={app.id}
        initialData={
          app.skills_gap as { matched: string[]; missing: string[]; summary: string } | null
        }
      />

      <CvTailorCard
        applicationId={app.id}
        initialScore={app.tailored_fit_score}
        hasTailoredCv={Boolean(app.tailored_cv_text)}
      />

      <CoverLetterCard applicationId={app.id} initialText={app.cover_letter_text} />

      <NotesCard applicationId={app.id} initialNotes={app.notes} />
    </div>
  )
}
