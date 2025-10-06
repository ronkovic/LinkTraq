'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Integration {
  id: string
  platform: string
  account_name: string | null
  status: string
  connected_at: string
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    // URLパラメータからメッセージを取得
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'twitter_connected') {
      setMessage({ type: 'success', text: 'Xアカウントが連携されました' })
    } else if (error) {
      setMessage({ type: 'error', text: 'SNS連携に失敗しました' })
    }

    fetchIntegrations()
  }, [searchParams])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      if (!response.ok) {
        throw new Error('Failed to fetch integrations')
      }
      const data = await response.json() as any
      setIntegrations(data.integrations || [])
    } catch (err) {
      console.error('Failed to fetch integrations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (platform: string) => {
    if (platform === 'twitter') {
      window.location.href = '/api/auth/twitter'
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('この連携を解除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      setMessage({ type: 'success', text: '連携を解除しました' })
      fetchIntegrations()
    } catch (err) {
      setMessage({ type: 'error', text: '連携の解除に失敗しました' })
    }
  }

  const getPlatformInfo = (platform: string) => {
    const platforms: Record<
      string,
      { name: string; icon: JSX.Element; description: string }
    > = {
      twitter: {
        name: 'X (Twitter)',
        icon: (
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        description: 'ツイートの投稿とスケジューリング',
      },
    }

    return platforms[platform] || { name: platform, icon: null, description: '' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  const twitterIntegration = integrations.find((i) => i.platform === 'twitter')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="mt-1 text-sm text-gray-600">
            SNSアカウント連携とアプリケーション設定
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-md p-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* SNS Integrations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              SNSアカウント連携
            </h2>

            <div className="space-y-6">
              {/* Twitter Integration */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-gray-900">
                      {getPlatformInfo('twitter').icon}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {getPlatformInfo('twitter').name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getPlatformInfo('twitter').description}
                      </p>
                      {twitterIntegration && (
                        <p className="mt-1 text-sm text-gray-600">
                          連携中: @{twitterIntegration.account_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {twitterIntegration ? (
                    <button
                      onClick={() => handleDisconnect(twitterIntegration.id)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      連携解除
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect('twitter')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      連携する
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                SNSアカウントを連携すると、LinkTraqから直接投稿できるようになります。
                連携情報は安全に暗号化されて保存されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
