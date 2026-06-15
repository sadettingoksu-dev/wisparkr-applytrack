// Placeholder Supabase database types.
// Once the Supabase project exists, regenerate with:
//   npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
// and replace this file. Kept loose (Record<string, any>) so the app
// compiles before the real project/schema is wired up.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          cv_text: string | null
          cv_filename: string | null
          plan: 'free' | 'pro' | 'career_coach'
          extension_token: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string
          email: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          user_id: string
          company_name: string
          position_title: string
          job_url: string | null
          job_description: string | null
          status: 'pending' | 'interview' | 'offer' | 'rejected'
          fit_score: number | null
          fit_suggestions: Json | null
          tailored_cv_text: string | null
          tailored_fit_score: number | null
          required_documents: Json | null
          notes: string | null
          applied_at: string | null
          interview_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['applications']['Row']> & {
          user_id: string
          company_name: string
          position_title: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Row']>
        Relationships: []
      }
      ai_messages: {
        Row: {
          id: string
          user_id: string
          application_id: string | null
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['ai_messages']['Row']> & {
          user_id: string
          role: 'user' | 'assistant'
          content: string
        }
        Update: Partial<Database['public']['Tables']['ai_messages']['Row']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          ls_subscription_id: string | null
          ls_customer_id: string | null
          ls_order_id: string | null
          plan: 'free' | 'pro' | 'career_coach'
          status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'on_trial'
          renews_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']> & {
          user_id: string
          plan: 'free' | 'pro' | 'career_coach'
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Relationships: []
      }
      ai_usage: {
        Row: {
          id: string
          user_id: string
          period_month: string
          ai_questions_used: number
          fit_scores_used: number
          cv_tailors_used: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['ai_usage']['Row']> & {
          user_id: string
          period_month: string
        }
        Update: Partial<Database['public']['Tables']['ai_usage']['Row']>
        Relationships: []
      }
      inbound_emails: {
        Row: {
          id: string
          user_id: string
          application_id: string | null
          from_address: string
          subject: string | null
          body: string | null
          classification: 'interview_invitation' | 'rejection' | 'info_request' | 'other'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['inbound_emails']['Row']> & {
          user_id: string
          from_address: string
          classification: 'interview_invitation' | 'rejection' | 'info_request' | 'other'
        }
        Update: Partial<Database['public']['Tables']['inbound_emails']['Row']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          application_id: string | null
          title: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & {
          user_id: string
          title: string
          message: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
