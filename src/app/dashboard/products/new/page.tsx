'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'JPY',
    product_url: '',
    image_url: '',
    category: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      })

      if (!response.ok) {
        const data = await response.json() as any
        throw new Error(data.error || '登録に失敗しました')
      }

      router.push('/dashboard/products')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">商品登録</h1>
          <p className="mt-1 text-sm text-gray-600">
            アフィリエイトで紹介する商品情報を入力してください
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/products"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← 商品一覧に戻る
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

            {/* 商品名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                商品名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="例: ワイヤレスイヤホン XYZ-123"
              />
            </div>

            {/* 商品説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                商品説明
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="商品の特徴や魅力を入力してください"
              />
            </div>

            {/* 価格 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  価格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  placeholder="1980"
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  通貨
                </label>
                <select
                  name="currency"
                  id="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="JPY">JPY (日本円)</option>
                  <option value="USD">USD (米ドル)</option>
                  <option value="EUR">EUR (ユーロ)</option>
                </select>
              </div>
            </div>

            {/* 商品URL */}
            <div>
              <label htmlFor="product_url" className="block text-sm font-medium text-gray-700">
                商品URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="product_url"
                id="product_url"
                required
                value={formData.product_url}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="https://example.com/product/123"
              />
              <p className="mt-1 text-sm text-gray-500">
                アフィリエイトリンクの遷移先URLを入力してください
              </p>
            </div>

            {/* 画像URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                画像URL
              </label>
              <input
                type="url"
                name="image_url"
                id="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="https://example.com/images/product.jpg"
              />
              <p className="mt-1 text-sm text-gray-500">
                商品画像のURLを入力してください（オプション）
              </p>
            </div>

            {/* カテゴリ */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                カテゴリ
              </label>
              <input
                type="text"
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="例: 家電, ファッション, 美容"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href="/dashboard/products"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登録中...' : '登録'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
