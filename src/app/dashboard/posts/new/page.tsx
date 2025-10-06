'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AffiliateLink {
  id: string
  short_code: string
  campaign_name: string | null
  products: {
    id: string
    name: string
  }
}

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [linksLoading, setLinksLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [links, setLinks] = useState<AffiliateLink[]>([])

  const [formData, setFormData] = useState({
    affiliate_link_id: '',
    platform: 'twitter',
    content: '',
    scheduled_for: '',
  })

  const [charCount, setCharCount] = useState(0)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    fetchLinks()
  }, [])

  useEffect(() => {
    // 短縮URL含めた文字数カウント
    const urlLength = previewUrl ? previewUrl.length + 2 : 0 // \n\n + URL
    setCharCount(formData.content.length + urlLength)
  }, [formData.content, previewUrl])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/affiliate-links')
      if (!response.ok) {
        throw new Error('Failed to fetch links')
      }
      const data = await response.json() as any
      setLinks(data.links || [])
    } catch (err: any) {
      setError(err.message || 'リンクの取得に失敗しました')
    } finally {
      setLinksLoading(false)
    }
  }

  const handleLinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const linkId = e.target.value
    setFormData({ ...formData, affiliate_link_id: linkId })

    if (linkId) {
      const selectedLink = links.find((l) => l.id === linkId)
      if (selectedLink) {
        const url = `${window.location.origin}/l/${selectedLink.short_code}`
        setPreviewUrl(url)
      }
    } else {
      setPreviewUrl('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json() as any
        throw new Error(data.error || '投稿に失敗しました')
      }

      const data = await response.json() as any

      if (data.scheduled) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/posts')
          router.refresh()
        }, 2000)
      } else {
        router.push('/dashboard/posts')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || '投稿に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (linksLoading) {
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

  if (links.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              アフィリエイトリンクがありません
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              投稿する前に、まずアフィリエイトリンクを作成してください
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/links/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                リンクを作成
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              投稿をスケジュールしました
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              指定した日時に自動的に投稿されます
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">SNS投稿</h1>
          <p className="mt-1 text-sm text-gray-600">
            アフィリエイトリンク付きの投稿を作成します
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/posts"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← 投稿履歴に戻る
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* プラットフォーム選択 */}
            <div>
              <label
                htmlFor="platform"
                className="block text-sm font-medium text-gray-700"
              >
                プラットフォーム <span className="text-red-500">*</span>
              </label>
              <select
                name="platform"
                id="platform"
                required
                value={formData.platform}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="twitter">X (Twitter)</option>
              </select>
            </div>

            {/* アフィリエイトリンク選択 */}
            <div>
              <label
                htmlFor="affiliate_link_id"
                className="block text-sm font-medium text-gray-700"
              >
                アフィリエイトリンク <span className="text-red-500">*</span>
              </label>
              <select
                name="affiliate_link_id"
                id="affiliate_link_id"
                required
                value={formData.affiliate_link_id}
                onChange={handleLinkChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">リンクを選択してください</option>
                {links.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.products.name}
                    {link.campaign_name && ` - ${link.campaign_name}`}
                  </option>
                ))}
              </select>
              {previewUrl && (
                <p className="mt-2 text-sm text-gray-500">
                  短縮URL: <span className="font-mono">{previewUrl}</span>
                </p>
              )}
            </div>

            {/* 投稿内容 */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                投稿内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                id="content"
                rows={6}
                required
                value={formData.content}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="商品の紹介文を入力してください"
              />
              <div className="mt-1 flex justify-between text-sm">
                <p className="text-gray-500">※ 短縮URLは自動的に追加されます</p>
                <p
                  className={`font-medium ${
                    charCount > 280 ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  {charCount}/280
                </p>
              </div>
            </div>

            {/* スケジュール投稿 */}
            <div>
              <label
                htmlFor="scheduled_for"
                className="block text-sm font-medium text-gray-700"
              >
                投稿日時（オプション）
              </label>
              <input
                type="datetime-local"
                name="scheduled_for"
                id="scheduled_for"
                value={formData.scheduled_for}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
              <p className="mt-1 text-sm text-gray-500">
                指定しない場合は即座に投稿されます
              </p>
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    投稿するには、SNSアカウントとの連携が必要です。まだ連携していない場合は、設定ページから連携してください。
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href="/dashboard/posts"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading || charCount > 280}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? '投稿中...'
                  : formData.scheduled_for
                  ? 'スケジュール'
                  : '投稿'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
