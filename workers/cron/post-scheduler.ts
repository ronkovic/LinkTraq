/**
 * Cloudflare Cron Worker - 投稿スケジューラー
 * 定期的にスケジュールされた投稿をチェックしてQueueに送信
 */

/// <reference types="@cloudflare/workers-types" />

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  POST_QUEUE: Queue
}

interface PostSchedule {
  id: string
  post_id: string
  scheduled_at: string
  sns_platform: 'x' | 'instagram' | 'facebook'
  status: string
  retry_count: number
  next_retry_at: string | null
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Post scheduler cron triggered:', new Date(event.scheduledTime).toISOString())

    try {
      // 実行すべきスケジュールを取得
      const schedules = await getPendingSchedules(env)
      console.log(`Found ${schedules.length} pending schedules`)

      // Queueに送信
      for (const schedule of schedules) {
        await env.POST_QUEUE.send({
          schedule_id: schedule.id,
          post_id: schedule.post_id,
          sns_platform: schedule.sns_platform,
          retry_count: schedule.retry_count,
        })

        console.log(`Queued schedule: ${schedule.id}`)
      }

      console.log(`Successfully queued ${schedules.length} schedules`)
    } catch (error) {
      console.error('Cron execution error:', error)
      throw error
    }
  },
}

/**
 * 実行すべきスケジュールを取得
 * - ステータスが pending
 * - scheduled_at が現在時刻以前
 * - または next_retry_at が現在時刻以前
 */
async function getPendingSchedules(env: Env): Promise<PostSchedule[]> {
  const now = new Date().toISOString()

  // Supabaseから取得
  // 条件: (status = 'pending') AND (scheduled_at <= now OR next_retry_at <= now)
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/post_schedules?status=eq.pending&or=(scheduled_at.lte.${now},next_retry_at.lte.${now})&select=id,post_id,scheduled_at,sns_platform,status,retry_count,next_retry_at`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch pending schedules: ${response.statusText}`)
  }

  const schedules = await response.json()
  return schedules as PostSchedule[]
}
