import { createClient } from '@/lib/supabase/server'
import { CvBuilder } from '@/components/cv-builder/CvBuilder'
import { PageHeader } from '@/components/ui/PageHeader'
import { getServerDict } from '@/lib/i18n-server'
import { parseCvData, emptyCvData } from '@/lib/cv'
import { getEffectivePlanId } from '@/lib/plans'
import type { Profile } from '@/lib/types'

export default async function CvBuilderPage() {
  const t = getServerDict()
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single()
  const profile = profileData as Profile | null

  const initial = profile?.cv_data
    ? parseCvData(profile.cv_data)
    : emptyCvData({ fullName: profile?.full_name ?? undefined, email: profile?.email })

  return (
    <div className="space-y-6">
      <PageHeader title={t.cvBuilder.title} subtitle={t.cvBuilder.subtitle} infoPage="cvBuilder" />
      <CvBuilder initial={initial} plan={getEffectivePlanId(profile)} />
    </div>
  )
}
