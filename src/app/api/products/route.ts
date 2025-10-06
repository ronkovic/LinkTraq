import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products
 * 商品一覧取得
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

    // 商品一覧取得
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * 商品新規登録
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
      name?: string
      description?: string
      price?: number
      currency?: string
      product_url?: string
      image_url?: string
      category?: string
    }
    const { name, description, price, currency, product_url, image_url, category } = body

    // バリデーション
    if (!name || !price || !product_url) {
      return NextResponse.json(
        { error: 'Name, price, and product_url are required' },
        { status: 400 }
      )
    }

    // 商品登録
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name,
        description,
        price,
        currency: currency || 'JPY',
        product_url,
        image_url,
        category,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Product creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
