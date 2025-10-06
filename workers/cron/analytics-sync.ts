/**
 * Cloudflare Cron Worker - アナリティクス同期
 * X APIから投稿のアナリティクスデータを定期的に取得
 */

/// <reference types="@cloudflare/workers-types" />

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

interface Post {
  id: string
  user_id: string
  external_post_id: string | null
  sns_platform: string
}

interface SNSIntegration {
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

interface XTweetMetrics {
  impression_count: number
  like_count: number
  reply_count: number
  retweet_count: number
  quote_count: number
  bookmark_count: number
  url_link_clicks: number
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Analytics sync cron triggered:', new Date(event.scheduledTime).toISOString())

    try {
      // X (Twitter) に投稿済みの投稿一覧を取得
      const posts = await getPublishedPosts(env)
      console.log(`Found ${posts.length} published posts`)

      let successCount = 0
      let errorCount = 0

      for (const post of posts) {
        try {
          // SNS連携情報取得
          const integration = await getSNSIntegration(post.user_id, post.sns_platform, env)
          if (!integration) {
            console.warn(`SNS integration not found for user ${post.user_id}, platform ${post.sns_platform}`)
            continue
          }

          // アナリティクス取得
          const metrics = await fetchXTweetMetrics(
            post.external_post_id!,
            integration.access_token
          )

          // Supabaseに保存
          await saveAnalytics(post.id, metrics, env)
          successCount++

          console.log(`Analytics synced for post ${post.id}`)
        } catch (error) {
          console.error(`Failed to sync analytics for post ${post.id}:`, error)
          errorCount++
        }
      }

      console.log(`Analytics sync completed: ${successCount} success, ${errorCount} errors`)
    } catch (error) {
      console.error('Cron execution error:', error)
      throw error
    }
  },
}

/**
 * 投稿済みの投稿一覧取得
 */
async function getPublishedPosts(env: Env): Promise<Post[]> {
  // 過去7日間に投稿されたもの
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/posts?status=eq.published&external_post_id=not.is.null&created_at=gte.${sevenDaysAgo.toISOString()}&select=id,user_id,external_post_id,sns_platform`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch published posts: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * SNS連携情報取得
 */
async function getSNSIntegration(
  userId: string,
  platform: string,
  env: Env
): Promise<SNSIntegration | null> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/sns_integrations?user_id=eq.${userId}&platform=eq.${platform}&select=access_token,refresh_token,expires_at`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch SNS integration: ${response.statusText}`)
  }

  const data = await response.json() as SNSIntegration[]
  return data[0] || null
}

/**
 * X APIからツイートのメトリクスを取得
 */
async function fetchXTweetMetrics(
  tweetId: string,
  accessToken: string
): Promise<XTweetMetrics> {
  // X API v2 - Get Tweet by ID with metrics
  // https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets-id
  const response = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`X API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json() as { data?: any }
  const tweet = data.data

  // メトリクスを統合
  const publicMetrics = tweet.public_metrics || {}
  const organicMetrics = tweet.organic_metrics || {}

  return {
    impression_count: organicMetrics.impression_count || publicMetrics.impression_count || 0,
    like_count: publicMetrics.like_count || 0,
    reply_count: publicMetrics.reply_count || 0,
    retweet_count: publicMetrics.retweet_count || 0,
    quote_count: publicMetrics.quote_count || 0,
    bookmark_count: publicMetrics.bookmark_count || 0,
    url_link_clicks: organicMetrics.url_link_clicks || 0,
  }
}

/**
 * アナリティクスをSupabaseに保存
 */
async function saveAnalytics(
  postId: string,
  metrics: XTweetMetrics,
  env: Env
): Promise<void> {
  // post_analyticsテーブルに保存または更新
  const analyticsData = {
    post_id: postId,
    impressions: metrics.impression_count,
    likes: metrics.like_count,
    replies: metrics.reply_count,
    retweets: metrics.retweet_count,
    quotes: metrics.quote_count,
    bookmarks: metrics.bookmark_count,
    link_clicks: metrics.url_link_clicks,
    synced_at: new Date().toISOString(),
  }

  // 既存レコード確認
  const checkResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/post_analytics?post_id=eq.${postId}&select=id`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  const existing = await checkResponse.json() as any[]

  if (existing && existing.length > 0) {
    // 更新
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/post_analytics?post_id=eq.${postId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(analyticsData),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update analytics: ${response.statusText}`)
    }
  } else {
    // 新規作成
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/post_analytics`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(analyticsData),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create analytics: ${response.statusText}`)
    }
  }
}
