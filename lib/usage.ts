import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getPlan } from '@/lib/plans'

type AdminClient = SupabaseClient<Database>

function currentPeriodMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export interface UsageCheckResult {
  allowed: boolean
  used: number
  limit: number | null
}

/**
 * Checks whether the user can perform one more AI action this month given
 * their plan's limit, and if so increments the relevant counter.
 * Uses the admin (service-role) client because ai_usage is read-only for users via RLS.
 */
export async function checkAndIncrementUsage(
  admin: AdminClient,
  userId: string,
  planId: string | null | undefined,
  type: 'ai_question' | 'fit_score'
): Promise<UsageCheckResult> {
  const plan = getPlan(planId)
  const limit =
    type === 'ai_question' ? plan.limits.aiQuestionsPerMonth : plan.limits.aiQuestionsPerMonth
  const period = currentPeriodMonth()
  const column = type === 'ai_question' ? 'ai_questions_used' : 'fit_scores_used'

  const { data: existing } = await admin
    .from('ai_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('period_month', period)
    .maybeSingle()

  const used = existing ? (existing as any)[column] ?? 0 : 0

  if (limit !== null && used >= limit) {
    return { allowed: false, used, limit }
  }

  if (existing) {
    await admin
      .from('ai_usage')
      .update({ [column]: used + 1 } as any)
      .eq('id', existing.id)
  } else {
    await admin.from('ai_usage').insert({
      user_id: userId,
      period_month: period,
      [column]: 1,
    } as any)
  }

  return { allowed: true, used: used + 1, limit }
}
