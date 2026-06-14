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
          notes: string | null
          applied_at: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
