'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  currency: string
}

export default function NewLinkPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([])

  const [formData, setFormData] = useState({
    product_id: '',
    campaign_name: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json() as any
      setProducts(data.products || [])
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました')
    } finally {
      setProductsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/affiliate-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json() as any
        throw new Error(data.error || '作成に失敗しました')
      }

      router.push('/dashboard/links')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (productsLoading) {
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

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">商品がありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              アフィリエイトリンクを作成する前に、まず商品を登録してください
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                商品を登録
              </Link>
            </div>
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
          <h1 className="text-2xl font-bold text-gray-900">アフィリエイトリンク作成</h1>
          <p className="mt-1 text-sm text-gray-600">
            商品のトラッキング用短縮URLを作成します
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/links"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← リンク一覧に戻る
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

            {/* 商品選択 */}
            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                商品 <span className="text-red-500">*</span>
              </label>
              <select
                name="product_id"
                id="product_id"
                required
                value={formData.product_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">商品を選択してください</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.currency} {product.price.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* キャンペーン名 */}
            <div>
              <label htmlFor="campaign_name" className="block text-sm font-medium text-gray-700">
                キャンペーン名
              </label>
              <input
                type="text"
                name="campaign_name"
                id="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="例: 春のセール2024"
              />
              <p className="mt-1 text-sm text-gray-500">
                リンクを識別するための名前（オプション）
              </p>
            </div>

            {/* UTMパラメータ */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                UTMパラメータ（トラッキング用）
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="utm_source" className="block text-sm font-medium text-gray-700">
                    UTM Source
                  </label>
                  <input
                    type="text"
                    name="utm_source"
                    id="utm_source"
                    value={formData.utm_source}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="例: twitter, facebook, instagram"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    トラフィックの参照元（SNSプラットフォーム名など）
                  </p>
                </div>

                <div>
                  <label htmlFor="utm_medium" className="block text-sm font-medium text-gray-700">
                    UTM Medium
                  </label>
                  <input
                    type="text"
                    name="utm_medium"
                    id="utm_medium"
                    value={formData.utm_medium}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="例: social, email, cpc"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    マーケティングメディア（ソーシャル、メールなど）
                  </p>
                </div>

                <div>
                  <label htmlFor="utm_campaign" className="block text-sm font-medium text-gray-700">
                    UTM Campaign
                  </label>
                  <input
                    type="text"
                    name="utm_campaign"
                    id="utm_campaign"
                    value={formData.utm_campaign}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="例: spring_sale_2024"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    キャンペーン名（URLパラメータ用）
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href="/dashboard/links"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
