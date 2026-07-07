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
const USAGE_COLUMNS = {
  ai_question: 'ai_questions_used',
  fit_score: 'fit_scores_used',
  cv_tailor: 'cv_tailors_used',
  mock_interview: 'mock_interviews_used',
  cover_letter: 'cover_letters_used',
  cv_polish: 'cv_polish_used',
} as const

/** Sum every AI action column → the user's total AI spend for the period. */
function totalUsed(row: Record<string, unknown> | null | undefined): number {
  if (!row) return 0
  return Object.values(USAGE_COLUMNS).reduce(
    (sum, col) => sum + (Number((row as Record<string, unknown>)[col]) || 0),
    0
  )
}

export async function checkAndIncrementUsage(
  admin: AdminClient,
  userId: string,
  planId: string | null | undefined,
  type: 'ai_question' | 'fit_score' | 'cv_tailor' | 'mock_interview' | 'cover_letter' | 'cv_polish'
): Promise<UsageCheckResult> {
  const plan = getPlan(planId)
  // Single shared monthly AI budget: every AI action (chat, fit score, tailor,
  // cover letter, polish, mock interview) draws from the same pool.
  const limit = plan.limits.aiQuestionsPerMonth
  const period = currentPeriodMonth()
  const column = USAGE_COLUMNS[type]

  const { data: existing } = await admin
    .from('ai_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('period_month', period)
    .maybeSingle()

  const used = totalUsed(existing as Record<string, unknown> | null)
  const columnUsed = existing ? Number((existing as any)[column]) || 0 : 0

  if (limit !== null && used >= limit) {
    return { allowed: false, used, limit }
  }

  if (existing) {
    await admin
      .from('ai_usage')
      .update({ [column]: columnUsed + 1 } as any)
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

export interface LifetimeCreditResult {
  allowed: boolean
  /** Kalan kredi (harcamadan sonra). */
  remaining: number
}

/**
 * Ücretsiz planın ömür boyu CV AI-uyarlama kredisini ({@link profiles.free_cv_credits})
 * atomik olarak tüketir. Aylık `ai_usage` havuzundan bağımsızdır — bu tek seferlik/ömür
 * boyu bir sayaçtır. Kredi > 0 ise 1 düşürür ve `allowed:true` döner; 0 ise dokunmaz.
 *
 * Yarış koşulunu önlemek için `free_cv_credits > 0` koşullu bir UPDATE ... RETURNING
 * yapar: iki eşzamanlı istek asla aynı krediyi iki kez harcayamaz.
 */
export async function consumeFreeCvCredit(
  admin: AdminClient,
  userId: string
): Promise<LifetimeCreditResult> {
  const { data: current } = await admin
    .from('profiles')
    .select('free_cv_credits')
    .eq('id', userId)
    .maybeSingle()

  const have = current ? Number((current as { free_cv_credits: number }).free_cv_credits) || 0 : 0
  if (have <= 0) return { allowed: false, remaining: 0 }

  // Koşullu update: yalnızca kredi hâlâ > 0 ise düşür (eşzamanlı çift-harcamayı engeller).
  const { data: updated } = await admin
    .from('profiles')
    .update({ free_cv_credits: have - 1 } as never)
    .eq('id', userId)
    .gt('free_cv_credits', 0)
    .select('free_cv_credits')
    .maybeSingle()

  if (!updated) return { allowed: false, remaining: 0 }
  return { allowed: true, remaining: Number((updated as { free_cv_credits: number }).free_cv_credits) || 0 }
}

/**
 * Harcanan ücretsiz CV kredisini geri verir (ör. AI çağrısı başarısız olursa —
 * kullanıcının tek hakkı bir hatadan dolayı yanmasın). En fazla +1 ekler.
 */
export async function refundFreeCvCredit(admin: AdminClient, userId: string): Promise<void> {
  const { data: current } = await admin
    .from('profiles')
    .select('free_cv_credits')
    .eq('id', userId)
    .maybeSingle()
  const have = current ? Number((current as { free_cv_credits: number }).free_cv_credits) || 0 : 0
  await admin
    .from('profiles')
    .update({ free_cv_credits: have + 1 } as never)
    .eq('id', userId)
}
