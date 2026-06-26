import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { getPlan, getEffectivePlan, isTrialActive, PLANS } from '@/lib/plans'
import { formatDate } from '@/utils/format'
import { format } from '@/lib/i18n'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { CancelButton } from '@/components/billing/CancelButton'
import { PageInfo } from '@/components/ui/PageInfo'
import { getServerDict } from '@/lib/i18n-server'
import type { Profile, Subscription, AiUsage } from '@/lib/types'

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
      )}
      <span className={enabled ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
    </div>
  )
}

function UsageBar({ label, used, limit, unlimitedLabel }: { label: string; used: number; limit: number | null; unlimitedLabel: string }) {
  const pct = limit ? Math.min(Math.round((used / limit) * 100), 100) : 0
  const color = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{limit === null ? `${used} / ${unlimitedLabel}` : `${used} / ${limit}`}</span>
      </div>
      {limit !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

export default async function BillingPage() {
  const t = getServerDict()
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const userId = data.user!.id

  const [{ data: profileData }, { data: subscriptionData }, { data: usageData }, { data: appsData }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('ai_usage').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('applications').select('id').eq('user_id', userId),
    ])

  const profile = profileData as Profile | null
  const sub = subscriptionData as Subscription | null
  const usage = usageData as AiUsage | null
  const appCount = (appsData ?? []).length

  const realPlan = getPlan(profile?.plan)
  // Usage limits / feature access follow the *effective* plan (trial = full access).
  const plan = getEffectivePlan(profile)
  const isPaid = realPlan.id === 'pro' || realPlan.id === 'career_coach'
  const onTrial = !isPaid && isTrialActive(profile)
  const isCancelled = sub?.status === 'cancelled' || sub?.status === 'expired'

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400_000))
    : 0

  const FEATURE_KEYS: (keyof typeof plan.features & keyof typeof t.billing.features)[] = [
    'kanban',
    'cvFitScore',
    'cvAutoTailoring',
    'mockInterview',
    'companyInsights',
    'salaryNegotiationCoach',
    'unlimitedAi',
  ]

  // Plan seçimi: Pro mu Career Coach mı — kullanıcı karar versin (tek "Pro" butonu yerine).
  const planChooser = (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['pro', 'career_coach'] as const).map((pid) => {
        const p = PLANS[pid]
        const popular = pid === 'pro'
        return (
          <div
            key={pid}
            className={`relative rounded-xl border p-4 ${popular ? 'border-purple-400 bg-purple-50/50' : 'border-slate-200'}`}
          >
            {popular && (
              <span className="absolute right-3 top-3 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                {t.pricing.popular}
              </span>
            )}
            <p className="text-sm font-semibold text-slate-900">{p.name}</p>
            <p className="mb-3 text-2xl font-bold text-slate-900">
              ${p.priceMonthly}
              <span className="text-xs font-normal text-slate-400">{t.billing.perMonth}</span>
            </p>
            <UpgradeButton planId={pid} label={t.billing.upgradeNow} />
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.billing.title}</h1>
          <p className="text-sm text-slate-500">{t.billing.subtitle}</p>
        </div>
        <PageInfo page="billing" />
      </div>

      {/* Aktif plan / deneme durumu */}
      <Card className="space-y-3">
        {isPaid ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">{t.billing.currentPlan}</p>
                <p className="text-2xl font-bold text-purple-600">{realPlan.name}</p>
                <p className="text-sm text-slate-500">${realPlan.priceMonthly}{t.billing.perMonth}</p>
                {profile?.plan_started_at && (
                  <p className="mt-1 text-xs text-slate-400">{format(t.billing.planStarted, { date: formatDate(profile.plan_started_at) })}</p>
                )}
              </div>
              <div className="text-right text-xs text-slate-400">
                {isCancelled && sub?.ends_at ? (
                  <p className="font-medium text-amber-600">{format(t.billing.cancelScheduled, { date: formatDate(sub.ends_at) })}</p>
                ) : sub?.renews_at ? (
                  <>
                    <p>{t.billing.renewal}</p>
                    <p className="font-medium text-slate-600">{format(t.billing.renewsOn, { date: formatDate(sub.renews_at) })}</p>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              {realPlan.id !== 'career_coach' && (
                <UpgradeButton planId="career_coach" label={t.billing.upgrade} />
              )}
              {!isCancelled && <CancelButton />}
            </div>
          </>
        ) : onTrial ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  <Clock className="h-3 w-3" />{t.billing.trialBadge}
                </span>
                <p className="mt-1.5 text-2xl font-bold text-purple-600">{t.billing.trialTitle}</p>
                <p className="text-sm text-slate-500">{t.billing.trialActiveDesc}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {format(t.billing.trialEndsOn, { date: formatDate(profile!.trial_ends_at!) })} · {format(t.billing.trialDaysLeft, { days: trialDaysLeft })}
                </p>
              </div>
            </div>
            {planChooser}
          </>
        ) : (
          <>
            <div>
              <p className="text-2xl font-bold text-slate-900">{t.billing.trialTitle}</p>
              <p className="mt-1 text-sm text-slate-500">{t.billing.trialExpired}</p>
            </div>
            {planChooser}
          </>
        )}
      </Card>

      {/* Kullanım durumu */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">{t.billing.usageThisMonth}</h2>
        <UsageBar
          label={t.billing.usageApplications}
          used={appCount}
          limit={plan.limits.maxApplications}
          unlimitedLabel={t.billing.unlimited}
        />
        <UsageBar
          label={t.billing.usageAiQuestions}
          used={usage?.ai_questions_used ?? 0}
          limit={plan.limits.aiQuestionsPerMonth}
          unlimitedLabel={t.billing.unlimited}
        />
        <UsageBar
          label={t.billing.usageCvTailor}
          used={usage?.cv_tailors_used ?? 0}
          limit={plan.id === 'free' ? 0 : plan.id === 'pro' ? 10 : null}
          unlimitedLabel={t.billing.unlimited}
        />
        <UsageBar
          label={t.billing.usageMockInterview}
          used={usage?.mock_interviews_used ?? 0}
          limit={plan.id === 'free' ? 0 : plan.id === 'pro' ? 5 : null}
          unlimitedLabel={t.billing.unlimited}
        />
      </Card>

      {/* Plan özellikleri */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{t.billing.planFeatures}</h2>
        <div className="space-y-2">
          {FEATURE_KEYS.map((key) => (
            <FeatureRow key={key} label={t.billing.features[key]} enabled={plan.features[key]} />
          ))}
        </div>
      </Card>
    </div>
  )
}
