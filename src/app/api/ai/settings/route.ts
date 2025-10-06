import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserOpenRouterClient } from '@/lib/ai/openrouter'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/settings
 * AI設定取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // AI設定取得
    const { data: settings, error } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('AI settings fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch AI settings' },
        { status: 500 }
      )
    }

    // 設定が存在しない場合はデフォルト設定を返す
    if (!settings) {
      return NextResponse.json({
        settings: {
          provider: 'openrouter',
          default_model: process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-v3.1:free',
          use_own_api_key: 'false',
          api_key_last_4: null,
          api_key_verified_at: null,
          monthly_usage_limit: null,
          current_month_usage: 0,
        }
      })
    }

    // API Keyは返さない (セキュリティ)
    const { api_key, ...safeSettings } = settings

    return NextResponse.json({ settings: safeSettings })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/settings
 * AI設定作成・更新
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as {
      default_model?: string
      use_own_api_key?: string
      api_key?: string
      monthly_usage_limit?: number
    }
    const {
      default_model,
      use_own_api_key,
      api_key,
      monthly_usage_limit
    } = body

    // バリデーション
    if (use_own_api_key === 'true' && !api_key) {
      return NextResponse.json(
        { error: 'API key is required when use_own_api_key is true' },
        { status: 400 }
      )
    }

    // API Key検証 (ユーザー自身のAPI Key使用時)
    let apiKeyLast4 = null
    let apiKeyVerifiedAt = null

    if (use_own_api_key === 'true' && api_key) {
      try {
        const client = getUserOpenRouterClient(api_key)
        const isValid = await client.validateApiKey()

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 400 }
          )
        }

        apiKeyLast4 = api_key.slice(-4)
        apiKeyVerifiedAt = new Date().toISOString()
      } catch (error) {
        console.error('API key validation error:', error)
        return NextResponse.json(
          { error: 'Failed to validate API key' },
          { status: 400 }
        )
      }
    }

    // 既存設定確認
    const { data: existing } = await supabase
      .from('ai_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const settingsData: any = {
      user_id: user.id,
      provider: 'openrouter',
      default_model: default_model || process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-v3.1:free',
      use_own_api_key: use_own_api_key || 'false',
      updated_at: new Date().toISOString(),
    }

    if (use_own_api_key === 'true' && api_key) {
      settingsData.api_key = api_key
      settingsData.api_key_last_4 = apiKeyLast4
      settingsData.api_key_verified_at = apiKeyVerifiedAt
    }

    if (monthly_usage_limit !== undefined) {
      settingsData.monthly_usage_limit = monthly_usage_limit
    }

    let settings
    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from('ai_settings')
        .update(settingsData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('AI settings update error:', error)
        return NextResponse.json(
          { error: 'Failed to update AI settings' },
          { status: 500 }
        )
      }
      settings = data
    } else {
      // 作成
      settingsData.current_month_usage = 0
      const { data, error } = await supabase
        .from('ai_settings')
        .insert(settingsData)
        .select()
        .single()

      if (error) {
        console.error('AI settings create error:', error)
        return NextResponse.json(
          { error: 'Failed to create AI settings' },
          { status: 500 }
        )
      }
      settings = data
    }

    // API Keyは返さない
    const { api_key: _, ...safeSettings } = settings

    return NextResponse.json({ settings: safeSettings })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ai/settings
 * AI設定削除 (API Key削除)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // API Key削除 (サービス提供のAPI Keyに戻す)
    const { error } = await supabase
      .from('ai_settings')
      .update({
        use_own_api_key: 'false',
        api_key: null,
        api_key_last_4: null,
        api_key_verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('AI settings delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
