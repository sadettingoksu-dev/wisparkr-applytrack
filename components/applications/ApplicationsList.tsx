'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Trash2, X, List, Kanban } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import { format } from '@/lib/i18n'
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
  selectAll: string
  selected: string
  bulkStatus: string
  bulkDelete: string
  bulkDeleteConfirm: string
  clearSelection: string
  viewList: string
  viewBoard: string
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  // Görünüm URL'de tutulur (?view=board) — böylece yer imlenebilir/paylaşılabilir
  // ve eski /board linkleri buraya yönlenebilir.
  const view: 'list' | 'board' = searchParams.get('view') === 'board' ? 'board' : 'list'

  function setView(next: 'list' | 'board') {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'board') params.set('view', 'board')
    else params.delete('view')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setSelected(new Set())
  }

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

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Tümünü seç: yalnızca o an görünen sayfa öğelerini kapsar.
  const allPageSelected = pageItems.length > 0 && pageItems.every((a) => selected.has(a.id))
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pageItems.forEach((a) => next.delete(a.id))
      else pageItems.forEach((a) => next.add(a.id))
      return next
    })
  }

  async function bulkStatus(newStatus: ApplicationStatus) {
    if (selected.size === 0) return
    setBusy(true)
    await Promise.all(
      [...selected].map((id) =>
        fetch(`/api/applications/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }),
      ),
    )
    setSelected(new Set())
    setBusy(false)
    router.refresh()
  }

  async function bulkDelete() {
    if (selected.size === 0) return
    if (!window.confirm(format(labels.bulkDeleteConfirm, { count: selected.size }))) return
    setBusy(true)
    await Promise.all(
      [...selected].map((id) => fetch(`/api/applications/${id}`, { method: 'DELETE' })),
    )
    setSelected(new Set())
    setBusy(false)
    router.refresh()
  }

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

        {/* Liste ⇄ Pano. Araç çubuğu ortak olduğu için arama/filtre/sıralama
            artık Pano'da da çalışır (ayrı /board sayfasında yoktu). */}
        <div className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-white p-0.5">
          {([
            { id: 'list', label: labels.viewList, icon: List },
            { id: 'board', label: labels.viewBoard, icon: Kanban },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className={
                'inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ' +
                (view === id
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">{labels.noResults}</p>
        </Card>
      ) : view === 'board' ? (
        /* key: KanbanBoard filtrelenmiş listeyi yalnızca BAŞLANGIÇ state'i olarak
           alır (kendi optimistik state'ini tutar). Filtre değişince yeniden
           kurulmazsa pano eski listeyi gösterirdi. */
        <KanbanBoard key={`${query}|${status}|${sort}`} initialApplications={filtered} />
      ) : (
        <>
          {/* tümünü seç */}
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={allPageSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-purple-600"
            />
            {labels.selectAll}
          </label>

          {/* Toplu işlem çubuğu.
              top-16: mobilde sayfa kayar ve üst şerit (sticky, ~4rem) bu çubuğu
              örterdi. Masaüstünde <main> kendi kaydırma bağlamı olduğundan
              şeridin altına girmez → lg:top-2. */}
          {selected.size > 0 && (
            <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 lg:top-2">
              <span className="text-sm font-medium text-purple-800">
                {format(labels.selected, { count: selected.size })}
              </span>
              <select
                defaultValue=""
                disabled={busy}
                onChange={(e) => {
                  if (e.target.value) bulkStatus(e.target.value as ApplicationStatus)
                  e.target.value = ''
                }}
                className={selectCls}
              >
                <option value="" disabled>
                  {labels.bulkStatus}
                </option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
              <button
                onClick={bulkDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {labels.bulkDelete}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
                {labels.clearSelection}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {pageItems.map((app) => (
              <Card
                key={app.id}
                className={`flex items-center gap-3 transition-shadow hover:shadow-lg ${
                  selected.has(app.id) ? 'ring-2 ring-purple-300' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(app.id)}
                  onChange={() => toggle(app.id)}
                  aria-label={app.position_title}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-purple-600"
                />
                <Link
                  href={`/applications/${app.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3"
                >
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
                </Link>
              </Card>
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
