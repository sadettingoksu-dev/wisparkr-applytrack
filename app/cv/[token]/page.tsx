import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCvData, isShareActive } from '@/lib/cv'
import { getEffectivePlanId } from '@/lib/plans'
import { CvPreview } from '@/components/cv-builder/CvPreview'
import { ExpiredCv } from '@/components/cv/ExpiredCv'
import { getServerDict } from '@/lib/i18n-server'

export const dynamic = 'force-dynamic'

interface CvShareRow {
  id: string
  user_id: string
  cv_snapshot: unknown
  expires_at: string | null
  revoked: boolean
  view_count: number
}

async function loadShare(token: string) {
  const admin = createAdminClient()
  const { data: share } = await admin.from('cv_shares').select('*').eq('token', token).maybeSingle()
  if (!share) return null
  const row = share as unknown as CvShareRow
  const { data: owner } = await admin
    .from('profiles')
    .select('plan, trial_ends_at')
    .eq('id', row.user_id)
    .maybeSingle()
  // Live check against the owner's *effective* plan: an active trial keeps the
  // link alive; once it expires (and no paid plan) the CV vanishes from this URL.
  const ownerPlan = getEffectivePlanId(owner as { plan?: string; trial_ends_at?: string | null } | null)
  return { row, ownerPlan }
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const result = await loadShare(params.token)
  // Olmayan token → gerçek 404 (yumuşak 200-404 yerine doğru durum kodu).
  if (!result) notFound()
  // Süresi dolmuş/iptal edilmiş link → sahibin adı/başlığı meta'ya SIZMASIN.
  if (!isShareActive(result.row, result.ownerPlan)) return { title: 'CV — Wisparkr' }
  const cv = parseCvData(result.row.cv_snapshot)
  const name = cv.personal.fullName || 'CV'
  return {
    title: `${name} — CV`,
    description: cv.personal.headline || getServerDict().publicCv.metaDesc,
  }
}

export default async function PublicCvPage({ params }: { params: { token: string } }) {
  const result = await loadShare(params.token)
  if (!result) notFound()
  const { row, ownerPlan } = result

  if (!isShareActive(row, ownerPlan)) {
    return <ExpiredCv />
  }

  // Count the view (best effort).
  const admin = createAdminClient()
  await admin
    .from('cv_shares')
    .update({ view_count: (row.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() } as never)
    .eq('id', row.id)

  const cvData = parseCvData(row.cv_snapshot)
  const t = getServerDict()

  return (
    <div className="min-h-screen bg-neutral-100 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <CvPreview data={cvData} />
        <div className="mt-4 flex items-center justify-between px-1">
          <a
            href={`/cv/${params.token}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            <Download className="h-4 w-4" />
            {t.publicCv.downloadPdf}
          </a>
          <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-600">
            {t.publicCv.builtWith}
          </Link>
        </div>
      </div>
    </div>
  )
}
