import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CvRepairWizard } from '@/components/cv/CvRepairWizard'
import { getServerDict } from '@/lib/i18n-server'
import { getEffectivePlan } from '@/lib/plans'
import type { Application, Profile, CvDiagnosisResult } from '@/lib/types'

export default async function CvRepairPage({ params }: { params: { id: string } }) {
  const t = getServerDict()
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const [{ data: application }, { data: profileData }] = await Promise.all([
    supabase.from('applications').select('*').eq('id', params.id).single(),
    supabase
      .from('profiles')
      .select('plan, trial_ends_at, free_cv_credits, cv_text')
      .eq('id', userData.user!.id)
      .single(),
  ])

  if (!application) notFound()

  const app = application as Application
  const profile = profileData as (Profile & { cv_text?: string | null }) | null

  const planFeatures = getEffectivePlan(profile as Profile | null).features
  const isPro = planFeatures.cvAutoTailoring
  const freeCvCredits = (profile as { free_cv_credits?: number } | null)?.free_cv_credits ?? 0
  const hasCv = Boolean(profile?.cv_text)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="space-y-2">
        <Link
          href={`/applications/${app.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.cvRepair.back}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.cvRepair.title}</h1>
          <p className="text-sm text-slate-500">
            {app.position_title} · {app.company_name}
          </p>
          <p className="mt-1 text-sm text-slate-400">{t.cvRepair.subtitle}</p>
        </div>
      </div>

      {hasCv ? (
        <CvRepairWizard
          applicationId={app.id}
          isPro={isPro}
          freeCredits={freeCvCredits}
          initialDiagnosis={(app.cv_diagnosis as CvDiagnosisResult | null) ?? null}
          initialTailoredScore={app.tailored_fit_score}
          hasTailoredCv={Boolean(app.tailored_cv_text)}
        />
      ) : (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="max-w-sm text-sm text-slate-500">{t.cvRepair.needCv}</p>
          <Link href="/cv-builder">
            <Button>{t.cvRepair.needCvCta}</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
