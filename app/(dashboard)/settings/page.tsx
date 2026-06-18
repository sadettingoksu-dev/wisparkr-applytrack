import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CvUploadCard } from '@/components/settings/CvUploadCard'
import { CvPolishCard } from '@/components/settings/CvPolishCard'
import { ForwardingEmailCard } from '@/components/settings/ForwardingEmailCard'
import { ExtensionTokenCard } from '@/components/settings/ExtensionTokenCard'
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
        <p className="text-sm text-white/50">Hesap bilgilerin</p>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/90">E-posta</label>
          <Input value={profile?.email ?? ''} disabled />
        </div>

        <CvUploadCard initialFilename={profile?.cv_filename ?? null} />
      </Card>

      <CvPolishCard hasCv={Boolean(profile?.cv_text)} />

      <ForwardingEmailCard userId={data.user!.id} />

      <ExtensionTokenCard initialToken={profile?.extension_token ?? ''} />
    </div>
  )
}
