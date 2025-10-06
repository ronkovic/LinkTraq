# コンバージョン追跡機能 詳細設計

## 概要

アフィリエイトリンク経由の実際の購入(コンバージョン)を追跡し、収益を可視化する機能。

**重要**: クリック追跡は社内で完結するが、コンバージョン追跡はASP側のデータを取得する必要がある。

---

## データベース設計

### conversions テーブル

```sql
-- コンバージョン追跡
CREATE TABLE conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id uuid REFERENCES affiliate_links(id) NOT NULL,
  click_id uuid REFERENCES link_clicks(id), -- 紐づくクリック (nullable)
  provider text NOT NULL, -- "amazon", "rakuten", "a8"
  order_id text NOT NULL, -- ASP側の注文ID
  amount decimal(10, 2), -- 購入金額
  commission decimal(10, 2) NOT NULL, -- 報酬額
  status text NOT NULL, -- 'pending', 'approved', 'rejected', 'cancelled'
  converted_at timestamptz NOT NULL, -- コンバージョン発生日時
  approved_at timestamptz, -- 承認日時 (nullable)
  rejected_at timestamptz, -- 却下日時 (nullable)
  rejection_reason text, -- 却下理由
  import_source text NOT NULL, -- 'csv_manual', 'api_amazon', 'api_rakuten', 'api_a8'
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider, order_id) -- 重複インポート防止
);

-- インデックス
CREATE INDEX idx_conversions_user_id ON conversions(affiliate_link_id);
CREATE INDEX idx_conversions_provider ON conversions(provider);
CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_conversions_converted_at ON conversions(converted_at);
CREATE INDEX idx_conversions_order_id ON conversions(provider, order_id);

-- RLS設定
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversions"
  ON conversions FOR SELECT
  USING (
    affiliate_link_id IN (
      SELECT id FROM affiliate_links
      WHERE provider_id IN (
        SELECT id FROM affiliate_providers WHERE user_id = auth.uid()
      )
    )
  );

-- 挿入はサーバーサイドのみ (Service Role)
CREATE POLICY "Service role can insert conversions"
  ON conversions FOR INSERT
  WITH CHECK (true); -- Workers (Service Role) のみ許可
```

### conversion_import_logs テーブル (インポート履歴)

```sql
CREATE TABLE conversion_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  provider text NOT NULL,
  import_source text NOT NULL, -- 'csv_manual', 'api_auto'
  file_name text, -- CSV ファイル名 (manual時)
  records_total integer NOT NULL, -- 総レコード数
  records_imported integer NOT NULL, -- インポート成功数
  records_skipped integer NOT NULL, -- スキップ数 (重複等)
  records_failed integer NOT NULL, -- 失敗数
  error_messages jsonb, -- エラーメッセージリスト
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at timestamptz DEFAULT now()
);

-- RLS設定
ALTER TABLE conversion_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import logs"
  ON conversion_import_logs FOR SELECT
  USING (auth.uid() = user_id);
```

---

## ASP別のデータ取込方法

### 1. Amazon Associates

#### 特徴
- **API**: Product Advertising API (PA-API 5.0)
- **制限**: API利用には売上実績が必要 (初期は利用不可)
- **データ取得**: レポートページから手動ダウンロード

#### MVP実装 (手動CSV取込)

**CSVフォーマット例** (Amazonレポート):
```csv
Date,Order ID,Product,Quantity,Earnings,Status
2025-01-15,123-4567890-1234567,商品A,1,100.50,Approved
2025-01-16,123-4567890-1234568,商品B,2,200.00,Pending
```

