import type { Database } from '@/types/database.types'

// Re-exported row types — shared contract between backend (Sadettin) and
// frontend (Taha). Import these instead of reaching into Database directly.

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type AiMessage = Database['public']['Tables']['ai_messages']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type AiUsage = Database['public']['Tables']['ai_usage']['Row']

export type ApplicationStatus = Application['status']
export type PlanId = Profile['plan']

export interface ApiError {
  code: string
  message: string
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

export interface JobParseResult {
  company_name: string
  position_title: string
  job_description: string
  source_url: string
}

export interface FitScoreResult {
  score: number
  suggestions: string[]
}

export interface AiChatResult {
  reply: string
  usage: {
    used: number
    limit: number | null
  }
}
