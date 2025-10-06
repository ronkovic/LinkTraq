import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * ヘルスチェックエンドポイント
 * サーバーの状態を確認するための軽量エンドポイント
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LinkTraq API',
    version: '0.1.0',
  })
}
