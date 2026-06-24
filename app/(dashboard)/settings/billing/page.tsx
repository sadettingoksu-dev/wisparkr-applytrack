import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { getPlan, PLANS, PLAN_ORDER } from '@/lib/plans'
import { formatDate } from '@/utils/format'
import { CheckCircle2, XCircle } from 'lucide-react'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { getServerDict } from '@/lib/i18n-server'
import type { Profile, Subscription, AiUsage } from '@/lib/types'

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-white/30" />
      )}
      <span className={enabled ? 'text-white/90' : 'text-white/40'}>{label}</span>
    </div>
  )
}

function UsageBar({ label, used, limit, unlimitedLabel }: { label: string; used: number; limit: number | null; unlimitedLabel: string }) {
  const pct = limit ? Math.min(Math.round((used / limit) * 100), 100) : 0
  const color = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/50">
        <span>{label}</span>
        <span>{limit === null ? `${used} / ${unlimitedLabel}` : `${used} / ${limit}`}</span>
      </div>
      {limit !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
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
  const plan = getPlan(profile?.plan)

  const FEATURE_KEYS: (keyof typeof plan.features & keyof typeof t.billing.features)[] = [
    'kanban',
    'cvFitScore',
    'cvAutoTailoring',
    'mockInterview',
    'companyInsights',
    'salaryNegotiationCoach',
    'unlimitedAi',
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.billing.title}</h1>
        <p className="text-sm text-white/50">{t.billing.subtitle}</p>
      </div>

      {/* Aktif plan */}
      <Card className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/50">{t.billing.currentPlan}</p>
            <p className="text-2xl font-bold text-amber-500">{plan.name}</p>
            <p className="text-sm text-white/50">${plan.priceMonthly}{t.billing.perMonth}</p>
          </div>
          {sub?.renews_at && (
            <div className="text-right text-xs text-white/40">
              <p>{t.billing.renewal}</p>
              <p className="font-medium text-white/70">{formatDate(sub.renews_at)}</p>
            </div>
          )}
        </div>

        {plan.id !== 'career_coach' && (
          <UpgradeButton planId={plan.id === 'free' ? 'pro' : 'career_coach'} label={t.billing.upgrade} />
        )}
      </Card>

      {/* Kullanım durumu */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-white">{t.billing.usageThisMonth}</h2>
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
        <h2 className="text-sm font-semibold text-white">{t.billing.planFeatures}</h2>
        <div className="space-y-2">
          {FEATURE_KEYS.map((key) => (
            <FeatureRow key={key} label={t.billing.features[key]} enabled={plan.features[key]} />
          ))}
        </div>
      </Card>

      {/* Diğer planlar karşılaştırma */}
      {plan.id !== 'career_coach' && (
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-white">{t.billing.comparePlans}</h2>
          <div className="grid grid-cols-3 gap-3">
            {PLAN_ORDER.map((pid) => {
              const p = PLANS[pid]
              const isCurrent = pid === plan.id
              return (
                <div
                  key={pid}
                  className={`rounded-lg border p-3 text-center ${isCurrent ? 'border-amber-400 bg-amber-500/10' : 'border-white/10'}`}
                >
                  <p className={`text-sm font-semibold ${isCurrent ? 'text-amber-600' : 'text-white/90'}`}>{p.name}</p>
                  <p className="text-lg font-bold text-white">${p.priceMonthly}<span className="text-xs font-normal text-white/40">{t.billing.perMonth}</span></p>
                  {isCurrent ? (
                    <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">{t.billing.current}</span>
                  ) : pid !== 'free' ? (
                    <a href="/pricing" className="mt-1 inline-block text-xs text-amber-500 hover:underline">{t.billing.upgradeArrow}</a>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
