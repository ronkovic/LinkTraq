import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /l/[code]
 * 短縮URL -> 商品URLへのリダイレクト + クリック追跡
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()
    const shortCode = code

    // アフィリエイトリンク取得
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select(`
        id,
        product_id,
        utm_source,
        utm_medium,
        utm_campaign,
        status,
        products (
          product_url
        )
      `)
      .eq('short_code', shortCode)
      .eq('status', 'active')
      .single()

    if (linkError || !link || !link.products) {
      // リンクが見つからない場合
      return NextResponse.redirect(new URL('/', request.url))
    }

    // productsは単一オブジェクトとして取得
    const product = link.products as any

    // リクエスト情報取得
    const userAgent = request.headers.get('user-agent') || undefined
    const referer = request.headers.get('referer') || undefined
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               undefined

    // クリック記録（非同期で実行、リダイレクトをブロックしない）
    supabase
      .from('link_clicks')
      .insert({
        affiliate_link_id: link.id,
        clicked_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
        referrer: referer,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Click tracking error:', error)
        }
      })

    // UTMパラメータ付きのURLを生成
    const productUrl = new URL(product.product_url)

    if (link.utm_source) {
      productUrl.searchParams.set('utm_source', link.utm_source)
    }
    if (link.utm_medium) {
      productUrl.searchParams.set('utm_medium', link.utm_medium)
    }
    if (link.utm_campaign) {
      productUrl.searchParams.set('utm_campaign', link.utm_campaign)
    }

    // 商品URLへリダイレクト
    return NextResponse.redirect(productUrl.toString())
  } catch (error) {
    console.error('Redirect error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