**インポート処理**:
```typescript
// lib/conversions/amazon-csv.ts
export async function importAmazonCSV(
  userId: string,
  csvFile: File
): Promise<ImportResult> {
  const records = await parseCSV(csvFile)

  const results = {
    total: records.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: []
  }

  for (const record of records) {
    try {
      // アフィリエイトリンクを特定 (Order IDから逆引き)
      const affiliateLink = await findAffiliateLink(
        userId,
        'amazon',
        record['Order ID']
      )

      if (!affiliateLink) {
        results.skipped++
        results.errors.push({
          orderId: record['Order ID'],
          error: 'アフィリエイトリンクが見つかりません'
        })
        continue
      }

      // コンバージョン作成
      await createConversion({
        affiliate_link_id: affiliateLink.id,
        provider: 'amazon',
        order_id: record['Order ID'],
        amount: parseFloat(record['Earnings']) / 0.08, // 推定 (報酬率8%と仮定)
        commission: parseFloat(record['Earnings']),
        status: record['Status'].toLowerCase(),
        converted_at: new Date(record['Date']),
        import_source: 'csv_manual'
      })

      results.imported++
    } catch (error) {
      results.failed++
      results.errors.push({
        orderId: record['Order ID'],
        error: error.message
      })
    }
  }

  return results
}
```

#### Phase 2 (API自動同期)

**前提条件**: 売上実績が必要 (通常3件以上)

**実装** (Cloudflare Cron Triggers):
```typescript
// workers/cron/sync-amazon-conversions.ts
export async function syncAmazonConversions() {
  const users = await getUsersWithAmazonAPI()

  for (const user of users) {
    try {
      // PA-API 5.0 でレポート取得
      const apiKey = await getAmazonAPIKey(user.id)
      const conversions = await fetchAmazonConversions(apiKey)

      await bulkImportConversions(user.id, conversions, 'api_amazon')
    } catch (error) {
      console.error(`Amazon sync failed for user ${user.id}:`, error)
    }
  }
}
```

**Cron設定**:
```toml
# wrangler.toml
[triggers]
crons = ["0 2 * * *"] # 毎日AM 2:00
```

---

### 2. 楽天アフィリエイト

#### 特徴
- **API**: 楽天アフィリエイトAPI (無料、申請不要)
- **取得可能**: クリック数、コンバージョン数、報酬額
- **更新頻度**: 1日1回推奨

#### API仕様

**エンドポイント**:
```
https://api.rakuten.co.jp/rakuten/affiliate/v1/report
```

**パラメータ**:
```typescript
{
  affiliateId: string,     // アフィリエイトID
  applicationId: string,   // アプリID
  dateFrom: string,        // YYYYMMDD
  dateTo: string,          // YYYYMMDD
}
```

**レスポンス例**:
```json
{
  "reports": [
    {
      "date": "2025-01-15",
      "click": 100,
      "conversion": 5,
      "sales": 50000,
      "commission": 2500,
      "orderNumber": "123456789"
    }
  ]
}
```

#### 実装 (MVP)

**CSV手動取込**:
```typescript
// lib/conversions/rakuten-csv.ts
export async function importRakutenCSV(
  userId: string,
  csvFile: File
): Promise<ImportResult> {
  // Amazon同様の処理
}
```

**CSVフォーマット**:
```csv
Date,Order Number,Product,Sales,Commission,Status
2025-01-15,123456789,商品名,10000,500,Approved
```

#### Phase 2 (API自動同期)

