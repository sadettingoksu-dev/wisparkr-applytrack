export type PlanId = 'free' | 'pro' | 'career_coach'

export interface PlanConfig {
  id: PlanId
  name: string
  priceMonthly: number
  lemonSqueezyVariantId: string | null
  limits: {
    /** null = unlimited */
    maxApplications: number | null
    /** null = unlimited */
    aiQuestionsPerMonth: number | null
  }
  features: {
    kanban: boolean
    cvFitScore: boolean
    cvAutoTailoring: boolean
    coverLetter: boolean
    cvPolish: boolean
    skillsGap: boolean
    permanentShareLinks: boolean
    shareAnalytics: boolean
    companyInsights: boolean
    salaryNegotiationCoach: boolean
    competitorAnalysis: boolean
    unlimitedAi: boolean
    mockInterview: boolean
  }
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Deneme',
    priceMonthly: 0,
    lemonSqueezyVariantId: null,
    limits: { maxApplications: 5, aiQuestionsPerMonth: 10 },
    features: {
      kanban: true,
      cvFitScore: false,
      cvAutoTailoring: false,
      coverLetter: false,
      cvPolish: false,
      skillsGap: true,
      permanentShareLinks: false,
      shareAnalytics: false,
      companyInsights: false,
      salaryNegotiationCoach: false,
      competitorAnalysis: false,
      unlimitedAi: false,
      mockInterview: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9,
    lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_PRO || null,
    limits: { maxApplications: null, aiQuestionsPerMonth: 200 },
    features: {
      kanban: true,
      cvFitScore: true,
      cvAutoTailoring: true,
      coverLetter: true,
      cvPolish: true,
      skillsGap: true,
      permanentShareLinks: true,
      shareAnalytics: true,
      companyInsights: false,
      salaryNegotiationCoach: false,
      competitorAnalysis: false,
      unlimitedAi: false,
      mockInterview: true,
    },
  },
  career_coach: {
    id: 'career_coach',
    name: 'Career Coach',
    priceMonthly: 29,
    lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_CAREER_COACH || null,
    limits: { maxApplications: null, aiQuestionsPerMonth: null },
    features: {
      kanban: true,
      cvFitScore: true,
      cvAutoTailoring: true,
      coverLetter: true,
      cvPolish: true,
      skillsGap: true,
      permanentShareLinks: true,
      shareAnalytics: true,
      companyInsights: true,
      salaryNegotiationCoach: true,
      competitorAnalysis: true,
      unlimitedAi: true,
      mockInterview: true,
    },
  },
}

export function getPlan(planId: string | null | undefined): PlanConfig {
  return PLANS[planId as PlanId] ?? PLANS.free
}

/** Plan tier granted during the free trial (full standard access). */
export const TRIAL_PLAN: PlanId = 'pro'

export interface TrialableProfile {
  plan?: string | null
  trial_ends_at?: string | null
}

/** True while the 5-day signup trial window is still open. */
export function isTrialActive(profile: TrialableProfile | null | undefined): boolean {
  if (!profile?.trial_ends_at) return false
  return new Date(profile.trial_ends_at).getTime() > Date.now()
}

/**
 * The plan actually in effect for a user: a real paid plan wins; otherwise an
 * active trial grants TRIAL_PLAN-level access; an expired trial falls back to free.
 */
export function getEffectivePlanId(profile: TrialableProfile | null | undefined): PlanId {
  const plan = (profile?.plan as PlanId) ?? 'free'
  if (plan === 'pro' || plan === 'career_coach') return plan
  if (isTrialActive(profile)) return TRIAL_PLAN
  return 'free'
}

/** PlanConfig resolved through trial logic. */
export function getEffectivePlan(profile: TrialableProfile | null | undefined): PlanConfig {
  return PLANS[getEffectivePlanId(profile)]
}

/** Maps a Lemon Squeezy variant ID back to a plan, used by the billing webhook. */
export function getPlanByVariantId(variantId: string | number): PlanConfig | null {
  const id = String(variantId)
  return Object.values(PLANS).find((p) => p.lemonSqueezyVariantId === id) ?? null
}

/** Ordered list for rendering pricing cards (Free -> Pro -> Career Coach). */
export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'career_coach']
