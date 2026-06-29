import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { UpgradeButton } from '@/components/billing/UpgradeButton'

interface FeatureLockProps {
  title: string
  description: string
  /** Plan to send the user to when they upgrade. */
  planId: 'pro' | 'career_coach'
  ctaLabel: string
}

/**
 * Full-page locked state shown when a user opens a feature their current plan
 * doesn't include. The page guards render this instead of the real feature.
 */
export function FeatureLock({ title, description, planId, ctaLabel }: FeatureLockProps) {
  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-500">
        <Lock className="h-6 w-6" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <UpgradeButton planId={planId} label={ctaLabel} />
    </Card>
  )
}
