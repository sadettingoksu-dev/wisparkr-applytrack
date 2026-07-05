import { Briefcase, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/EmptyState'
import { JobCard } from '@/components/jobs/JobCard'
import { LockedFeatureCard } from '@/components/billing/LockedFeatureCard'
import { getCvMatchedJobs } from '@/lib/jobFeed'
import { getEffectivePlan, requiredPlanForFeature, PLANS } from '@/lib/plans'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import type { Profile } from '@/lib/types'

export default async function JobsPage() {
  const t = getServerDict()
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('cv_text, plan, trial_ends_at')
    .eq('id', userData.user!.id)
    .single()
  const profile = profileData as Pick<Profile, 'cv_text' | 'plan' | 'trial_ends_at'> | null
  const cvText = profile?.cv_text ?? ''

  // Benzer iş ilanları Pro ve üzeri planlara açık; free kullanıcı upsell kartı görür.
  const hasFeature = getEffectivePlan(profile).features.similarJobs

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.jobs.title}</h1>
        <p className="text-sm text-slate-500">{t.jobs.subtitle}</p>
      </div>

      {hasFeature ? (
        <>
          <JobsContent cvText={cvText} t={t} />
          <p className="text-center text-xs text-slate-400">{t.jobs.source}</p>
        </>
      ) : (
        <LockedFeatureCard
          title={t.jobs.title}
          description={format(t.billing.lockCardDesc, {
            plan: PLANS[requiredPlanForFeature('similarJobs')].name,
          })}
          planId={requiredPlanForFeature('similarJobs') as 'pro' | 'career_coach'}
          ctaLabel={t.billing.lockCta}
        />
      )}
    </div>
  )
}

async function JobsContent({
  cvText,
  t,
}: {
  cvText: string
  t: ReturnType<typeof getServerDict>
}) {
  // CV yoksa eşleştirme yapılamaz → kullanıcıyı CV eklemeye yönlendir.
  if (!cvText.trim()) {
    return (
      <EmptyState
        icon={Briefcase}
        title={t.jobs.noCvTitle}
        description={t.jobs.noCvDesc}
        ctaLabel={t.jobs.noCvCta}
        ctaHref="/cv-builder"
      />
    )
  }

  const { jobs: matched, reachable } = await getCvMatchedJobs(cvText)

  // Hiçbir kaynağa ulaşılamadı (boş listeyi "eşleşme yok"tan ayırır).
  if (!reachable) {
    return (
      <EmptyState icon={AlertCircle} title={t.jobs.errorTitle} description={t.jobs.errorDesc} />
    )
  }

  if (matched.length === 0) {
    return <EmptyState icon={Briefcase} title={t.jobs.empty} description={t.jobs.emptyDesc} />
  }

  const labels = {
    matchLabel: t.jobs.matchLabel,
    applyCta: t.jobs.applyCta,
    addCta: t.jobs.addCta,
    adding: t.jobs.adding,
    added: t.jobs.added,
    addError: t.jobs.addError,
    limitError: t.jobs.limitError,
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {matched.map((job) => (
        <JobCard key={job.id} job={job} labels={labels} />
      ))}
    </div>
  )
}
