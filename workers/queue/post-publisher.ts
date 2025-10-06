/**
 * Cloudflare Queue Consumer - 投稿実行
 * スケジュールされた投稿をSNSに送信
 */

/// <reference types="@cloudflare/workers-types" />

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  POST_DLQ: Queue
}

interface PostScheduleMessage {
  schedule_id: string
  post_id: string
  sns_platform: 'x' | 'instagram' | 'facebook'
  retry_count: number
}

interface PostSchedule {
  id: string
  post_id: string
  scheduled_at: string
  sns_platform: string
  status: string
  retry_count: number
  posts: {
    id: string
    user_id: string
    content: string
    image_urls: string[] | null
    hashtags: string[] | null
    products: {
      id: string
      affiliate_links: {
        id: string
        short_code: string
      }[]
    } | null
  }
}

interface SNSIntegration {
  id: string
  platform: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

// リトライ設定
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAYS: [5 * 60, 15 * 60, 60 * 60], // 5分, 15分, 1時間 (秒)
}

export default {
  async queue(
    batch: MessageBatch<PostScheduleMessage>,
    env: Env
  ): Promise<void> {
    for (const message of batch.messages) {
      try {
        await publishPost(message.body, env)
        message.ack()
      } catch (error) {
        console.error('Post publish error:', error)

        // リトライ制限チェック
        if (message.body.retry_count >= RETRY_CONFIG.MAX_RETRIES) {
          // 最終失敗 → DLQに送信
          await env.POST_DLQ.send(message.body)
          await recordFailure(message.body, error, true, env)
          message.ack()
        } else {
          // リトライ
          await recordFailure(message.body, error, false, env)
          message.retry()
        }
      }
    }
  },
}

/**
 * 投稿をSNSに送信
 */
async function publishPost(
  message: PostScheduleMessage,
  env: Env
): Promise<void> {
  // スケジュール情報取得
  const schedule = await getSchedule(message.schedule_id, env)
  if (!schedule) {
    throw new Error(`Schedule not found: ${message.schedule_id}`)
  }

  // ステータスチェック
  if (schedule.status !== 'pending') {
    console.log(`Schedule ${message.schedule_id} is not pending, skipping`)
    return
  }

  // ステータス更新: processing
  await updateScheduleStatus(message.schedule_id, 'processing', env)

  // SNS連携情報取得
  const integration = await getSNSIntegration(
    schedule.posts.user_id,
    message.sns_platform,
    env
  )
  if (!integration) {
    throw new Error(`SNS integration not found for platform: ${message.sns_platform}`)
  }

  // 投稿内容準備
  const content = preparePostContent(schedule)

  // SNSに投稿
  const result = await postToSNS(
    message.sns_platform,
    content,
    integration,
    env
  )

  // ステータス更新: published
  await updateScheduleStatus(
    message.schedule_id,
    'published',
    env,
    new Date().toISOString()
  )

  console.log(`Post published successfully: ${message.schedule_id}`)
}

/**
 * スケジュール情報取得
 */
async function getSchedule(
  scheduleId: string,
  env: Env
): Promise<PostSchedule | null> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/post_schedules?id=eq.${scheduleId}&select=*,posts(id,user_id,content,image_urls,hashtags,products(id,affiliate_links(id,short_code)))`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch schedule: ${response.statusText}`)
  }

  const data = await response.json() as PostSchedule[]
  return data[0] || null
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
    `${env.SUPABASE_URL}/rest/v1/sns_integrations?user_id=eq.${userId}&platform=eq.${platform}&select=*`,
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
 * 投稿内容準備
 */
function preparePostContent(schedule: PostSchedule): string {
  let content = schedule.posts.content

  // ハッシュタグ追加
  if (schedule.posts.hashtags && schedule.posts.hashtags.length > 0) {
    content += '\n\n' + schedule.posts.hashtags.map(tag => `#${tag}`).join(' ')
  }

  // アフィリエイトリンク追加
  if (schedule.posts.products?.affiliate_links?.[0]) {
    const shortCode = schedule.posts.products.affiliate_links[0].short_code
    content += `\n\n${process.env.SHORT_URL_DOMAIN || 'https://go.linktraq.com'}/${shortCode}`
  }

  return content
}

/**
 * SNSに投稿
 */
async function postToSNS(
  platform: string,
  content: string,
  integration: SNSIntegration,
  env: Env
): Promise<any> {
  if (platform === 'x') {
    return await postToX(content, integration)
  } else if (platform === 'instagram') {
    throw new Error('Instagram posting not implemented yet')
  } else if (platform === 'facebook') {
    throw new Error('Facebook posting not implemented yet')
  } else {
    throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * X (Twitter) に投稿
 */
async function postToX(
  content: string,
  integration: SNSIntegration
): Promise<any> {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: content,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`X API error: ${JSON.stringify(error)}`)
  }

  return await response.json()
}

/**
 * スケジュールステータス更新
 */
async function updateScheduleStatus(
  scheduleId: string,
  status: string,
  env: Env,
  publishedAt?: string
): Promise<void> {
  const updateData: any = { status }
  if (publishedAt) {
    updateData.published_at = publishedAt
  }

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/post_schedules?id=eq.${scheduleId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updateData),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to update schedule status: ${response.statusText}`)
  }
}

/**
 * 失敗記録
 */
async function recordFailure(
  message: PostScheduleMessage,
  error: any,
  isFinal: boolean,
  env: Env
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorType = getErrorType(errorMessage)

  // post_failures テーブルに記録
  const failureData = {
    post_schedule_id: message.schedule_id,
    user_id: '', // TODO: Get from schedule
    error_type: errorType,
    error_message: errorMessage,
    retry_count: message.retry_count,
    is_final_failure: isFinal ? 'true' : 'false',
    sns_platform: message.sns_platform,
    occurred_at: new Date().toISOString(),
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/post_failures`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(failureData),
  })

  // リトライスケジュール更新
  if (!isFinal && message.retry_count < RETRY_CONFIG.MAX_RETRIES) {
    const nextRetryDelay = RETRY_CONFIG.RETRY_DELAYS[message.retry_count]
    const nextRetryAt = new Date(Date.now() + nextRetryDelay * 1000).toISOString()

    await fetch(
      `${env.SUPABASE_URL}/rest/v1/post_schedules?id=eq.${message.schedule_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          retry_count: message.retry_count + 1,
          last_error: errorMessage,
          last_retry_at: new Date().toISOString(),
          next_retry_at: nextRetryAt,
          status: 'pending', // リトライのため pending に戻す
        }),
      }
    )
  } else if (isFinal) {
    // 最終失敗
    await updateScheduleStatus(message.schedule_id, 'failed', env)
  }
}

/**
 * エラータイプ判定
 */
function getErrorType(errorMessage: string): string {
  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return 'auth_error'
  } else if (errorMessage.includes('400')) {
    return 'validation_error'
  } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return 'network_error'
  } else {
    return 'api_error'
  }
}
