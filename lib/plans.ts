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
    name: 'Free',
    priceMonthly: 0,
    lemonSqueezyVariantId: null,
    limits: { maxApplications: 5, aiQuestionsPerMonth: 10 },
    features: {
      kanban: true,
      cvFitScore: false,
      cvAutoTailoring: false,
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

/** Maps a Lemon Squeezy variant ID back to a plan, used by the billing webhook. */
export function getPlanByVariantId(variantId: string | number): PlanConfig | null {
  const id = String(variantId)
  return Object.values(PLANS).find((p) => p.lemonSqueezyVariantId === id) ?? null
}

/** Ordered list for rendering pricing cards (Free -> Pro -> Career Coach). */
export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'career_coach']
