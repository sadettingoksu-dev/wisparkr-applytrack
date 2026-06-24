'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'
import { getInterviewReadiness } from '@/utils/constants'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { MockInterviewFeedback } from '@/lib/types'

interface InterviewFeedbackReportProps {
  feedback: MockInterviewFeedback
  overallScore: number
}

export function InterviewFeedbackReport({ feedback, overallScore }: InterviewFeedbackReportProps) {
  const { t } = useI18n()
  const readiness = getInterviewReadiness(overallScore)

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t.interview.reportTitle}</h3>
        <span className="text-2xl font-bold text-amber-500">%{overallScore}</span>
      </div>

      <p className={`text-sm font-medium ${readiness.className}`}>{t.readiness[readiness.levelKey]}</p>

      <p className="text-sm text-white/70">{feedback.summary}</p>

      <div className="space-y-2">
        {feedback.category_scores.map((cat, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-medium">{cat.category}</span>
              <span>%{cat.score}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-amber-500"
                style={{ width: `${cat.score}%` }}
              />
            </div>
            <p className="text-xs text-white/50">{cat.comment}</p>
          </div>
        ))}
      </div>

      {feedback.strengths.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/50">{t.interview.strengths}</p>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/70">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/50">{t.interview.improvements}</p>
          <ul className="space-y-2">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/70">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