```typescript
// workers/cron/sync-rakuten-conversions.ts
export async function syncRakutenConversions() {
  const users = await getUsersWithRakutenAPI()

  for (const user of users) {
    try {
      const apiSettings = await getRakutenAPISettings(user.id)

      // 過去7日間のデータ取得
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const dateTo = new Date()

      const response = await fetch(
        `https://api.rakuten.co.jp/rakuten/affiliate/v1/report?` +
        `affiliateId=${apiSettings.affiliate_id}&` +
        `applicationId=${apiSettings.application_id}&` +
        `dateFrom=${format(dateFrom, 'yyyyMMdd')}&` +
        `dateTo=${format(dateTo, 'yyyyMMdd')}`
      )

      const data = await response.json()

      for (const report of data.reports) {
        // コンバージョン作成 (重複チェック含む)
        await upsertConversion({
          provider: 'rakuten',
          order_id: report.orderNumber,
          amount: report.sales,
          commission: report.commission,
          status: 'approved', // 楽天は承認済みのみ返す
          converted_at: new Date(report.date),
          import_source: 'api_rakuten'
        })
      }
    } catch (error) {
      console.error(`Rakuten sync failed for user ${user.id}:`, error)
    }
  }
}
```

---

### 3. A8.net

#### 特徴
- **API**: レポートAPI (要申請)
- **取得可能**: 成果データ、承認状況
- **更新頻度**: 1日1回推奨

#### API仕様

**エンドポイント**:
```
https://api.a8.net/reports/conversions
```

**認証**: OAuth 2.0

**レスポンス例**:
```json
{
  "conversions": [
    {
      "conversionId": "123456",
      "orderId": "order-abc123",
      "productName": "商品名",
      "amount": 5000,
      "commission": 250,
      "status": "pending",
      "convertedAt": "2025-01-15T10:00:00Z",
      "approvedAt": null
    }
  ]
}
```

#### 実装 (MVP)

**CSV手動取込**:
```typescript
// lib/conversions/a8-csv.ts
export async function importA8CSV(
  userId: string,
  csvFile: File
): Promise<ImportResult> {
  // Amazon同様の処理
}
```

**CSVフォーマット**:
```csv
Date,Conversion ID,Order ID,Product,Amount,Commission,Status
2025-01-15,123456,order-abc123,商品名,5000,250,Pending
```

#### Phase 2 (API自動同期)

```typescript
// workers/cron/sync-a8-conversions.ts
export async function syncA8Conversions() {
  const users = await getUsersWithA8API()

  for (const user of users) {
    try {
      const apiSettings = await getA8APISettings(user.id)

      // OAuth認証
      const accessToken = await refreshA8AccessToken(apiSettings)

      // 過去7日間のデータ取得
      const response = await fetch(
        'https://api.a8.net/reports/conversions?' +
        `dateFrom=${format(dateFrom, 'yyyy-MM-dd')}&` +
        `dateTo=${format(dateTo, 'yyyy-MM-dd')}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const data = await response.json()

      for (const conversion of data.conversions) {
        await upsertConversion({
          provider: 'a8',
          order_id: conversion.orderId,
          amount: conversion.amount,
          commission: conversion.commission,
          status: conversion.status.toLowerCase(),
          converted_at: new Date(conversion.convertedAt),
          approved_at: conversion.approvedAt ? new Date(conversion.approvedAt) : null,
          import_source: 'api_a8'
        })
      }
    } catch (error) {
      console.error(`A8 sync failed for user ${user.id}:`, error)
    }
  }
}
```

---

## MVP実装: CSV手動取込機能

### UI設計

```tsx
// app/conversions/import/page.tsx
export default function ConversionImportPage() {
  const [provider, setProvider] = useState<'amazon' | 'rakuten' | 'a8'>('amazon')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async () => {
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file!)
      formData.append('provider', provider)

      const response = await fetch('/api/conversions/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setResult(result)
    } catch (error) {
      alert('インポート失敗: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">コンバージョンデータ取込</h1>

      <Card>
        <CardHeader>
          <CardTitle>CSV手動取込</CardTitle>
          <CardDescription>
            ASP管理画面からダウンロードしたCSVファイルをアップロードしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ASP選択 */}
            <div>
              <label className="block text-sm font-medium mb-2">ASP</label>
              <Select value={provider} onValueChange={setProvider}>
                <option value="amazon">Amazon Associates</option>
                <option value="rakuten">楽天アフィリエイト</option>
                <option value="a8">A8.net</option>
              </Select>
            </div>

            {/* ファイル選択 */}
            <div>
              <label className="block text-sm font-medium mb-2">CSVファイル</label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* フォーマットガイド */}
            <Alert>
              <AlertTitle>CSVフォーマット</AlertTitle>
              <AlertDescription>
                {provider === 'amazon' && (
                  <pre className="text-xs mt-2">
{`Date,Order ID,Product,Earnings,Status
2025-01-15,123-456...,商品名,100.50,Approved`}
                  </pre>
                )}
                {provider === 'rakuten' && (
                  <pre className="text-xs mt-2">
{`Date,Order Number,Product,Commission,Status
2025-01-15,123456789,商品名,500,Approved`}
                  </pre>
                )}
                {provider === 'a8' && (
                  <pre className="text-xs mt-2">
{`Date,Order ID,Product,Commission,Status
2025-01-15,order-abc123,商品名,250,Pending`}
                  </pre>
                )}
              </AlertDescription>
            </Alert>

            {/* インポートボタン */}
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? 'インポート中...' : 'インポート'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 結果表示 */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>インポート結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>総レコード数: {result.total}</p>
              <p className="text-green-600">✓ 成功: {result.imported}</p>
              <p className="text-yellow-600">⊘ スキップ: {result.skipped}</p>
              <p className="text-red-600">✗ 失敗: {result.failed}</p>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">エラー詳細:</p>
                  <div className="bg-red-50 p-3 rounded text-sm">
                    {result.errors.map((err, i) => (
                      <div key={i} className="mb-1">
                        Order ID: {err.orderId} - {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* インポート履歴 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>過去のインポート履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportLogsTable />
        </CardContent>
      </Card>
    </div>
  )
}
```

### API実装

```typescript
// app/api/conversions/import/route.ts
import { NextRequest } from 'next/server'
import { importAmazonCSV } from '@/lib/conversions/amazon-csv'
import { importRakutenCSV } from '@/lib/conversions/rakuten-csv'
import { importA8CSV } from '@/lib/conversions/a8-csv'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const provider = formData.get('provider') as string
  const userId = req.headers.get('x-user-id')! // 認証ミドルウェアから

  // インポートログ作成
  const logId = await createImportLog({
    user_id: userId,
    provider,
    import_source: 'csv_manual',
    file_name: file.name,
    status: 'processing'
  })

  try {
    let result: ImportResult

    // ASP別処理
    switch (provider) {
      case 'amazon':
        result = await importAmazonCSV(userId, file)
        break
      case 'rakuten':
        result = await importRakutenCSV(userId, file)
        break
      case 'a8':
        result = await importA8CSV(userId, file)
        break
      default:
        throw new Error('Invalid provider')
    }

    // ログ更新
    await updateImportLog(logId, {
      records_total: result.total,
      records_imported: result.imported,
      records_skipped: result.skipped,
      records_failed: result.failed,
      error_messages: result.errors,
      status: 'completed',
      completed_at: new Date()
    })

    return Response.json(result)
  } catch (error) {
    // ログ更新 (失敗)
    await updateImportLog(logId, {
      status: 'failed',
      error_messages: [{ error: error.message }],
      completed_at: new Date()
    })

    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

## Phase 2: API自動同期

### データベース拡張

```sql
-- ASP API設定テーブル
CREATE TABLE asp_api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  provider text NOT NULL, -- 'amazon', 'rakuten', 'a8'
  api_key text, -- 暗号化
  api_secret text, -- 暗号化
  access_token text, -- 暗号化 (OAuth)
  refresh_token text, -- 暗号化 (OAuth)
  expires_at timestamptz,
  auto_sync_enabled boolean DEFAULT false,
  sync_frequency text DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_synced_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- RLS設定
ALTER TABLE asp_api_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ASP API settings"
  ON asp_api_settings FOR ALL
  USING (auth.uid() = user_id);
```

### Cron統合

```typescript
// workers/cron/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const hour = new Date().getUTCHours()

    // 毎日 AM 2:00 UTC に実行
    if (hour === 2) {
      await syncAmazonConversions()
      await syncRakutenConversions()
      await syncA8Conversions()
    }
  }
}
```

### 同期設定UI

```tsx
// app/settings/asp-sync/page.tsx
export default function ASPSyncSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ASP API自動同期設定</h1>

      {['amazon', 'rakuten', 'a8'].map(provider => (
        <Card key={provider} className="mb-4">
          <CardHeader>
            <CardTitle>{providerNames[provider]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* API Key入力 */}
              <div>
                <label>API Key</label>
                <Input type="password" />
              </div>

              {/* 自動同期ON/OFF */}
              <div className="flex items-center gap-2">
                <Switch id={`sync-${provider}`} />
                <label htmlFor={`sync-${provider}`}>自動同期を有効化</label>
              </div>

              {/* 同期頻度 */}
              <div>
                <label>同期頻度</label>
                <Select>
                  <option value="daily">1日1回</option>
                  <option value="weekly">1週間に1回</option>
                </Select>
              </div>

              {/* 最終同期日時 */}
              <p className="text-sm text-gray-600">
                最終同期: {lastSyncedAt || 'まだ同期されていません'}
              </p>

              <Button>保存</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

## 収益ダッシュボード

### 統合表示

```tsx
// app/dashboard/revenue/page.tsx
export default function RevenueDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">収益ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">総クリック数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClicks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">総コンバージョン数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConversions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">総報酬 (承認済み)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ¥{approvedCommission.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">コンバージョン率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((totalConversions / totalClicks) * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 収益グラフ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>月次収益推移</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueData} />
        </CardContent>
      </Card>

      {/* ASP別内訳 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ASP別収益</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th>ASP</th>
                <th>コンバージョン数</th>
                <th>承認済み報酬</th>
                <th>保留中</th>
              </tr>
            </thead>
            <tbody>
              {aspBreakdown.map(asp => (
                <tr key={asp.provider}>
                  <td>{asp.name}</td>
                  <td>{asp.conversions}</td>
                  <td className="text-green-600">
                    ¥{asp.approvedCommission.toLocaleString()}
                  </td>
                  <td className="text-yellow-600">
                    ¥{asp.pendingCommission.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 最近のコンバージョン */}
      <Card>
        <CardHeader>
          <CardTitle>最近のコンバージョン</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversionsTable conversions={recentConversions} />
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## セキュリティ考慮事項

### API Key管理

```sql
-- Supabase Vault使用
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- asp_api_settings のカラムを暗号化
-- Supabase Dashboardで自動暗号化設定
```

### RLS設定

```sql
-- すべてのコンバージョンデータは所有者のみ閲覧可能
-- インポート処理はService Role経由
```

---

## 開発フェーズ

### Phase 1 (MVP) - 手動取込
- [ ] conversionsテーブル作成
- [ ] conversion_import_logsテーブル作成
- [ ] CSV解析ロジック (Amazon, 楽天, A8)
- [ ] インポートUI
- [ ] インポート履歴表示
- [ ] 収益ダッシュボード (基本)

### Phase 2 - API自動同期
- [ ] asp_api_settingsテーブル作成
- [ ] 楽天API統合
- [ ] A8.net API統合
- [ ] Cron自動同期実装
- [ ] API設定UI
- [ ] 同期エラー通知

### Phase 3 - Amazon PA-API
- [ ] Amazon PA-API統合 (売上実績後)
- [ ] 高度な収益分析
- [ ] 予測機能

---

## コスト影響

### データベースストレージ
- conversions: 約1KB/レコード
- 月間1,000コンバージョン = 1MB
- 年間 = 12MB (無視できるレベル)

### API呼び出し
- 楽天API: 無料
- A8.net API: 無料
- Amazon PA-API: 無料 (売上あれば)

**追加コスト: $0/月**

---

**最終更新**: 2025-10-03
**ステータス**: 設計完了、実装待ち
**次のステップ**: PROJECT_PLAN.md とREVIEW_ITEMS.md を更新
