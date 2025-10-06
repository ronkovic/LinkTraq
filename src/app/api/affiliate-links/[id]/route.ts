import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/affiliate-links/[id]
 * アフィリエイトリンク詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // アフィリエイトリンク取得
    const { data: link, error } = await supabase
      .from('affiliate_links')
      .select(`
        *,
        products!inner (
          id,
          name,
          price,
          currency,
          image_url,
          user_id
        )
      `)
      .eq('id', id)
      .eq('products.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Affiliate link not found' },
          { status: 404 }
        )
      }
      console.error('Affiliate link fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch affiliate link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/affiliate-links/[id]
 * アフィリエイトリンク更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      campaign_name?: string
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      status?: string
    }
    const { campaign_name, utm_source, utm_medium, utm_campaign, status } = body

    // 所有者確認
    const { data: existing } = await supabase
      .from('affiliate_links')
      .select(`
        id,
        products!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('products.user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Affiliate link not found or access denied' },
        { status: 404 }
      )
    }

    // 更新データ準備
    const updateData: any = {}
    if (campaign_name !== undefined) updateData.campaign_name = campaign_name
    if (utm_source !== undefined) updateData.utm_source = utm_source
    if (utm_medium !== undefined) updateData.utm_medium = utm_medium
    if (utm_campaign !== undefined) updateData.utm_campaign = utm_campaign
    if (status !== undefined) updateData.status = status

    // アフィリエイトリンク更新
    const { data: link, error } = await supabase
      .from('affiliate_links')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        products (
          id,
          name,
          price,
          currency,
          image_url
        )
      `)
      .single()

    if (error) {
      console.error('Affiliate link update error:', error)
      return NextResponse.json(
        { error: 'Failed to update affiliate link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/affiliate-links/[id]
 * アフィリエイトリンク削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .from('affiliate_links')
      .select(`
        id,
        products!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('products.user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Affiliate link not found or access denied' },
        { status: 404 }
      )
    }

    // アフィリエイトリンク削除
    const { error } = await supabase
      .from('affiliate_links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Affiliate link delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete affiliate link' },
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
