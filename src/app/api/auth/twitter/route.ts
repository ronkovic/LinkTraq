import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/twitter
 * X (Twitter) OAuth 2.0 認証開始
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`

    if (!clientId) {
      return NextResponse.json(
        { error: 'Twitter OAuth is not configured' },
        { status: 500 }
      )
    }

    // PKCE用のcode_verifierとcode_challengeを生成
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // StateをセッションまたはCookieに保存（CSRF対策）
    const state = generateState()

    // code_verifierとstateを一時保存（本番環境ではRedisなどを使用）
    // ここではクエリパラメータで渡す簡易実装
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    // code_verifierを保存するためのURL（本番ではセッションストレージを使用）
    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`

    // Cookieにcode_verifierとstateを保存
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10分
    })
    response.cookies.set('twitter_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10分
    })

    return response
  } catch (error) {
    console.error('Twitter OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Twitter OAuth' },
      { status: 500 }
    )
  }
}

/**
 * Generate random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * Generate code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(array: Uint8Array): string {
  const base64 = Buffer.from(array).toString('base64')
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generate random state for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}
