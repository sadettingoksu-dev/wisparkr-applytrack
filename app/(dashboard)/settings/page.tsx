import { createClient } from '@/lib/supabase/server'
import { SettingsGroup, SettingsRow } from '@/components/settings/SettingsList'
import { CvUploadCard } from '@/components/settings/CvUploadCard'
import { CvPolishCard } from '@/components/settings/CvPolishCard'
import { ForwardingEmailCard } from '@/components/settings/ForwardingEmailCard'
import { ExtensionTokenCard } from '@/components/settings/ExtensionTokenCard'
import { NotificationPrefsCard } from '@/components/settings/NotificationPrefsCard'
import { ReferralCard } from '@/components/settings/ReferralCard'
import { DangerZoneCard } from '@/components/settings/DangerZoneCard'
import { LockedFeatureCard } from '@/components/billing/LockedFeatureCard'
import { PageInfo } from '@/components/ui/PageInfo'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import { getEffectivePlan, requiredPlanForFeature, PLANS } from '@/lib/plans'
import type { Profile } from '@/lib/types'

export default async function SettingsPage() {
  const t = getServerDict()
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single()
  const profile = profileData as Profile | null
  const canPolish = getEffectivePlan(profile).features.cvPolish

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.settings.title}</h1>
          <p className="text-sm text-slate-500">{t.settings.subtitle}</p>
        </div>
        <PageInfo page="settings" />
      </div>

      {/* Hesap */}
      <SettingsGroup title={t.settings.groupAccount}>
        <SettingsRow label={t.settings.email}>
          <span className="truncate text-sm text-slate-500">{profile?.email ?? ''}</span>
        </SettingsRow>
        <CvUploadCard initialFilename={profile?.cv_filename ?? null} />
      </SettingsGroup>

      {/* CV İyileştirme (araç) */}
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.cvPolish.title}</h2>
        {canPolish ? (
          <CvPolishCard hasCv={Boolean(profile?.cv_text)} />
        ) : (
          <LockedFeatureCard
            title={t.billing.features.cvPolish}
            description={format(t.billing.lockCardDesc, { plan: PLANS[requiredPlanForFeature('cvPolish')].name })}
            planId="pro"
            ctaLabel={t.billing.lockCta}
          />
        )}
      </section>

      {/* Bağlantılar & Entegrasyon */}
      <SettingsGroup title={t.settings.groupConnections}>
        <ExtensionTokenCard initialToken={profile?.extension_token ?? ''} />
        <ForwardingEmailCard userId={data.user!.id} />
        <ReferralCard />
      </SettingsGroup>

      {/* Bildirimler */}
      <SettingsGroup title={t.settings.notify.title}>
        <NotificationPrefsCard
          initial={{
            notify_status_change: profile?.notify_status_change ?? true,
            notify_interview: profile?.notify_interview ?? true,
            notify_product: profile?.notify_product ?? true,
          }}
        />
      </SettingsGroup>

      {/* Tehlikeli bölge */}
      <SettingsGroup title={t.settings.danger.title} tone="danger">
        <DangerZoneCard />
      </SettingsGroup>
    </div>
  )
}
