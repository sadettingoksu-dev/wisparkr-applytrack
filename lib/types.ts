import type { Database } from '@/types/database.types'

// Re-exported row types — shared contract between backend (Sadettin) and
// frontend (Taha). Import these instead of reaching into Database directly.

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type AiMessage = Database['public']['Tables']['ai_messages']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type AiUsage = Database['public']['Tables']['ai_usage']['Row']
export type InboundEmail = Database['public']['Tables']['inbound_emails']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type EmailClassification = InboundEmail['classification']
export type MockInterview = Database['public']['Tables']['mock_interviews']['Row']
export type MockInterviewMessage = Database['public']['Tables']['mock_interview_messages']['Row']

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

export type { RequiredDocument, DocumentImportance } from '@/lib/anthropic'
export type { MockInterviewFeedback, MockInterviewTurnResult } from '@/lib/anthropic'
export type {
  CvDiagnosisResult,
  CvDiagnosisItem,
  CvDiagnosisCategory,
  CvDiagnosisSeverity,
  CvDiagnosisKind,
} from '@/lib/anthropic'

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
