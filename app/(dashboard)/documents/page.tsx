import { createClient } from '@/lib/supabase/server'
import { DocumentsList, type DocumentItem } from '@/components/documents/DocumentsList'
import type { Application } from '@/lib/types'

export default async function DocumentsPage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const userId = data.user!.id

  const { data: appsData } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  const items: DocumentItem[] = ((appsData ?? []) as Application[])
    .filter((a) => a.tailored_cv_text || a.cover_letter_text)
    .map((a) => ({
      id: a.id,
      company_name: a.company_name,
      position_title: a.position_title,
      cvScore: a.tailored_fit_score,
      hasCv: Boolean(a.tailored_cv_text),
      hasCoverLetter: Boolean(a.cover_letter_text),
    }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Belgelerim</h1>
        <p className="text-sm text-white/50">
          Başvurularına özel hazırladığın CV ve ön yazıları seçtiğin şablonla buradan indir.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/40">
          Henüz hazırlanmış belge yok. Bir başvuru aç, CV&apos;ni optimize et veya ön yazı oluştur;
          burada listelenecekler.
        </p>
      ) : (
        <DocumentsList items={items} />
      )}
    </div>
  )
}
