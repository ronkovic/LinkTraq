/**
 * Client-side authentication helper functions
 * ブラウザ専用の認証関数
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client'

/**
 * Sign up with email and password
 * @param email ユーザーのメールアドレス
 * @param password パスワード
 */
export async function signUp(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign in with email and password
 * @param email ユーザーのメールアドレス
 * @param password パスワード
 */
export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

/**
 * Reset password request
 * @param email ユーザーのメールアドレス
 */
export async function resetPassword(email: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Update password
 * @param newPassword 新しいパスワード
 */
export async function updatePassword(newPassword: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }

  return data
}
