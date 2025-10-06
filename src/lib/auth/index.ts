/**
 * Server-side authentication helper functions
 * サーバーサイド専用の認証関数
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get current user session (Server Component)
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current user (Server Component)
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Require authentication (Server Component)
 * リダイレクト先を指定しない場合は/loginへ
 */
export async function requireAuth(redirectTo = '/login') {
  const user = await getUser()

  if (!user) {
    redirect(redirectTo)
  }

  return user
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}
