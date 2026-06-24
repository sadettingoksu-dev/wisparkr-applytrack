'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, FileSignature, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { TemplatePicker, type CvTemplate } from '@/components/cv/TemplatePicker'
import { MIN_APPLY_SCORE } from '@/utils/constants'
import { useI18n } from '@/components/i18n/I18nProvider'

export interface DocumentItem {
  id: string
  company_name: string
  position_title: string
  cvScore: number | null
  hasCv: boolean
  hasCoverLetter: boolean
}

export function DocumentsList({ items }: { items: DocumentItem[] }) {
  const { t } = useI18n()
  const [template, setTemplate] = useState<CvTemplate>('classic')

  return (
    <div className="space-y-4">
      <TemplatePicker value={template} onChange={setTemplate} />

      <div className="space-y-3">
        {items.map((it) => {
          const cvReady = it.hasCv && (it.cvScore ?? 0) >= MIN_APPLY_SCORE
          return (
            <Card
              key={it.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/applications/${it.id}`}
                  className="text-sm font-medium text-slate-900 transition-colors hover:text-purple-600"
                >
                  {it.position_title}
                </Link>
                <p className="truncate text-xs text-slate-500">{it.company_name}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {it.hasCv &&
                  (cvReady ? (
                    <a
                      href={`/api/applications/${it.id}/cv-pdf?type=cv&template=${template}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 transition-colors hover:bg-slate-100"
                    >
                      <FileText className="h-3.5 w-3.5" /> {t.documents.cvPdf}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400">
                      <Lock className="h-3.5 w-3.5" /> {t.documents.lowScore}
                    </span>
                  ))}
                {it.hasCoverLetter && (
                  <a
                    href={`/api/applications/${it.id}/cv-pdf?type=cover_letter&template=${template}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 transition-colors hover:bg-slate-100"
                  >
                    <FileSignature className="h-3.5 w-3.5" /> {t.documents.coverLetterPdf}
                  </a>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
