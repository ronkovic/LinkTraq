import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedules/[id]
 * スケジュール詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // スケジュール取得
    const { data: schedule, error } = await supabase
      .from('post_schedules')
      .select(`
        *,
        posts!inner (
          id,
          content,
          image_urls,
          hashtags,
          products!inner (
            id,
            name,
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('posts.products.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Schedule not found' },
          { status: 404 }
        )
      }
      console.error('Schedule fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/schedules/[id]
 * スケジュール更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      scheduled_at?: string
      sns_platform?: string
      status?: string
    }
    const { scheduled_at, sns_platform, status } = body

    // 所有者確認
    const { data: existing } = await supabase
      .from('post_schedules')
      .select(`
        id,
        posts!inner (
          products!inner (
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('posts.products.user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Schedule not found or access denied' },
        { status: 404 }
      )
    }

    // 更新データ準備
    const updateData: any = {}
    if (scheduled_at !== undefined) {
      const scheduledDate = new Date(scheduled_at)
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }
      updateData.scheduled_at = scheduled_at
    }
    if (sns_platform !== undefined) updateData.sns_platform = sns_platform
    if (status !== undefined) updateData.status = status

    // スケジュール更新
    const { data: schedule, error } = await supabase
      .from('post_schedules')
      .update(updateData)
      .eq('id', id)
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
      console.error('Schedule update error:', error)
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/schedules/[id]
 * スケジュール削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // 所有者確認
    const { data: existing } = await supabase
      .from('post_schedules')
      .select(`
        id,
        posts!inner (
          products!inner (
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('posts.products.user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Schedule not found or access denied' },
        { status: 404 }
      )
    }

    // スケジュール削除
    const { error } = await supabase
      .from('post_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Schedule delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
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
