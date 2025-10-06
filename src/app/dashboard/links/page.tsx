'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AffiliateLink {
  id: string
  short_code: string
  campaign_name: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  status: string
  click_count: number
  created_at: string
  products: {
    id: string
    name: string
    price: number
    currency: string
    image_url: string | null
  }
}

export default function LinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/affiliate-links')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch links')
      }
      const data = await response.json() as any
      setLinks(data.links || [])
    } catch (err: any) {
      setError(err.message || 'リンクの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (shortCode: string, linkId: string) => {
    const url = `${window.location.origin}/l/${shortCode}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(linkId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      alert('コピーに失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このリンクを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/affiliate-links/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete link')
      }

      fetchLinks()
    } catch (err: any) {
      alert(err.message || '削除に失敗しました')
    }
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
              <h1 className="text-2xl font-bold text-gray-900">アフィリエイトリンク管理</h1>
              <p className="mt-1 text-sm text-gray-600">
                短縮URLとトラッキングリンクを管理します
              </p>
            </div>
            <Link
              href="/dashboard/links/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新規作成
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

        {/* Links List */}
        {links.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">リンクがありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              最初のアフィリエイトリンクを作成しましょう
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/links/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                リンクを作成
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {links.map((link) => (
                <li key={link.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          {link.products.image_url && (
                            <img
                              src={link.products.image_url}
                              alt={link.products.name}
                              className="h-16 w-16 object-cover rounded mr-4"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {link.products.name}
                            </p>
                            {link.campaign_name && (
                              <p className="mt-1 text-sm text-gray-500">
                                キャンペーン: {link.campaign_name}
                              </p>
                            )}
                            <div className="mt-2 flex items-center">
                              <div className="flex-1 bg-gray-100 rounded px-3 py-2 text-sm font-mono text-gray-700">
                                {window.location.origin}/l/{link.short_code}
                              </div>
                              <button
                                onClick={() => handleCopy(link.short_code, link.id)}
                                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                {copiedId === link.id ? (
                                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span className="font-medium text-gray-900">
                                クリック数: {link.click_count}
                              </span>
                              <span className="mx-2">•</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                link.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {link.status === 'active' ? '有効' : '無効'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Link
                          href={`/dashboard/links/${link.id}/edit`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          削除
                        </button>
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
