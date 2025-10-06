import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postTweet, validateTweetContent } from '@/lib/twitter'

export const dynamic = 'force-dynamic'

/**
 * GET /api/posts
 * 投稿履歴一覧取得
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

    // 投稿履歴取得（アフィリエイトリンク・商品情報も含む）
    const { data: posts, error } = await supabase
      .from('sns_posts')
      .select(`
        *,
        affiliate_links (
          id,
          short_code,
          products (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('posted_at', { ascending: false })

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/posts
 * SNS投稿実行
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
      affiliate_link_id?: string
      platform?: string
      content?: string
      scheduled_for?: string
      media_urls?: string[]
    }
    const {
      affiliate_link_id,
      platform,
      content,
      scheduled_for,
      media_urls,
    } = body

    // バリデーション
    if (!affiliate_link_id || !platform || !content) {
      return NextResponse.json(
        { error: 'affiliate_link_id, platform, and content are required' },
        { status: 400 }
      )
    }

    // アフィリエイトリンクの存在確認と所有者チェック
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select(`
        id,
        short_code,
        products!inner (
          user_id
        )
      `)
      .eq('id', affiliate_link_id)
      .eq('products.user_id', user.id)
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Affiliate link not found or access denied' },
        { status: 404 }
      )
    }

    // ツイート内容の検証
    const validation = validateTweetContent(content)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // スケジュール投稿の場合
    if (scheduled_for) {
      const scheduledDate = new Date(scheduled_for)
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }

      // スケジュール投稿として保存
      const { data: post, error } = await supabase
        .from('sns_posts')
        .insert({
          user_id: user.id,
          affiliate_link_id,
          platform,
          content,
          scheduled_for: scheduledDate.toISOString(),
          status: 'scheduled',
        })
        .select()
        .single()

      if (error) {
        console.error('Scheduled post creation error:', error)
        return NextResponse.json(
          { error: 'Failed to schedule post' },
          { status: 500 }
        )
      }

      return NextResponse.json({ post, scheduled: true }, { status: 201 })
    }

    // 即時投稿の場合
    // ユーザーのSNS連携情報を取得
    const { data: integration } = await supabase
      .from('sns_integrations')
      .select('access_token, access_token_secret')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('status', 'active')
      .single()

    if (!integration || !integration.access_token) {
      return NextResponse.json(
        { error: 'SNS account not connected. Please connect your account first.' },
        { status: 400 }
      )
    }

    // 短縮URLを含めた最終的な投稿内容
    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://linktraq.com'}/l/${link.short_code}`
    const finalContent = `${content}\n\n${shortUrl}`

    try {
      // X APIに投稿
      const tweetResponse = await postTweet(integration.access_token, {
        text: finalContent,
      })

      // 投稿記録を保存
      const { data: post, error: postError } = await supabase
        .from('sns_posts')
        .insert({
          user_id: user.id,
          affiliate_link_id,
          platform,
          content: finalContent,
          posted_at: new Date().toISOString(),
          status: 'published',
          post_id: tweetResponse.data.id,
        })
        .select(`
          *,
          affiliate_links (
            id,
            short_code,
            products (
              id,
              name,
              image_url
            )
          )
        `)
        .single()

      if (postError) {
        console.error('Post record creation error:', postError)
        return NextResponse.json(
          { error: 'Tweet posted but failed to save record' },
          { status: 500 }
        )
      }

      return NextResponse.json({ post }, { status: 201 })
    } catch (tweetError: any) {
      // 投稿失敗を記録
      await supabase.from('sns_posts').insert({
        user_id: user.id,
        affiliate_link_id,
        platform,
        content: finalContent,
        status: 'failed',
        error_message: tweetError.message,
      })

      return NextResponse.json(
        { error: tweetError.message || 'Failed to post to Twitter' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
