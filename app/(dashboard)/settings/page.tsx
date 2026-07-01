import { createClient } from '@/lib/supabase/server'
import { SettingsShell } from '@/components/settings/SettingsShell'
import { getEffectivePlan } from '@/lib/plans'
import type { Profile } from '@/lib/types'

export default async function SettingsPage() {
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
    <SettingsShell
      email={profile?.email ?? ''}
      cvFilename={profile?.cv_filename ?? null}
      extensionToken={profile?.extension_token ?? ''}
      userId={data.user!.id}
      notify={{
        notify_status_change: profile?.notify_status_change ?? true,
        notify_interview: profile?.notify_interview ?? true,
        notify_product: profile?.notify_product ?? true,
      }}
      canPolish={canPolish}
      polishHasCv={Boolean(profile?.cv_text)}
    />
  )
}
