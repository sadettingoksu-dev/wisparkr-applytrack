import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { UpgradeButton } from '@/components/billing/UpgradeButton'

interface LockedFeatureCardProps {
  /** Feature label, shown as the (dimmed) card title — keeps the layout identical. */
  title: string
  /** Short "unlocks on X plan" line. */
  description: string
  planId: 'pro' | 'career_coach'
  ctaLabel: string
}

/**
 * In-place locked state for a feature card. Rendered where the real feature
 * card would sit, so the page layout/order stays the same — only the controls
 * are replaced by a lock + upgrade CTA.
 */
export function LockedFeatureCard({ title, description, planId, ctaLabel }: LockedFeatureCardProps) {
  return (
    <Card className="flex items-center justify-between gap-4 border-dashed">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-400">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="shrink-0">
        <UpgradeButton planId={planId} label={ctaLabel} />
      </div>
    </Card>
  )
}
