export type PlanId = 'free' | 'pro' | 'career_coach'

export interface PlanConfig {
  id: PlanId
  name: string
  /** Aylık fiyat (para birimi `currency` alanında). */
  priceMonthly: number
  /** Yıllık fiyat — 2 ay bedava (~%17 indirim). */
  priceYearly: number
  /** ISO para birimi kodu; TR pazarı için 'TRY'. */
  currency: 'TRY' | 'USD'
  lemonSqueezyVariantId: string | null
  /** Yıllık faturalama için Lemon Squeezy variant ID'si. */
  lemonSqueezyVariantIdYearly: string | null
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
    /** AI Kariyer Asistanı (başvuruya özel sohbet) — Career Coach'a özel. */
    aiAssistant: boolean
    companyInsights: boolean
    salaryNegotiationCoach: boolean
    competitorAnalysis: boolean
    unlimitedAi: boolean
    mockInterview: boolean
    /** CV'ye göre eşleşen benzer iş ilanları sayfası — Pro ve üzeri. */
    similarJobs: boolean
  }
}

/** A single feature flag key — used by the sidebar/page guards to gate UI. */
export type FeatureKey = keyof PlanConfig['features']

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Ücretsiz',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'TRY',
    lemonSqueezyVariantId: null,
    lemonSqueezyVariantIdYearly: null,
    // Kalıcı ücretsiz tier: deneme bittikten sonra düşülen kısıtlı seviye.
    limits: { maxApplications: 10, aiQuestionsPerMonth: 15 },
    features: {
      kanban: true,
      cvFitScore: true, // tadımlık: aylık AI kotasıyla sınırlı
      cvAutoTailoring: false,
      coverLetter: false,
      cvPolish: false,
      skillsGap: true,
      permanentShareLinks: false,
      shareAnalytics: false,
      aiAssistant: false,
      companyInsights: false,
      salaryNegotiationCoach: false,
      competitorAnalysis: false,
      unlimitedAi: false,
      mockInterview: false,
      similarJobs: false,
    },
  },
  // Tek ücretli plan. Eski "Career Coach" tier'ının tüm özellikleri buraya taşındı.
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 299,
    priceYearly: 2990, // yıllıkta 2 ay bedava
    currency: 'TRY',
    lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_PRO || null,
    lemonSqueezyVariantIdYearly: process.env.LEMONSQUEEZY_VARIANT_PRO_YEARLY || null,
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
      aiAssistant: true,
      companyInsights: true,
      salaryNegotiationCoach: true,
      competitorAnalysis: true,
      unlimitedAi: true,
      mockInterview: true,
      similarJobs: true,
    },
  },
  // Geriye dönük uyumluluk: plan='career_coach' olan eski DB kayıtları bozulmasın diye
  // tutuluyor; Pro ile birebir aynı erişimi verir. Pricing/UI'da GÖSTERİLMEZ.
  career_coach: {
    id: 'career_coach',
    name: 'Pro',
    priceMonthly: 299,
    priceYearly: 2990,
    currency: 'TRY',
    lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_CAREER_COACH || null,
    lemonSqueezyVariantIdYearly: process.env.LEMONSQUEEZY_VARIANT_CAREER_COACH_YEARLY || null,
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
      aiAssistant: true,
      companyInsights: true,
      salaryNegotiationCoach: true,
      competitorAnalysis: true,
      unlimitedAi: true,
      mockInterview: true,
      similarJobs: true,
    },
  },
}

/**
 * The lowest plan that unlocks a given feature, used to label "upgrade" CTAs
 * and to gate sidebar links. Returns the first plan in tier order that has it.
 */
export function requiredPlanForFeature(feature: FeatureKey): PlanId {
  for (const id of PLAN_ORDER) {
    if (PLANS[id].features[feature]) return id
  }
  return 'pro'
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

/** Ordered list for rendering pricing cards. Tek ücretli plan: Free -> Pro. */
export const PLAN_ORDER: PlanId[] = ['free', 'pro']

/** Kart/UI'da gösterilecek para birimi sembolü. */
export function currencySymbol(currency: PlanConfig['currency']): string {
  return currency === 'TRY' ? '₺' : '$'
}

/** Yıllık planın aya bölünmüş efektif fiyatı (yuvarlanmış). */
export function effectiveMonthlyFromYearly(plan: PlanConfig): number {
  return Math.round(plan.priceYearly / 12)
}
