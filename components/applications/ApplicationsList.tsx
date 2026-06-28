'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import type { Application, ApplicationStatus } from '@/lib/types'

const PAGE_SIZE = 10
const STATUSES: ApplicationStatus[] = ['pending', 'interview', 'offer', 'rejected']
type SortKey = 'newest' | 'oldest' | 'company' | 'position'

interface Labels {
  search: string
  filterAll: string
  sortNewest: string
  sortOldest: string
  sortCompany: string
  sortPosition: string
  noResults: string
  showing: string
  prev: string
  next: string
}

export function ApplicationsList({
  apps,
  labels,
  statusLabels,
}: {
  apps: Application[]
  labels: Labels
  statusLabels: Record<ApplicationStatus, string>
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = apps.filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      if (!q) return true
      return (
        a.position_title?.toLowerCase().includes(q) ||
        a.company_name?.toLowerCase().includes(q)
      )
    })
    list.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (a.created_at ?? '').localeCompare(b.created_at ?? '')
        case 'company':
          return (a.company_name ?? '').localeCompare(b.company_name ?? '', 'tr')
        case 'position':
          return (a.position_title ?? '').localeCompare(b.position_title ?? '', 'tr')
        case 'newest':
        default:
          return (b.created_at ?? '').localeCompare(a.created_at ?? '')
      }
    })
    return list
  }, [apps, query, status, sort])

  // Filtre/sıralama değişince ilk sayfaya dön (geçersiz sayfada kalmayı önler).
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const selectCls =
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200'

  return (
    <div className="space-y-4">
      {/* araç çubuğu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder={labels.search}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ApplicationStatus | 'all')
            setPage(0)
          }}
          className={selectCls}
        >
          <option value="all">{labels.filterAll}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
          <option value="newest">{labels.sortNewest}</option>
          <option value="oldest">{labels.sortOldest}</option>
          <option value="company">{labels.sortCompany}</option>
          <option value="position">{labels.sortPosition}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">{labels.noResults}</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {pageItems.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="flex items-center justify-between gap-3 transition-shadow hover:shadow-lg">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{app.position_title}</p>
                    <p className="truncate text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {app.applied_at && (
                      <span className="hidden text-xs text-slate-400 sm:inline">{formatDate(app.applied_at)}</span>
                    )}
                    <Badge className={STATUS_BADGE_CLASSES[app.status]}>{statusLabels[app.status]}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* alt bilgi: sayım + sayfalama */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              {safePage * PAGE_SIZE + 1}–{safePage * PAGE_SIZE + pageItems.length} / {filtered.length}{' '}
              {labels.showing}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {labels.prev}
                </button>
                <span className="text-xs tabular-nums text-slate-500">
                  {safePage + 1} / {pageCount}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={safePage >= pageCount - 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  {labels.next}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
