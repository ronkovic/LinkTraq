import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* ヘッダー */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">
            LinkTraq
          </h1>
          <p className="text-2xl text-gray-600">
            SNSアフィリエイト管理サービス
          </p>
          <p className="text-lg text-gray-500">
            SNSでアフィリエイトリンクを効果的に投稿・管理
          </p>
        </div>

        {/* 機能紹介 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">アナリティクス</h3>
            <p className="text-gray-600">
              投稿のパフォーマンスを追跡し、ROIを最大化
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold mb-2">スケジューリング</h3>
            <p className="text-gray-600">
              最適なタイミングで自動投稿
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI生成</h3>
            <p className="text-gray-600">
              AIが魅力的な投稿文を自動生成
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 space-y-4">
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            ダッシュボードへ
          </Link>
          <div className="text-sm text-gray-500">
            ※ 現在Phase 1開発中 - 認証機能は次のステップで実装予定
          </div>
        </div>

        {/* ステータス */}
        <div className="mt-16 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            ✅ Phase 1完了: API実装、スケジューリング、AI統合、テスト
          </p>
          <p className="text-sm text-blue-600 mt-1">
            🔄 Phase 2進行中: 認証・フロントエンド実装
          </p>
        </div>
      </div>
    </main>
  )
}
