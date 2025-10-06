import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/twitter/callback
 * X (Twitter) OAuth 2.0 コールバック処理
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // エラーチェック
    if (error) {
      console.error('Twitter OAuth error:', error)
      return NextResponse.redirect(
        new URL('/dashboard?error=twitter_auth_failed', request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_callback', request.url)
      )
    }

    // Cookieからcode_verifierとstateを取得
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value
    const savedState = request.cookies.get('twitter_state')?.value

    if (!codeVerifier || !savedState) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_session', request.url)
      )
    }

    // State検証（CSRF対策）
    if (state !== savedState) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_state', request.url)
      )
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/dashboard?error=oauth_not_configured', request.url)
      )
    }

    // アクセストークン取得
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        new URL('/dashboard?error=token_exchange_failed', request.url)
      )
    }

    const tokenData = await tokenResponse.json() as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    const { access_token, refresh_token, expires_in } = tokenData

    // ユーザー情報取得
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to get user info')
      return NextResponse.redirect(
        new URL('/dashboard?error=user_info_failed', request.url)
      )
    }

    const userData = await userResponse.json() as { data?: any }
    const twitterUser = userData.data

    // トークンの有効期限を計算
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 7200))

    // 既存の連携を確認
    const { data: existingIntegration } = await supabase
      .from('sns_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .single()

    if (existingIntegration) {
      // 更新
      await supabase
        .from('sns_integrations')
        .update({
          account_id: twitterUser.id,
          account_name: twitterUser.username,
          access_token,
          refresh_token,
          token_expires_at: expiresAt.toISOString(),
          status: 'active',
          connected_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id)
    } else {
      // 新規作成
      await supabase.from('sns_integrations').insert({
        user_id: user.id,
        platform: 'twitter',
        account_id: twitterUser.id,
        account_name: twitterUser.username,
        access_token,
        refresh_token,
        token_expires_at: expiresAt.toISOString(),
        status: 'active',
        connected_at: new Date().toISOString(),
      })
    }

    // Cookieをクリア
    const response = NextResponse.redirect(
      new URL('/dashboard?success=twitter_connected', request.url)
    )
    response.cookies.delete('twitter_code_verifier')
    response.cookies.delete('twitter_state')

    return response
  } catch (error) {
    console.error('Twitter callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=callback_failed', request.url)
    )
  }
}
