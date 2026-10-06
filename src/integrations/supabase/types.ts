export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_value: string | null
          previous_value: string | null
          target_user_id: string | null
        }
        ComputedFields: never
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: string | null
          previous_value?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: string | null
          previous_value?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          address: string | null
          agency_type: string | null
          areas: string[] | null
          cep: string | null
          city: string | null
          created_at: string
          created_by: string
          description: string | null
          email: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          is_whatsapp: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          rating: number | null
          state: string | null
          status: Database["public"]["Enums"]["agency_status"] | null
          total_reviews: number | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        ComputedFields: never
        Insert: {
          address?: string | null
          agency_type?: string | null
          areas?: string[] | null
          cep?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          is_whatsapp?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["agency_status"] | null
          total_reviews?: number | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          agency_type?: string | null
          areas?: string[] | null
          cep?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          is_whatsapp?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["agency_status"] | null
          total_reviews?: number | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agencies_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_comments: {
        Row: {
          agency_id: string
          content: string
          created_at: string
          dislikes_count: number | null
          id: string
          is_reported: boolean | null
          likes_count: number | null
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          agency_id: string
          content: string
          created_at?: string
          dislikes_count?: number | null
          id?: string
          is_reported?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          content?: string
          created_at?: string
          dislikes_count?: number | null
          id?: string
          is_reported?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_comments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "agency_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_reports: {
        Row: {
          agency_id: string
          created_at: string
          description: string
          id: string
          reason: string
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        ComputedFields: never
        Insert: {
          agency_id: string
          created_at?: string
          description: string
          id?: string
          reason: string
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string
          description?: string
          id?: string
          reason?: string
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_reports_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_reviews: {
        Row: {
          agency_id: string
          comment: string
          created_at: string
          id: string
          is_moderated: boolean | null
          justification: string
          moderated_at: string | null
          moderated_by: string | null
          rating: number
          status: string | null
          title: string | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          agency_id: string
          comment: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          justification: string
          moderated_at?: string | null
          moderated_by?: string | null
          rating: number
          status?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          comment?: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          justification?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rating?: number
          status?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_reviews_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_screenshots: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          screenshot_url: string
        }
        ComputedFields: never
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          screenshot_url: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          screenshot_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_screenshots_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "curriculum_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "agency_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        ComputedFields: never
        Insert: {
          comment_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "agency_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_code: string
          id: string
          redeemed_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          coupon_code: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_code_fkey"
            columns: ["coupon_code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          credits: number
          expires_at: string | null
          max_uses: number | null
          used_count: number
        }
        ComputedFields: never
        Insert: {
          code: string
          created_at?: string
          credits?: number
          expires_at?: string | null
          max_uses?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          expires_at?: string | null
          max_uses?: number | null
          used_count?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          stripe_payment_intent_id: string | null
          type: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      curriculum_analysis: {
        Row: {
          analysis_data: Json | null
          course: string | null
          created_at: string
          credits_used: number | null
          email: string
          file_url: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["analysis_status"] | null
          university: string | null
          used_fallback: boolean | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          analysis_data?: Json | null
          course?: string | null
          created_at?: string
          credits_used?: number | null
          email: string
          file_url?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["analysis_status"] | null
          university?: string | null
          used_fallback?: boolean | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          course?: string | null
          created_at?: string
          credits_used?: number | null
          email?: string
          file_url?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["analysis_status"] | null
          university?: string | null
          used_fallback?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          from_email: string
          id: string
          provider: string | null
          provider_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_name: string | null
          to_email: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string | null
          error_message?: string | null
          from_email: string
          id?: string
          provider?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_name?: string | null
          to_email: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          from_email?: string
          id?: string
          provider?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_name?: string | null
          to_email?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          comment: string | null
          created_at: string
          email: string
          id: number
          rating: number
          source: string | null
          status: string
        }
        ComputedFields: never
        Insert: {
          comment?: string | null
          created_at?: string
          email: string
          id?: number
          rating: number
          source?: string | null
          status?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          email?: string
          id?: number
          rating?: number
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      generated_resumes: {
        Row: {
          content: string
          created_at: string
          id: string
          profile_data: NonNullable<Json>
          title: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          content: string
          created_at?: string
          id?: string
          profile_data: NonNullable<Json>
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          profile_data?: NonNullable<Json>
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_simulations: {
        Row: {
          agency_id: string | null
          company_name: string | null
          created_at: string
          feedback: Json | null
          id: string
          interviewer_type: string
          job_description: string | null
          job_title: string
          messages: NonNullable<Json>
          status: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          agency_id?: string | null
          company_name?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          interviewer_type: string
          job_description?: string | null
          job_title: string
          messages?: NonNullable<Json>
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          company_name?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          interviewer_type?: string
          job_description?: string | null
          job_title?: string
          messages?: NonNullable<Json>
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_simulations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_applications: {
        Row: {
          applied_date: string
          company: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          description: string
          feedbacks: NonNullable<Json>
          id: string
          image_url: string | null
          location: string
          next_action: string | null
          next_action_date: string | null
          notes: string
          position: string
          progress: number
          salary: string | null
          status: string
          status_history: NonNullable<Json>
          tags: string[]
          updated_at: string
          user_id: string
          website: string | null
        }
        ComputedFields: never
        Insert: {
          applied_date?: string
          company: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          feedbacks?: NonNullable<Json>
          id?: string
          image_url?: string | null
          location?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string
          position: string
          progress?: number
          salary?: string | null
          status: string
          status_history?: NonNullable<Json>
          tags?: string[]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          applied_date?: string
          company?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          feedbacks?: NonNullable<Json>
          id?: string
          image_url?: string | null
          location?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string
          position?: string
          progress?: number
          salary?: string | null
          status?: string
          status_history?: NonNullable<Json>
          tags?: string[]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      kanban_reminders: {
        Row: {
          application_id: string
          completed: boolean
          created_at: string
          date: string
          description: string
          id: string
          title: string
          type: string
        }
        ComputedFields: never
        Insert: {
          application_id: string
          completed?: boolean
          created_at?: string
          date: string
          description?: string
          id?: string
          title: string
          type: string
        }
        Update: {
          application_id?: string
          completed?: boolean
          created_at?: string
          date?: string
          description?: string
          id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_reminders_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "kanban_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          referrer_id: string
          status: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        ComputedFields: never
        Insert: {
          id?: number
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      rover_abuse_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rover_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          name: string | null
          role: string
          tool_call_id: string | null
          tool_calls: Json | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role: string
          tool_call_id?: string | null
          tool_calls?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role?: string
          tool_call_id?: string | null
          tool_calls?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city_state: string | null
          course: string | null
          created_at: string
          credits: number
          education: Json | null
          email: string
          encrypted_gemini_key: string | null
          encrypted_openai_key: string | null
          experiences: Json | null
          full_name: string | null
          gemini_key_iv: string | null
          gemini_key_tag: string | null
          github_url: string | null
          id: string
          is_currently_interning: boolean | null
          languages: string[] | null
          linkedin_url: string | null
          location_enabled: boolean | null
          openai_key_iv: string | null
          openai_key_tag: string | null
          period: string | null
          phone: string | null
          portfolio_url: string | null
          privacy_settings: Json | null
          raw_import_data: Json | null
          referral_code: string
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          skills: string[] | null
          subscription_status: string | null
          subscription_tier: string | null
          total_credits_purchased: number
          total_credits_used: number
          university: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city_state?: string | null
          course?: string | null
          created_at?: string
          credits?: number
          education?: Json | null
          email: string
          encrypted_gemini_key?: string | null
          encrypted_openai_key?: string | null
          experiences?: Json | null
          full_name?: string | null
          gemini_key_iv?: string | null
          gemini_key_tag?: string | null
          github_url?: string | null
          id: string
          is_currently_interning?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          location_enabled?: boolean | null
          openai_key_iv?: string | null
          openai_key_tag?: string | null
          period?: string | null
          phone?: string | null
          portfolio_url?: string | null
          privacy_settings?: Json | null
          raw_import_data?: Json | null
          referral_code: string
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          skills?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_credits_purchased?: number
          total_credits_used?: number
          university?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city_state?: string | null
          course?: string | null
          created_at?: string
          credits?: number
          education?: Json | null
          email?: string
          encrypted_gemini_key?: string | null
          encrypted_openai_key?: string | null
          experiences?: Json | null
          full_name?: string | null
          gemini_key_iv?: string | null
          gemini_key_tag?: string | null
          github_url?: string | null
          id?: string
          is_currently_interning?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          location_enabled?: boolean | null
          openai_key_iv?: string | null
          openai_key_tag?: string | null
          period?: string | null
          phone?: string | null
          portfolio_url?: string | null
          privacy_settings?: Json | null
          raw_import_data?: Json | null
          referral_code?: string
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          skills?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_credits_purchased?: number
          total_credits_used?: number
          university?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reminders: {
        Row: {
          candidatura_id: string | null
          created_at: string
          description: string
          id: string
          reminder_at: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          candidatura_id?: string | null
          created_at?: string
          description?: string
          id?: string
          reminder_at: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          candidatura_id?: string | null
          created_at?: string
          description?: string
          id?: string
          reminder_at?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reminders_candidatura_id_fkey"
            columns: ["candidatura_id"]
            isOneToOne: false
            referencedRelation: "kanban_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        ComputedFields: never
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          task_key: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          amount: number
          description: string
          stripe_payment_intent_id?: string
          user_uuid: string
        }
        Returns: undefined
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      check_and_trigger_referral_signup_bonus: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      consume_credits: {
        Args: { amount: number; description: string; user_uuid: string }
        Returns: boolean
      }
      get_active_credits: { Args: { user_uuid: string }; Returns: number }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_admin_or_moderator: { Args: { user_uuid: string }; Returns: boolean }
      reward_referrer_bonus: {
        Args: {
          invited_uuid: string
          referrer_uuid: string
          reward_amount: number
          reward_description: string
        }
        Returns: undefined
      }
    }
    Enums: {
      agency_status: "pending" | "approved" | "rejected"
      analysis_status: "pending" | "processing" | "completed" | "failed"
      app_permission:
        | "agencies.view"
        | "agencies.create"
        | "agencies.update"
        | "agencies.delete"
        | "agencies.verify"
        | "agencies.review"
        | "resumes.view"
        | "resumes.analyze"
        | "resumes.delete"
        | "resumes.review"
        | "users.view"
        | "users.create"
        | "users.update"
        | "users.delete"
        | "users.manage_roles"
        | "content.view"
        | "content.create"
        | "content.update"
        | "content.delete"
        | "content.moderate"
        | "reports.view"
        | "reports.create"
        | "reports.resolve"
      app_role: "student" | "agency" | "admin" | "moderator"
      user_role: "student" | "agency" | "admin" | "moderator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agency_status: ["pending", "approved", "rejected"],
      analysis_status: ["pending", "processing", "completed", "failed"],
      app_permission: [
        "agencies.view",
        "agencies.create",
        "agencies.update",
        "agencies.delete",
        "agencies.verify",
        "agencies.review",
        "resumes.view",
        "resumes.analyze",
        "resumes.delete",
        "resumes.review",
        "users.view",
        "users.create",
        "users.update",
        "users.delete",
        "users.manage_roles",
        "content.view",
        "content.create",
        "content.update",
        "content.delete",
        "content.moderate",
        "reports.view",
        "reports.create",
        "reports.resolve",
      ],
      app_role: ["student", "agency", "admin", "moderator"],
      user_role: ["student", "agency", "admin", "moderator"],
    },
  },
} as const
