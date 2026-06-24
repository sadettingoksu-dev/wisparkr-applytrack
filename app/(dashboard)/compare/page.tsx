import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import { formatDate } from '@/utils/format'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Application } from '@/lib/types'

export default async function ComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const t = getServerDict()
  const ids = (searchParams.ids ?? '').split(',').filter(Boolean).slice(0, 3)
  if (ids.length < 2) notFound()

  const supabase = createClient()
  const { data } = await supabase.from('applications').select('*').in('id', ids)
  const apps = (data ?? []) as Application[]
  if (apps.length < 2) notFound()

  // Preserve order from URL
  const ordered = ids.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as Application[]

  const rows: { label: string; render: (a: Application) => React.ReactNode }[] = [
    { label: t.compare.rowCompany, render: (a) => <span className="font-medium text-white/90">{a.company_name}</span> },
    { label: t.compare.rowStatus, render: (a) => <Badge className={STATUS_BADGE_CLASSES[a.status]}>{t.status[a.status]}</Badge> },
    {
      label: t.compare.rowFitScore,
      render: (a) =>
        a.fit_score !== null ? (
          <span className={`font-bold ${a.fit_score >= 75 ? 'text-emerald-600' : a.fit_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            %{a.fit_score}
          </span>
        ) : <span className="text-white/40">—</span>,
    },
    {
      label: t.compare.rowTailoredScore,
      render: (a) =>
        a.tailored_fit_score !== null ? (
          <span className={`font-bold ${a.tailored_fit_score >= 75 ? 'text-emerald-600' : 'text-amber-500'}`}>
            %{a.tailored_fit_score}
          </span>
        ) : <span className="text-white/40">—</span>,
    },
    {
      label: t.compare.rowInterviewDate,
      render: (a) => a.interview_date ? <span className="text-amber-500">{formatDate(a.interview_date, 'd MMM yyyy HH:mm')}</span> : <span className="text-white/40">—</span>,
    },
    {
      label: t.compare.rowAppliedDate,
      render: (a) => a.applied_at ? <span className="text-white/70">{formatDate(a.applied_at)}</span> : <span className="text-white/40">—</span>,
    },
    {
      label: t.compare.rowCvReady,
      render: (a) => a.tailored_cv_text
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        : <XCircle className="h-4 w-4 text-white/30" />,
    },
    {
      label: t.compare.rowNote,
      render: (a) => a.notes
        ? <span className="text-xs text-white/70 line-clamp-2">{a.notes}</span>
        : <span className="text-white/40">—</span>,
    },
  ]

  // Best score helper
  const maxFitScore = Math.max(...ordered.map((a) => a.fit_score ?? -1))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.compare.title}</h1>
        <p className="text-sm text-white/50">{format(t.compare.subtitle, { n: ordered.length })}</p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left text-xs font-medium text-white/40 w-32">{t.compare.criterion}</th>
              {ordered.map((a) => (
                <th key={a.id} className="px-3 py-2 text-left">
                  <Link href={`/applications/${a.id}`} className="hover:underline">
                    <p className="font-semibold text-white leading-tight">{a.position_title}</p>
                    <p className="text-xs font-normal text-white/40">{a.company_name}</p>
                  </Link>
                  {a.fit_score === maxFitScore && maxFitScore > -1 && (
                    <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      {t.compare.highestScore}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, render }) => (
              <tr key={label} className="border-b border-white/10 last:border-0">
                <td className="py-3 pr-4 text-xs font-medium text-white/40">{label}</td>
                {ordered.map((a) => (
                  <td key={a.id} className="px-3 py-3">
                    {render(a)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Link href="/applications" className="text-sm text-amber-500 hover:underline">
        {t.compare.backToApps}
      </Link>
    </div>
  )
}
