import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { getPlan, PLANS, PLAN_ORDER } from '@/lib/plans'
import { formatDate } from '@/utils/format'
import { CheckCircle2, XCircle } from 'lucide-react'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
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

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(Math.round((used / limit) * 100), 100) : 0
  const color = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{limit === null ? `${used} / Sınırsız` : `${used} / ${limit}`}</span>
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

  const FEATURE_LABELS: { key: keyof typeof plan.features; label: string }[] = [
    { key: 'kanban', label: 'Kanban Board' },
    { key: 'cvFitScore', label: 'CV Uyum Skoru' },
    { key: 'cvAutoTailoring', label: 'CV Otomatik Optimizasyon' },
    { key: 'mockInterview', label: 'Mock Mülakat Provası' },
    { key: 'companyInsights', label: 'Şirket İçgörüleri' },
    { key: 'salaryNegotiationCoach', label: 'Maaş Müzakere Koçu' },
    { key: 'unlimitedAi', label: 'Sınırsız AI Kullanımı' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Plan & Faturalama</h1>
        <p className="text-sm text-slate-500">Mevcut planın, kullanım durumun ve özellikler</p>
      </div>

      {/* Aktif plan */}
      <Card className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500">Mevcut Plan</p>
            <p className="text-2xl font-bold text-purple-600">{plan.name}</p>
            <p className="text-sm text-slate-500">${plan.priceMonthly}/ay</p>
          </div>
          {sub?.renews_at && (
            <div className="text-right text-xs text-slate-400">
              <p>Yenileme</p>
              <p className="font-medium text-slate-600">{formatDate(sub.renews_at)}</p>
            </div>
          )}
        </div>

        {plan.id !== 'career_coach' && (
          <UpgradeButton planId={plan.id === 'free' ? 'pro' : 'career_coach'} />
        )}
      </Card>

      {/* Kullanım durumu */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Bu Ayki Kullanım</h2>
        <UsageBar
          label="Başvuru"
          used={appCount}
          limit={plan.limits.maxApplications}
        />
        <UsageBar
          label="AI Sorusu"
          used={usage?.ai_questions_used ?? 0}
          limit={plan.limits.aiQuestionsPerMonth}
        />
        <UsageBar
          label="CV Optimizasyonu"
          used={usage?.cv_tailors_used ?? 0}
          limit={plan.id === 'free' ? 0 : plan.id === 'pro' ? 10 : null}
        />
        <UsageBar
          label="Mock Mülakat"
          used={usage?.mock_interviews_used ?? 0}
          limit={plan.id === 'free' ? 0 : plan.id === 'pro' ? 5 : null}
        />
      </Card>

      {/* Plan özellikleri */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Plan Özellikleri</h2>
        <div className="space-y-2">
          {FEATURE_LABELS.map(({ key, label }) => (
            <FeatureRow key={key} label={label} enabled={plan.features[key]} />
          ))}
        </div>
      </Card>

      {/* Diğer planlar karşılaştırma */}
      {plan.id !== 'career_coach' && (
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Planları Karşılaştır</h2>
          <div className="grid grid-cols-3 gap-3">
            {PLAN_ORDER.map((pid) => {
              const p = PLANS[pid]
              const isCurrent = pid === plan.id
              return (
                <div
                  key={pid}
                  className={`rounded-lg border p-3 text-center ${isCurrent ? 'border-purple-300 bg-purple-50' : 'border-slate-100'}`}
                >
                  <p className={`text-sm font-semibold ${isCurrent ? 'text-purple-700' : 'text-slate-700'}`}>{p.name}</p>
                  <p className="text-lg font-bold text-slate-800">${p.priceMonthly}<span className="text-xs font-normal text-slate-400">/ay</span></p>
                  {isCurrent ? (
                    <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-600">Mevcut</span>
                  ) : pid !== 'free' ? (
                    <a href="/pricing" className="mt-1 inline-block text-xs text-purple-600 hover:underline">Yükselt →</a>
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
