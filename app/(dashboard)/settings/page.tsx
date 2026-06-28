import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CvUploadCard } from '@/components/settings/CvUploadCard'
import { CvPolishCard } from '@/components/settings/CvPolishCard'
import { ForwardingEmailCard } from '@/components/settings/ForwardingEmailCard'
import { ExtensionTokenCard } from '@/components/settings/ExtensionTokenCard'
import { NotificationPrefsCard } from '@/components/settings/NotificationPrefsCard'
import { DangerZoneCard } from '@/components/settings/DangerZoneCard'
import { PageInfo } from '@/components/ui/PageInfo'
import { getServerDict } from '@/lib/i18n-server'
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.settings.title}</h1>
          <p className="text-sm text-slate-500">{t.settings.subtitle}</p>
        </div>
        <PageInfo page="settings" />
      </div>

      <Card className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">{t.settings.email}</label>
          <Input value={profile?.email ?? ''} disabled />
        </div>

        <CvUploadCard initialFilename={profile?.cv_filename ?? null} />
      </Card>

      <CvPolishCard hasCv={Boolean(profile?.cv_text)} />

      <ForwardingEmailCard userId={data.user!.id} />

      <ExtensionTokenCard initialToken={profile?.extension_token ?? ''} />

      <NotificationPrefsCard
        initial={{
          notify_status_change: profile?.notify_status_change ?? true,
          notify_interview: profile?.notify_interview ?? true,
          notify_product: profile?.notify_product ?? true,
        }}
      />

      <DangerZoneCard />
    </div>
  )
}
