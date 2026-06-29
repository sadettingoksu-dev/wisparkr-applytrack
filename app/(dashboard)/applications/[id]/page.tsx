import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { FitScoreCard } from '@/components/cv/FitScoreCard'
import { CvTailorCard } from '@/components/cv/CvTailorCard'
import { CoverLetterCard } from '@/components/cv/CoverLetterCard'
import { SkillsGapCard } from '@/components/cv/SkillsGapCard'
import { RequiredDocumentsCard } from '@/components/cv/RequiredDocumentsCard'
import { LockedFeatureCard } from '@/components/billing/LockedFeatureCard'
import { DeleteApplicationButton } from '@/components/applications/DeleteApplicationButton'
import { InterviewDateField } from '@/components/applications/InterviewDateField'
import { NotesCard } from '@/components/applications/NotesCard'
import { StatusSelector } from '@/components/applications/StatusSelector'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import { getEffectivePlan, requiredPlanForFeature, PLANS, type FeatureKey } from '@/lib/plans'
import type { Application, RequiredDocument, Profile } from '@/lib/types'

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const t = getServerDict()
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const [{ data: application }, { data: profileData }] = await Promise.all([
    supabase.from('applications').select('*').eq('id', params.id).single(),
    supabase.from('profiles').select('plan, trial_ends_at').eq('id', userData.user!.id).single(),
  ])

  if (!application) notFound()

  const app = application as Application

  // Efektif plana göre özellik kilidi: kapsam dışı AI kartları yerinde kilitli görünür.
  const planFeatures = getEffectivePlan(profileData as Profile | null).features
  const lockedTitle = (feature: FeatureKey, title: string) => {
    const reqPlan = requiredPlanForFeature(feature)
    return (
      <LockedFeatureCard
        title={title}
        description={format(t.billing.lockCardDesc, { plan: PLANS[reqPlan].name })}
        planId={reqPlan as 'pro' | 'career_coach'}
        ctaLabel={t.billing.lockCta}
      />
    )
  }

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

      {planFeatures.cvAutoTailoring ? (
        <RequiredDocumentsCard
          applicationId={app.id}
          initialDocuments={app.required_documents as RequiredDocument[] | null}
        />
      ) : (
        lockedTitle('cvAutoTailoring', t.requiredDocs.title)
      )}

      {planFeatures.cvFitScore ? (
        <FitScoreCard
          applicationId={app.id}
          initialScore={app.fit_score}
          initialSuggestions={(app.fit_suggestions as string[] | null) ?? null}
        />
      ) : (
        lockedTitle('cvFitScore', t.fitScore.title)
      )}

      {planFeatures.skillsGap ? (
        <SkillsGapCard
          applicationId={app.id}
          initialData={
            app.skills_gap as { matched: string[]; missing: string[]; summary: string } | null
          }
        />
      ) : (
        lockedTitle('skillsGap', t.skillsGap.title)
      )}

      {planFeatures.cvAutoTailoring ? (
        <CvTailorCard
          applicationId={app.id}
          initialScore={app.tailored_fit_score}
          hasTailoredCv={Boolean(app.tailored_cv_text)}
        />
      ) : (
        lockedTitle('cvAutoTailoring', t.cvTailor.title)
      )}

      {planFeatures.coverLetter ? (
        <CoverLetterCard applicationId={app.id} initialText={app.cover_letter_text} />
      ) : (
        lockedTitle('coverLetter', t.coverLetter.title)
      )}

      <NotesCard applicationId={app.id} initialNotes={app.notes} />
    </div>
  )
}
