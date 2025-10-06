import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/integrations
 * SNS連携一覧取得
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

    // SNS連携一覧取得（access_tokenは除外）
    const { data: integrations, error } = await supabase
      .from('sns_integrations')
      .select('id, platform, account_name, status, connected_at')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false })

    if (error) {
      console.error('Integrations fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
