import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics
 * 分析データ取得
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
    const period = searchParams.get('period') || '30' // デフォルト30日間

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // ユーザーの商品IDを取得
    const { data: userProducts } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', user.id)

    const productIds = userProducts?.map(p => p.id) || []

    // ユーザーのアフィリエイトリンクIDを取得
    const { data: userLinks } = await supabase
      .from('affiliate_links')
      .select('id')
      .in('product_id', productIds)

    const linkIds = userLinks?.map(l => l.id) || []

    // 総クリック数
    const { count: totalClicks } = await supabase
      .from('link_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', startDate.toISOString())
      .in('affiliate_link_id', linkIds)

    // 総コンバージョン数
    const { count: totalConversions } = await supabase
      .from('conversions')
      .select('*', { count: 'exact', head: true })
      .gte('converted_at', startDate.toISOString())
      .in('affiliate_link_id', linkIds)

    // 総収益
    const { data: conversions } = await supabase
      .from('conversions')
      .select('commission_amount, currency')
      .gte('converted_at', startDate.toISOString())
      .in('affiliate_link_id', linkIds)

    const totalRevenue = conversions?.reduce(
      (sum, conv) => sum + (conv.commission_amount || 0),
      0
    ) || 0

    // 商品別パフォーマンス
    const { data: productPerformance } = await supabase
      .from('products')
      .select(`
        id,
        name,
        affiliate_links (
          id,
          click_count
        )
      `)
      .eq('user_id', user.id)
      .limit(10)

    const topProducts = productPerformance?.map((product) => ({
      id: product.id,
      name: product.name,
      clicks: product.affiliate_links?.reduce(
        (sum: number, link: any) => sum + (link.click_count || 0),
        0
      ) || 0,
    })).sort((a, b) => b.clicks - a.clicks) || []

    // 日別クリック数（過去7日間）
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    const { data: dailyClicks } = await supabase
      .from('link_clicks')
      .select('clicked_at')
      .gte('clicked_at', new Date(last7Days[0]).toISOString())
      .in('affiliate_link_id', linkIds)

    const clicksByDay = last7Days.map((date) => {
      const count = dailyClicks?.filter(
        (click) => click.clicked_at.startsWith(date)
      ).length || 0
      return { date, count }
    })

    // コンバージョン率
    const conversionRate = totalClicks && totalClicks > 0
      ? ((totalConversions || 0) / totalClicks) * 100
      : 0

    return NextResponse.json({
      summary: {
        totalClicks: totalClicks || 0,
        totalConversions: totalConversions || 0,
        totalRevenue,
        conversionRate: conversionRate.toFixed(2),
      },
      topProducts,
      clicksByDay,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
