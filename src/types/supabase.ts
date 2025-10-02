export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          telegram_chat_id: string | null
          notification_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          telegram_chat_id?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          telegram_chat_id?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      power_status: {
        Row: {
          id: string
          status: 'ON' | 'OFF'
          timestamp: string
          duration_minutes: number | null
          created_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          status: 'ON' | 'OFF'
          timestamp?: string
          duration_minutes?: number | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          status?: 'ON' | 'OFF'
          timestamp?: string
          duration_minutes?: number | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "power_status_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      power_consumption: {
        Row: {
          id: string
          reading_date: string
          units_consumed: number
          cost_per_unit: number
          total_cost: number | null
          meter_reading: number | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reading_date: string
          units_consumed: number
          cost_per_unit?: number
          meter_reading?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reading_date?: string
          units_consumed?: number
          cost_per_unit?: number
          meter_reading?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "power_consumption_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'power_outage' | 'power_restored' | 'daily_summary' | 'weekly_report' | 'maintenance_alert' | 'system'
          status: 'read' | 'unread'
          telegram_sent: boolean | null
          telegram_message_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'power_outage' | 'power_restored' | 'daily_summary' | 'weekly_report' | 'maintenance_alert' | 'system'
          status?: 'read' | 'unread'
          telegram_sent?: boolean | null
          telegram_message_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'power_outage' | 'power_restored' | 'daily_summary' | 'weekly_report' | 'maintenance_alert' | 'system'
          status?: 'read' | 'unread'
          telegram_sent?: boolean | null
          telegram_message_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      system_logs: {
        Row: {
          id: string
          action: string
          description: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          description: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          description?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}