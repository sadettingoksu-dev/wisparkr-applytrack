import { createClient } from '@/lib/supabase/server'
import { CvBuilder } from '@/components/cv-builder/CvBuilder'
import { PageInfo } from '@/components/ui/PageInfo'
import { parseCvData, emptyCvData } from '@/lib/cv'
import type { Profile } from '@/lib/types'

export default async function CvBuilderPage() {
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
      <div className="flex justify-end">
        <PageInfo page="cvBuilder" />
      </div>
      <CvBuilder initial={initial} plan={profile?.plan ?? 'free'} />
    </div>
  )
}
