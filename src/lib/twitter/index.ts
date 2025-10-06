/**
 * X (Twitter) API Integration
 * OAuth 2.0 User Context authentication
 */

interface Tweet {
  text: string
  media_ids?: string[]
}

interface TweetResponse {
  data: {
    id: string
    text: string
  }
}

/**
 * Post a tweet using user's access token
 */
export async function postTweet(
  accessToken: string,
  tweet: Tweet
): Promise<TweetResponse> {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweet),
  })

  if (!response.ok) {
    const error = await response.json() as any
    throw new Error(error.detail || error.title || 'Failed to post tweet')
  }

  return response.json() as any
}

/**
 * Upload media to Twitter
 */
export async function uploadMedia(
  accessToken: string,
  mediaUrl: string
): Promise<string> {
  // Note: Twitter API v2 doesn't support direct media upload yet
  // This is a placeholder for future implementation
  // In production, you would need to:
  // 1. Download the image from mediaUrl
  // 2. Upload to Twitter using v1.1 media/upload endpoint
  // 3. Return the media_id

  throw new Error('Media upload not yet implemented')
}

/**
 * Get user's Twitter profile
 */
export async function getTwitterProfile(accessToken: string) {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json() as any
    throw new Error(error.detail || 'Failed to get profile')
  }

  return response.json() as any
}

/**
 * Verify tweet content
 */
export function validateTweetContent(text: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Length check (280 characters for standard tweets)
  if (text.length === 0) {
    errors.push('ツイート内容を入力してください')
  }

  if (text.length > 280) {
    errors.push(`ツイートが長すぎます (${text.length}/280文字)`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
