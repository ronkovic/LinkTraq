import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

/**
 * GET /api/affiliate-links
 * アフィリエイトリンク一覧取得
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
    const productId = searchParams.get('product_id')

    // アフィリエイトリンク一覧取得（商品情報も含む）
    let query = supabase
      .from('affiliate_links')
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
      .eq('products.user_id', user.id)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: links, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Affiliate links fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch affiliate links' },
        { status: 500 }
      )
    }

    return NextResponse.json({ links })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/affiliate-links
 * アフィリエイトリンク新規作成
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
      product_id?: string
      campaign_name?: string
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
    }
    const { product_id, campaign_name, utm_source, utm_medium, utm_campaign } = body

    // バリデーション
    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      )
    }

    // 商品の存在確認と所有者チェック
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, user_id')
      .eq('id', product_id)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      )
    }

    // 短縮コード生成（重複チェック付き）
    let shortCode = nanoid(8)
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('short_code', shortCode)
        .single()

      if (!existing) break

      shortCode = nanoid(8)
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique short code' },
        { status: 500 }
      )
    }

    // アフィリエイトリンク作成
    const { data: link, error } = await supabase
      .from('affiliate_links')
      .insert({
        product_id,
        short_code: shortCode,
        campaign_name,
        utm_source,
        utm_medium,
        utm_campaign,
        status: 'active',
      })
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
      console.error('Affiliate link creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create affiliate link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ link }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
