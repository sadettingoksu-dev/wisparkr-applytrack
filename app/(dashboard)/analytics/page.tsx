import { createClient } from '@/lib/supabase/server'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import type { Application } from '@/lib/types'

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const apps = (applications ?? []) as Application[]
  return <AnalyticsDashboard apps={apps} />
}
