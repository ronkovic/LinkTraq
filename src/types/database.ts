/**
 * Database Types
 * Supabase database schema types
 */

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
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          price: number
          currency: string
          product_url: string
          image_url: string | null
          category: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          price: number
          currency?: string
          product_url: string
          image_url?: string | null
          category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          product_url?: string
          image_url?: string | null
          category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      affiliate_links: {
        Row: {
          id: string
          product_id: string
          short_code: string
          campaign_name: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          click_count: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          short_code: string
          campaign_name?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          click_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          short_code?: string
          campaign_name?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          click_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      link_clicks: {
        Row: {
          id: string
          affiliate_link_id: string
          clicked_at: string
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          country_code: string | null
          city: string | null
          device_type: string | null
          browser: string | null
          os: string | null
        }
        Insert: {
          id?: string
          affiliate_link_id: string
          clicked_at?: string
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          country_code?: string | null
          city?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
        }
        Update: {
          id?: string
          affiliate_link_id?: string
          clicked_at?: string
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          country_code?: string | null
          city?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
        }
      }
      conversions: {
        Row: {
          id: string
          affiliate_link_id: string
          link_click_id: string | null
          converted_at: string
          order_id: string | null
          order_amount: number | null
          commission_amount: number | null
          currency: string
          status: string
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          affiliate_link_id: string
          link_click_id?: string | null
          converted_at?: string
          order_id?: string | null
          order_amount?: number | null
          commission_amount?: number | null
          currency?: string
          status?: string
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          affiliate_link_id?: string
          link_click_id?: string | null
          converted_at?: string
          order_id?: string | null
          order_amount?: number | null
          commission_amount?: number | null
          currency?: string
          status?: string
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sns_integrations: {
        Row: {
          id: string
          user_id: string
          platform: string
          account_id: string
          account_name: string | null
          access_token: string
          access_token_secret: string | null
          refresh_token: string | null
          token_expires_at: string | null
          status: string
          connected_at: string
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          account_id: string
          account_name?: string | null
          access_token: string
          access_token_secret?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          status?: string
          connected_at?: string
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          account_id?: string
          account_name?: string | null
          access_token?: string
          access_token_secret?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          status?: string
          connected_at?: string
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sns_posts: {
        Row: {
          id: string
          user_id: string
          affiliate_link_id: string
          platform: string
          content: string
          media_urls: string[] | null
          post_id: string | null
          post_url: string | null
          status: string
          scheduled_for: string | null
          posted_at: string | null
          error_message: string | null
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          affiliate_link_id: string
          platform: string
          content: string
          media_urls?: string[] | null
          post_id?: string | null
          post_url?: string | null
          status?: string
          scheduled_for?: string | null
          posted_at?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          affiliate_link_id?: string
          platform?: string
          content?: string
          media_urls?: string[] | null
          post_id?: string | null
          post_url?: string | null
          status?: string
          scheduled_for?: string | null
          posted_at?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_status: 'active' | 'inactive' | 'archived'
      link_status: 'active' | 'inactive' | 'expired'
      conversion_status: 'pending' | 'confirmed' | 'rejected' | 'paid'
      sns_platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin'
      post_status: 'draft' | 'scheduled' | 'published' | 'failed'
      integration_status: 'active' | 'inactive' | 'error'
    }
  }
}
