'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Post {
  id: string
  platform: string
  content: string
  status: string
  posted_at: string | null
  scheduled_for: string | null
  error_message: string | null
  post_id: string | null
  affiliate_links: {
    id: string
    short_code: string
    products: {
      id: string
      name: string
      image_url: string | null
    }
  }
}

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch posts')
      }
      const data = await response.json() as any
      setPosts(data.posts || [])
    } catch (err: any) {
      setError(err.message || '投稿履歴の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      published: { color: 'bg-green-100 text-green-800', text: '投稿済み' },
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'スケジュール' },
      failed: { color: 'bg-red-100 text-red-800', text: '失敗' },
      draft: { color: 'bg-gray-100 text-gray-800', text: '下書き' },
    }

    const badge = badges[status] || badges.draft

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    )
  }

  const getPlatformIcon = (platform: string) => {
    if (platform === 'twitter') {
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">投稿履歴</h1>
              <p className="mt-1 text-sm text-gray-600">
                SNSへの投稿履歴とスケジュールを管理します
              </p>
            </div>
            <Link
              href="/dashboard/posts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              新規投稿
            </Link>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              投稿履歴がありません
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              最初の投稿を作成しましょう
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/posts/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                投稿を作成
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {posts.map((post) => (
                <li key={post.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          {post.affiliate_links.products.image_url && (
                            <img
                              src={post.affiliate_links.products.image_url}
                              alt={post.affiliate_links.products.name}
                              className="h-16 w-16 object-cover rounded mr-4"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {getPlatformIcon(post.platform)}
                              <p className="text-sm font-medium text-gray-900">
                                {post.affiliate_links.products.name}
                              </p>
                              {getStatusBadge(post.status)}
                            </div>
                            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                              {post.content}
                            </p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              {post.posted_at && (
                                <span>
                                  投稿日時:{' '}
                                  {new Date(post.posted_at).toLocaleString(
                                    'ja-JP'
                                  )}
                                </span>
                              )}
                              {post.scheduled_for && (
                                <span>
                                  予定日時:{' '}
                                  {new Date(post.scheduled_for).toLocaleString(
                                    'ja-JP'
                                  )}
                                </span>
                              )}
                            </div>
                            {post.error_message && (
                              <div className="mt-2 text-sm text-red-600">
                                エラー: {post.error_message}
                              </div>
                            )}
                            {post.post_id && (
                              <div className="mt-2">
                                <a
                                  href={`https://twitter.com/i/web/status/${post.post_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                  Xで表示 →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
