import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { CoverLetterCard } from '@/components/cv/CoverLetterCard'
import { LockedFeatureCard } from '@/components/billing/LockedFeatureCard'
import { DeleteApplicationButton } from '@/components/applications/DeleteApplicationButton'
import { InterviewDateField } from '@/components/applications/InterviewDateField'
import { NotesCard } from '@/components/applications/NotesCard'
import { StatusSelector } from '@/components/applications/StatusSelector'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import { getEffectivePlan, requiredPlanForFeature, PLANS, type FeatureKey } from '@/lib/plans'
import type { Application, Profile, CvDiagnosisResult } from '@/lib/types'

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const t = getServerDict()
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const [{ data: application }, { data: profileData }] = await Promise.all([
    supabase.from('applications').select('*').eq('id', params.id).single(),
    supabase
      .from('profiles')
      .select('plan, trial_ends_at, free_cv_credits')
      .eq('id', userData.user!.id)
      .single(),
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

  // CV Servisi (araba-tamiri sihirbazı) giriş noktası. Teşhis tüm planlara bedava;
  // optimize CV üretimi sihirbaz içinde krediyi/kotayı harcar. Mevcut skoru göster.
  const diagnosis = (app.cv_diagnosis as CvDiagnosisResult | null) ?? null
  const repairScore = app.tailored_fit_score ?? diagnosis?.overall_score ?? null

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

      {/* CV Servisi — teşhis + onarım + optimize CV tek sihirbazda */}
      <Link href={`/applications/${app.id}/cv-repair`} className="block">
        <Card className="group flex items-center gap-4 border-purple-200 transition hover:border-purple-300 hover:shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Wrench className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-900">{t.cvRepair.title}</h2>
            <p className="text-sm text-slate-500">{t.cvRepair.subtitle}</p>
          </div>
          {repairScore !== null && (
            <span className="shrink-0 text-2xl font-bold text-purple-600">%{repairScore}</span>
          )}
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-purple-500" />
        </Card>
      </Link>

      {planFeatures.coverLetter ? (
        <CoverLetterCard applicationId={app.id} initialText={app.cover_letter_text} />
      ) : (
        lockedTitle('coverLetter', t.coverLetter.title)
      )}

      <NotesCard applicationId={app.id} initialNotes={app.notes} />
    </div>
  )
}
