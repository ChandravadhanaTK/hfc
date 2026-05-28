export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievement_attempts: {
        Row: {
          achievement_id: string
          attempted_at: string
          id: string
          result: string
          story: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          attempted_at?: string
          id?: string
          result: string
          story?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          attempted_at?: string
          id?: string
          result?: string
          story?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_attempts_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_comments: {
        Row: {
          attempt_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          attempt_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          attempt_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          standard: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          standard?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          standard?: string | null
          title?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_date: string
          activity_time: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          location: string | null
          title: string
        }
        Insert: {
          activity_date?: string
          activity_time?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          activity_date?: string
          activity_time?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_date: string
          created_at: string
          id: string
          present: boolean
          recorded_by: string | null
          user_id: string
        }
        Insert: {
          class_date?: string
          created_at?: string
          id?: string
          present?: boolean
          recorded_by?: string | null
          user_id: string
        }
        Update: {
          class_date?: string
          created_at?: string
          id?: string
          present?: boolean
          recorded_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          threshold: number | null
          tier: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          threshold?: number | null
          tier?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          threshold?: number | null
          tier?: string
        }
        Relationships: []
      }
      book_log: {
        Row: {
          created_at: string
          end_date: string | null
          finished_at: string | null
          id: string
          one_liner: string | null
          public_url: string | null
          start_date: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          finished_at?: string | null
          id?: string
          one_liner?: string | null
          public_url?: string | null
          start_date?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          finished_at?: string | null
          id?: string
          one_liner?: string | null
          public_url?: string | null
          start_date?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      calorie_log: {
        Row: {
          calories: number
          created_at: string
          eaten_at: string
          id: string
          meal_name: string
          notes: string | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          calories: number
          created_at?: string
          eaten_at?: string
          id?: string
          meal_name: string
          notes?: string | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          calories?: number
          created_at?: string
          eaten_at?: string
          id?: string
          meal_name?: string
          notes?: string | null
          photo_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          proof: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          proof?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          proof?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          metric: string | null
          source: string
          target_unit: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          metric?: string | null
          source?: string
          target_unit?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          metric?: string | null
          source?: string
          target_unit?: string | null
          target_value?: number | null
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_id: string | null
          room: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_id?: string | null
          room?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string | null
          room?: string
          sender_id?: string
        }
        Relationships: []
      }
      class_attendees: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_attendees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          class_date: string
          created_at: string
          group_id: string
          id: string
          notes: string | null
          recorded_by: string
        }
        Insert: {
          class_date?: string
          created_at?: string
          group_id: string
          id?: string
          notes?: string | null
          recorded_by: string
        }
        Update: {
          class_date?: string
          created_at?: string
          group_id?: string
          id?: string
          notes?: string | null
          recorded_by?: string
        }
        Relationships: []
      }
      codex_entries: {
        Row: {
          connection: boolean | null
          created_at: string
          entry_date: string
          gratitude: boolean | null
          hydration: boolean | null
          id: string
          learning: boolean | null
          mindfulness: boolean | null
          movement: boolean | null
          notes: string | null
          nutrition: boolean | null
          sleep: boolean | null
          sleep_score: number | null
          user_id: string
          water_litres: number | null
        }
        Insert: {
          connection?: boolean | null
          created_at?: string
          entry_date?: string
          gratitude?: boolean | null
          hydration?: boolean | null
          id?: string
          learning?: boolean | null
          mindfulness?: boolean | null
          movement?: boolean | null
          notes?: string | null
          nutrition?: boolean | null
          sleep?: boolean | null
          sleep_score?: number | null
          user_id: string
          water_litres?: number | null
        }
        Update: {
          connection?: boolean | null
          created_at?: string
          entry_date?: string
          gratitude?: boolean | null
          hydration?: boolean | null
          id?: string
          learning?: boolean | null
          mindfulness?: boolean | null
          movement?: boolean | null
          notes?: string | null
          nutrition?: boolean | null
          sleep?: boolean | null
          sleep_score?: number | null
          user_id?: string
          water_litres?: number | null
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          location: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      feature_events: {
        Row: {
          feature: string | null
          id: string
          metadata: Json | null
          occurred_at: string
          screen: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          feature?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string
          screen: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          feature?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string
          screen?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          rating: number | null
          screen: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          rating?: number | null
          screen: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          rating?: number | null
          screen?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string
          group_id: string | null
          id: string
          image_url: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          image_url: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          image_url?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "gallery_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          log_date: string
          log_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          log_date?: string
          log_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          log_date?: string
          log_type?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          item_name: string
          notes: string | null
          quantity: number
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          quantity?: number
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          quantity?: number
        }
        Relationships: []
      }
      kids_daily: {
        Row: {
          created_at: string
          entry_date: string
          exercise_rating: number | null
          id: string
          made_bed: boolean
          notes: string | null
          punctual: boolean
          sleep_time: string | null
          slept_8h: boolean
          updated_at: string
          user_id: string
          wake_time: string | null
          water_litres: number | null
        }
        Insert: {
          created_at?: string
          entry_date?: string
          exercise_rating?: number | null
          id?: string
          made_bed?: boolean
          notes?: string | null
          punctual?: boolean
          sleep_time?: string | null
          slept_8h?: boolean
          updated_at?: string
          user_id: string
          wake_time?: string | null
          water_litres?: number | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          exercise_rating?: number | null
          id?: string
          made_bed?: boolean
          notes?: string | null
          punctual?: boolean
          sleep_time?: string | null
          slept_8h?: boolean
          updated_at?: string
          user_id?: string
          wake_time?: string | null
          water_litres?: number | null
        }
        Relationships: []
      }
      kids_stars: {
        Row: {
          awarded_by: string | null
          created_at: string
          id: string
          reason: string | null
          star_type: string
          user_id: string
        }
        Insert: {
          awarded_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          star_type: string
          user_id: string
        }
        Update: {
          awarded_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          star_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievement_email: boolean
          achievement_inapp: boolean
          achievement_sms: boolean
          activity_email: boolean
          activity_inapp: boolean
          activity_sms: boolean
          created_at: string
          event_email: boolean
          event_inapp: boolean
          event_sms: boolean
          id: string
          rsvp_email: boolean
          rsvp_inapp: boolean
          rsvp_sms: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_email?: boolean
          achievement_inapp?: boolean
          achievement_sms?: boolean
          activity_email?: boolean
          activity_inapp?: boolean
          activity_sms?: boolean
          created_at?: string
          event_email?: boolean
          event_inapp?: boolean
          event_sms?: boolean
          id?: string
          rsvp_email?: boolean
          rsvp_inapp?: boolean
          rsvp_sms?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_email?: boolean
          achievement_inapp?: boolean
          achievement_sms?: boolean
          activity_email?: boolean
          activity_inapp?: boolean
          activity_sms?: boolean
          created_at?: string
          event_email?: boolean
          event_inapp?: boolean
          event_sms?: boolean
          id?: string
          rsvp_email?: boolean
          rsvp_inapp?: boolean
          rsvp_sms?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credits_applied: number | null
          id: string
          paid_at: string | null
          status: string
          training_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_applied?: number | null
          id?: string
          paid_at?: string | null
          status?: string
          training_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_applied?: number | null
          id?: string
          paid_at?: string | null
          status?: string
          training_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          allergies: string | null
          avatar_url: string | null
          birthday: string | null
          created_at: string
          credits: number
          current_book: string | null
          diet: string | null
          eating_habits: string | null
          fitness_experience: string | null
          fitness_goals: string | null
          full_name: string | null
          gender: string | null
          group_id: string | null
          height_cm: number | null
          hydration_liters: number | null
          id: string
          joining_date: string | null
          last_login_at: string | null
          medications: string | null
          mentor_id: string | null
          nickname: string | null
          past_injuries: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          sleep_hours: number | null
          social_handle: string | null
          team: Database["public"]["Enums"]["team_name"] | null
          trainer_id: string | null
          training_type: string | null
          updated_at: string
          username: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          allergies?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          credits?: number
          current_book?: string | null
          diet?: string | null
          eating_habits?: string | null
          fitness_experience?: string | null
          fitness_goals?: string | null
          full_name?: string | null
          gender?: string | null
          group_id?: string | null
          height_cm?: number | null
          hydration_liters?: number | null
          id: string
          joining_date?: string | null
          last_login_at?: string | null
          medications?: string | null
          mentor_id?: string | null
          nickname?: string | null
          past_injuries?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          sleep_hours?: number | null
          social_handle?: string | null
          team?: Database["public"]["Enums"]["team_name"] | null
          trainer_id?: string | null
          training_type?: string | null
          updated_at?: string
          username: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          allergies?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          credits?: number
          current_book?: string | null
          diet?: string | null
          eating_habits?: string | null
          fitness_experience?: string | null
          fitness_goals?: string | null
          full_name?: string | null
          gender?: string | null
          group_id?: string | null
          height_cm?: number | null
          hydration_liters?: number | null
          id?: string
          joining_date?: string | null
          last_login_at?: string | null
          medications?: string | null
          mentor_id?: string | null
          nickname?: string | null
          past_injuries?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          sleep_hours?: number | null
          social_handle?: string | null
          team?: Database["public"]["Enums"]["team_name"] | null
          trainer_id?: string | null
          training_type?: string | null
          updated_at?: string
          username?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      progress_tests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          plank_seconds: number | null
          pullups: number | null
          pushups: number | null
          run_100m_seconds: number | null
          run_5k_seconds: number | null
          squats: number | null
          test_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          plank_seconds?: number | null
          pullups?: number | null
          pushups?: number | null
          run_100m_seconds?: number | null
          run_5k_seconds?: number | null
          squats?: number | null
          test_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          plank_seconds?: number | null
          pullups?: number | null
          pushups?: number | null
          run_100m_seconds?: number | null
          run_5k_seconds?: number | null
          squats?: number | null
          test_date?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          stage: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          stage: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          stage?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean | null
          author_name: string
          author_type: string | null
          content: string
          created_at: string
          id: string
        }
        Insert: {
          approved?: boolean | null
          author_name: string
          author_type?: string | null
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          approved?: boolean | null
          author_name?: string
          author_type?: string | null
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      trainers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          hfc_code_name: string | null
          id: string
          name: string
          nickname: string | null
          phone: string | null
          phone_alt: string | null
          role: string | null
          sort_order: number
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          hfc_code_name?: string | null
          id?: string
          name: string
          nickname?: string | null
          phone?: string | null
          phone_alt?: string | null
          role?: string | null
          sort_order?: number
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          hfc_code_name?: string | null
          id?: string
          name?: string
          nickname?: string | null
          phone?: string | null
          phone_alt?: string | null
          role?: string | null
          sort_order?: number
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          last_active_at: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          last_active_at?: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          last_active_at?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          fitness_experience: string | null
          fitness_goals: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          mentor_id: string | null
          team: Database["public"]["Enums"]["team_name"] | null
          training_type: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          fitness_experience?: string | null
          fitness_goals?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          mentor_id?: string | null
          team?: Database["public"]["Enums"]["team_name"] | null
          training_type?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          fitness_experience?: string | null
          fitness_goals?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          mentor_id?: string | null
          team?: Database["public"]["Enums"]["team_name"] | null
          training_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          current_book: string | null
          fitness_experience: string | null
          fitness_goals: string | null
          full_name: string | null
          group_id: string | null
          id: string | null
          mentor_id: string | null
          nickname: string | null
          team: Database["public"]["Enums"]["team_name"] | null
          training_type: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          current_book?: string | null
          fitness_experience?: string | null
          fitness_goals?: string | null
          full_name?: string | null
          group_id?: string | null
          id?: string | null
          mentor_id?: string | null
          nickname?: string | null
          team?: Database["public"]["Enums"]["team_name"] | null
          training_type?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          current_book?: string | null
          fitness_experience?: string | null
          fitness_goals?: string | null
          full_name?: string | null
          group_id?: string | null
          id?: string | null
          mentor_id?: string | null
          nickname?: string | null
          team?: Database["public"]["Enums"]["team_name"] | null
          training_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_full_profile: {
        Args: { _id: string }
        Returns: {
          activity_level: string | null
          allergies: string | null
          avatar_url: string | null
          birthday: string | null
          created_at: string
          credits: number
          current_book: string | null
          diet: string | null
          eating_habits: string | null
          fitness_experience: string | null
          fitness_goals: string | null
          full_name: string | null
          gender: string | null
          group_id: string | null
          height_cm: number | null
          hydration_liters: number | null
          id: string
          joining_date: string | null
          last_login_at: string | null
          medications: string | null
          mentor_id: string | null
          nickname: string | null
          past_injuries: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          sleep_hours: number | null
          social_handle: string | null
          team: Database["public"]["Enums"]["team_name"] | null
          trainer_id: string | null
          training_type: string | null
          updated_at: string
          username: string
          weight_kg: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_all_profiles: {
        Args: never
        Returns: {
          activity_level: string | null
          allergies: string | null
          avatar_url: string | null
          birthday: string | null
          created_at: string
          credits: number
          current_book: string | null
          diet: string | null
          eating_habits: string | null
          fitness_experience: string | null
          fitness_goals: string | null
          full_name: string | null
          gender: string | null
          group_id: string | null
          height_cm: number | null
          hydration_liters: number | null
          id: string
          joining_date: string | null
          last_login_at: string | null
          medications: string | null
          mentor_id: string | null
          nickname: string | null
          past_injuries: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          sleep_hours: number | null
          social_handle: string | null
          team: Database["public"]["Enums"]["team_name"] | null
          trainer_id: string | null
          training_type: string | null
          updated_at: string
          username: string
          weight_kg: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      send_birthday_reminders: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "mentor"
      team_name: "OT" | "PT" | "PF" | "GT"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user", "mentor"],
      team_name: ["OT", "PT", "PF", "GT"],
    },
  },
} as const
