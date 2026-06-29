import { ExternalLink, Building2, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AddToBoardButton } from '@/components/jobs/AddToBoardButton'
import type { FeedJob } from '@/lib/jobFeed'

export interface JobCardLabels {
  matchLabel: string
  applyCta: string
  addCta: string
  adding: string
  added: string
  addError: string
  limitError: string
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Feed'den gelen tek bir ilanın kartı. Tüm metin düz metin olarak render edilir (React escape eder). */
export function JobCard({ job, labels }: { job: FeedJob; labels: JobCardLabels }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{job.title}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{job.company}</span>
          </p>
        </div>
        <Badge className="shrink-0 bg-purple-100 text-purple-700">{labels.matchLabel}</Badge>
      </div>

      {job.location && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{job.location}</span>
        </p>
      )}

      {job.description && (
        <p className="text-sm leading-relaxed text-slate-500">{job.description}</p>
      )}

      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.tags.slice(0, 5).map((tag) => (
            <Badge key={tag} className="bg-slate-100 text-slate-600">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
        >
          {labels.applyCta}
          <ExternalLink className="h-3.5 w-3.5" />
          {hostname(job.url) && <span className="text-xs text-slate-400">({hostname(job.url)})</span>}
        </a>
        <AddToBoardButton
          job={{
            company_name: job.company,
            position_title: job.title,
            job_url: job.url,
            job_description: job.description,
          }}
          labels={labels}
        />
      </div>
    </Card>
  )
}
