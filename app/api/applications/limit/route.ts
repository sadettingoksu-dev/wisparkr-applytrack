import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { getPlan } from '@/lib/plans'

export async function GET() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId, profile } = ctx

  const plan = getPlan(profile.plan)
  const max = plan.limits.maxApplications

  if (max === null) {
    return NextResponse.json({ data: { used: 0, max: null, reached: false } })
  }

  const { count } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const used = count ?? 0
  return NextResponse.json({ data: { used, max, reached: used >= max } })
}
