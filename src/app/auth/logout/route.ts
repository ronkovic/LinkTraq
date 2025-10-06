import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Logout Handler
 * ユーザーをログアウトさせる
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/', request.url))
}
