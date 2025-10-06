import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LinkTraq - SNS Affiliate Management',
  description: 'SNSでアフィリエイトリンクを効果的に投稿・管理するためのWEBサービス',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
