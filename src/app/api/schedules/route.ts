import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedules
 * スケジュール一覧取得
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

    // クエリパラメータ
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // pending, processing, published, failed
    const platform = searchParams.get('platform') // x, instagram, facebook

    // スケジュール一覧取得
    let query = supabase
      .from('post_schedules')
      .select(`
        *,
        posts!inner (
          id,
          content,
          image_urls,
          hashtags,
          products (
            id,
            name,
            user_id
          )
        )
      `)
      .eq('posts.products.user_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }
    if (platform) {
      query = query.eq('sns_platform', platform)
    }

    const { data: schedules, error } = await query

    if (error) {
      console.error('Schedules fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedules
 * スケジュール作成
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
      post_id?: string
      scheduled_at?: string
      sns_platform?: string
    }
    const { post_id, scheduled_at, sns_platform } = body

    // バリデーション
    if (!post_id || !scheduled_at || !sns_platform) {
      return NextResponse.json(
        { error: 'Missing required fields: post_id, scheduled_at, sns_platform' },
        { status: 400 }
      )
    }

    // 投稿の所有者確認
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        products!inner (
          user_id
        )
      `)
      .eq('id', post_id)
      .eq('products.user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found or access denied' },
        { status: 404 }
      )
    }

    // スケジュール時刻が未来であることを確認
    const scheduledDate = new Date(scheduled_at)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // スケジュール作成
    const { data: schedule, error } = await supabase
      .from('post_schedules')
      .insert({
        post_id,
        scheduled_at,
        sns_platform,
        status: 'pending',
        retry_count: 0,
      })
      .select(`
        *,
        posts (
          id,
          content,
          image_urls,
          hashtags
        )
      `)
      .single()

    if (error) {
      console.error('Schedule create error:', error)
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
