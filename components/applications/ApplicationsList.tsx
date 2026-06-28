'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Download, Trash2, X, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'
import { STATUS_BADGE_CLASSES, KANBAN_COLUMNS } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import type { Application, ApplicationStatus } from '@/lib/types'

type SortKey = 'newest' | 'oldest' | 'company' | 'score'

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-purple-400'

export function ApplicationsList({ apps }: { apps: Application[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const q = query.trim().toLocaleLowerCase('tr')

  const visible = useMemo(() => {
    let list = apps
    if (q) {
      list = list.filter(
        (a) =>
          a.company_name.toLocaleLowerCase('tr').includes(q) ||
          a.position_title.toLocaleLowerCase('tr').includes(q),
      )
    }
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter)
    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.created_at.localeCompare(b.created_at)
        case 'company':
          return a.company_name.localeCompare(b.company_name, 'tr')
        case 'score':
          return (b.fit_score ?? -1) - (a.fit_score ?? -1)
        default:
          return b.created_at.localeCompare(a.created_at)
      }
    })
    return sorted
  }, [apps, q, statusFilter, sort])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === visible.length ? new Set() : new Set(visible.map((a) => a.id)),
    )
  }

  async function bulkStatus(status: ApplicationStatus) {
    if (selected.size === 0) return
    setBusy(true)
    await Promise.all(
      [...selected].map((id) =>
        fetch(`/api/applications/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }),
      ),
    )
    setSelected(new Set())
    setBusy(false)
    router.refresh()
  }

  async function bulkDelete() {
    if (selected.size === 0) return
    if (!window.confirm(format(t.applications.bulkDeleteConfirm, { count: selected.size }))) return
    setBusy(true)
    await Promise.all(
      [...selected].map((id) => fetch(`/api/applications/${id}`, { method: 'DELETE' })),
    )
    setSelected(new Set())
    setBusy(false)
    router.refresh()
  }

  function exportCsv() {
    const header = ['Company', 'Position', 'Status', 'FitScore', 'AppliedAt']
    const rows = visible.map((a) => [
      a.company_name,
      a.position_title,
      a.status,
      a.fit_score ?? '',
      a.applied_at ?? '',
    ])
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wisparkr-basvurular-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const allSelected = visible.length > 0 && selected.size === visible.length

  return (
    <div className="space-y-4">
      {/* Araç çubuğu: arama + filtre + sıralama + CSV */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.applications.search}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-purple-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
          className={selectClass}
        >
          <option value="all">{t.applications.filterAll}</option>
          {KANBAN_COLUMNS.map((s) => (
            <option key={s.id} value={s.id}>
              {t.status[s.id]}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClass}>
          <option value="newest">{t.applications.sortNewest}</option>
          <option value="oldest">{t.applications.sortOldest}</option>
          <option value="company">{t.applications.sortCompany}</option>
          <option value="score">{t.applications.sortScore}</option>
        </select>
        <button
          onClick={exportCsv}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          {t.applications.exportCsv}
        </button>
      </div>

      {/* Sonuç sayısı + tümünü seç */}
      {visible.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-purple-600" />
            {t.applications.selectAll}
          </label>
          <span>{format(t.applications.resultCount, { count: visible.length })}</span>
        </div>
      )}

      {/* Toplu işlem çubuğu */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5">
          <span className="text-sm font-medium text-purple-800">
            {format(t.applications.selected, { count: selected.size })}
          </span>
          <select
            defaultValue=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) bulkStatus(e.target.value as ApplicationStatus)
              e.target.value = ''
            }}
            className={selectClass}
          >
            <option value="" disabled>
              {t.applications.bulkStatus}
            </option>
            {KANBAN_COLUMNS.map((s) => (
              <option key={s.id} value={s.id}>
                {t.status[s.id]}
              </option>
            ))}
          </select>
          <button
            onClick={bulkDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t.applications.bulkDelete}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
            {t.applications.clearSelection}
          </button>
        </div>
      )}

      {/* Liste */}
      {visible.length === 0 ? (
        <EmptyState icon={FileText} title={t.applications.noResults} description={t.applications.search} />
      ) : (
        <div className="space-y-3">
          {visible.map((app) => {
            const checked = selected.has(app.id)
            return (
              <Card
                key={app.id}
                className={`flex items-center gap-3 transition-shadow hover:shadow-lg ${
                  checked ? 'ring-2 ring-purple-300' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(app.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-purple-600"
                  aria-label={app.position_title}
                />
                <Link href={`/applications/${app.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{app.position_title}</p>
                    <p className="truncate text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {app.applied_at && (
                      <span className="hidden text-xs text-slate-400 sm:inline">{formatDate(app.applied_at)}</span>
                    )}
                    <Badge className={STATUS_BADGE_CLASSES[app.status]}>{t.status[app.status]}</Badge>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
