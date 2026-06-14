import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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
        <h1 className="text-2xl font-bold text-slate-800">Ayarlar</h1>
        <p className="text-sm text-slate-500">Hesap bilgilerin</p>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">E-posta</label>
          <Input value={profile?.email ?? ''} disabled />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">CV Dosyası</label>
          <Input value={profile?.cv_filename ?? 'Henüz CV yüklenmedi'} disabled />
          <input type="file" accept="application/pdf" className="text-sm text-slate-500" />
        </div>

        <Button>Kaydet</Button>
      </Card>
    </div>
  )
}
