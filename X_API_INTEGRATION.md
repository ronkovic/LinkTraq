# X API 統合設計 (ユーザーごとのAPI Key管理)

## 概要

サービス側でX APIコストを負担せず、**ユーザーが自分のX API Key**を登録・管理する方式。

---

## ユーザーフロー

### 1. 初回登録時

```
ユーザー登録 (LinkTraq)
↓
ダッシュボード表示
↓
「X APIキーを設定してください」通知
↓
設定画面へ誘導
↓
X Developer Portal へのリンク表示
  1. https://developer.twitter.com/en/portal/dashboard
  2. プロジェクト作成
  3. Free プラン申請 ($0)
  4. API Keys 取得
     - API Key
     - API Key Secret
     - Bearer Token
↓
LinkTraq に API Keys 入力
↓
検証 & 暗号化保存 (Supabase Vault)
↓
投稿可能 (1,500投稿/月)
```

---

## データベース設計

### x_api_settings テーブル

```sql
CREATE TABLE x_api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) UNIQUE NOT NULL,
  api_key text NOT NULL, -- 暗号化 (Supabase Vault)
  api_secret text NOT NULL, -- 暗号化
  bearer_token text NOT NULL, -- 暗号化
  api_key_last_4 text NOT NULL, -- 表示用 "••••1234"
  plan_type text NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro'
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS設定
ALTER TABLE x_api_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own X API settings"
  ON x_api_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own X API settings"
  ON x_api_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own X API settings"
  ON x_api_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

### x_api_usage テーブル

```sql
CREATE TABLE x_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  month text NOT NULL, -- "2025-01"
  posts_count integer DEFAULT 0,
  plan_limit integer NOT NULL, -- 1500 (Free), 3000 (Basic), -1 (Pro)
  last_reset_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- RLS設定
ALTER TABLE x_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON x_api_usage FOR SELECT
  USING (auth.uid() = user_id);
```

### x_api_alerts テーブル

```sql
CREATE TABLE x_api_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  alert_type text NOT NULL, -- 'warning_75', 'warning_90', 'limit_reached'
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS設定
ALTER TABLE x_api_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON x_api_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON x_api_alerts FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 実装ロジック

### API Key 検証

```typescript
// lib/x-api/verify.ts
export async function verifyXApiKey(
  apiKey: string,
  apiSecret: string,
  bearerToken: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Bearer Token で認証テスト
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    })

    if (!response.ok) {
      return { valid: false, error: 'Invalid Bearer Token' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}
```

### API Key 保存

```typescript
// lib/x-api/save.ts
import { createClient } from '@supabase/supabase-js'

export async function saveXApiKeys(
  userId: string,
  apiKey: string,
  apiSecret: string,
  bearerToken: string,
  planType: 'free' | 'basic' | 'pro'
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // サーバー側のみ
  )

  // 検証
  const verification = await verifyXApiKey(apiKey, apiSecret, bearerToken)
  if (!verification.valid) {
    throw new Error(verification.error)
  }

  // 末尾4文字
  const apiKeyLast4 = apiKey.slice(-4)

  // Vault に暗号化保存
  const { data, error } = await supabase
    .from('x_api_settings')
    .upsert({
      user_id: userId,
      api_key: apiKey, // Supabase Vault で自動暗号化
      api_secret: apiSecret,
      bearer_token: bearerToken,
      api_key_last_4: apiKeyLast4,
      plan_type: planType,
      verified_at: new Date().toISOString(),
    })

  if (error) throw error

  // 使用量レコード作成
  const currentMonth = new Date().toISOString().slice(0, 7) // "2025-01"
  const planLimits = {
    free: 1500,
    basic: 3000,
    pro: -1, // 無制限
  }

  await supabase
    .from('x_api_usage')
    .upsert({
      user_id: userId,
      month: currentMonth,
      posts_count: 0,
      plan_limit: planLimits[planType],
    })

  return data
}
```

### 使用量チェック

```typescript
// lib/x-api/usage.ts
export async function checkUsageLimit(userId: string): Promise<void> {
  const supabase = createClient(...)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: usage } = await supabase
    .from('x_api_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .single()

  if (!usage) {
    throw new Error('使用量データが見つかりません')
  }

  const percentage = usage.posts_count / usage.plan_limit

  // 75%警告
  if (percentage >= 0.75 && percentage < 0.90) {
    await sendAlert(userId, 'warning_75', `今月の投稿数が75%に達しました (${usage.posts_count}/${usage.plan_limit})`)
  }

  // 90%警告
  if (percentage >= 0.90 && percentage < 1.0) {
    await sendAlert(userId, 'warning_90', `今月の投稿数が90%に達しました (${usage.posts_count}/${usage.plan_limit})`)
  }

  // 100%制限
  if (usage.plan_limit !== -1 && usage.posts_count >= usage.plan_limit) {
    await sendAlert(userId, 'limit_reached', '今月の投稿上限に達しました')
    throw new Error('月次投稿制限に達しました。翌月1日までお待ちください。')
  }
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = createClient(...)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { error } = await supabase.rpc('increment_x_api_usage', {
    p_user_id: userId,
    p_month: currentMonth,
  })

  if (error) throw error
}

// PostgreSQL関数
/*
CREATE OR REPLACE FUNCTION increment_x_api_usage(
  p_user_id uuid,
  p_month text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE x_api_usage
  SET posts_count = posts_count + 1
  WHERE user_id = p_user_id AND month = p_month;
END;
$$;
*/
```

### アラート送信

```typescript
// lib/x-api/alerts.ts
async function sendAlert(
  userId: string,
  alertType: 'warning_75' | 'warning_90' | 'limit_reached',
  message: string
) {
  const supabase = createClient(...)

  // アラートが既に送信済みか確認
  const { data: existing } = await supabase
    .from('x_api_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('alert_type', alertType)
    .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24時間以内
    .single()

  if (existing) return // 既に送信済み

  // アラート保存
  await supabase
    .from('x_api_alerts')
    .insert({
      user_id: userId,
      alert_type: alertType,
      message,
    })

  // TODO: メール通知、アプリ内通知
}
```

---

## UI設計

### X API設定画面

```tsx
// app/settings/x-api/page.tsx
export default function XApiSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">X (Twitter) API 設定</h1>

      {/* 未設定の場合 */}
      {!hasApiKey && (
        <Card>
          <CardHeader>
            <CardTitle>X API Keyを設定してください</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Xへの投稿にはX API Keyが必要です。以下の手順で取得してください。
            </p>

            <ol className="list-decimal list-inside space-y-2 mb-6">
              <li>
                <a href="https://developer.twitter.com/en/portal/dashboard"
                   target="_blank"
                   className="text-blue-600 underline">
                  X Developer Portal
                </a> にアクセス
              </li>
              <li>プロジェクトを作成</li>
              <li>Free プランを選択 ($0/月)</li>
              <li>API Keys を取得</li>
            </ol>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label>API Key</label>
                  <Input type="text" name="apiKey" required />
                </div>
                <div>
                  <label>API Key Secret</label>
                  <Input type="password" name="apiSecret" required />
                </div>
                <div>
                  <label>Bearer Token</label>
                  <Input type="password" name="bearerToken" required />
                </div>
                <div>
                  <label>プラン</label>
                  <Select name="planType">
                    <option value="free">Free (1,500投稿/月)</option>
                    <option value="basic">Basic (3,000投稿/月 - $100/月)</option>
                    <option value="pro">Pro (無制限 - $5,000/月)</option>
                  </Select>
                </div>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 設定済みの場合 */}
      {hasApiKey && (
        <Card>
          <CardHeader>
            <CardTitle>X API 接続状態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" />
                <span>接続済み ({planType} プラン)</span>
              </div>

              <div>
                <p className="text-sm text-gray-600">API Key</p>
                <p className="font-mono">••••••••{apiKeyLast4}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">今月の使用量</p>
                <Progress value={usagePercentage} />
                <p className="text-sm mt-1">
                  {postsCount} / {planLimit} 投稿 ({usagePercentage}%)
                </p>
              </div>

              {usagePercentage >= 75 && (
                <Alert variant="warning">
                  <AlertTitle>使用量が{usagePercentage}%に達しました</AlertTitle>
                  <AlertDescription>
                    {usagePercentage >= 90
                      ? 'あと数投稿で上限です。Basic プランへのアップグレードを検討してください。'
                      : '今月の使用量が多くなっています。'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEdit(true)}>
                  変更
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  削除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* プラン比較 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>X API プラン比較</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th>プラン</th>
                <th>月額</th>
                <th>投稿数</th>
                <th>アナリティクス</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Free</td>
                <td>$0</td>
                <td>1,500/月</td>
                <td>なし*</td>
              </tr>
              <tr>
                <td>Basic</td>
                <td>$100</td>
                <td>3,000/月</td>
                <td>基本</td>
              </tr>
              <tr>
                <td>Pro</td>
                <td>$5,000</td>
                <td>無制限</td>
                <td>フル</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-gray-600 mt-2">
            * LinkTraq独自のクリック追跡は全プランで利用可能
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## セキュリティ

### Supabase Vault 使用

```sql
-- Vault有効化
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- 暗号化キー作成
SELECT pgsodium.create_key();

-- x_api_settings のカラムを暗号化
-- Supabase Dashboard → Database → Extensions → pgsodium
-- で自動的に暗号化される
```

### クライアント側で絶対に露出させない

- ❌ フロントエンドでAPI Key復号化
- ❌ ブラウザのLocalStorageに保存
- ✅ サーバーサイド (Cloudflare Workers) でのみ復号化
- ✅ API経由で投稿処理

---

## 投稿時の処理フロー

```typescript
// workers/post-to-x.ts
export async function postToX(userId: string, content: string) {
  // 1. 使用量チェック
  await checkUsageLimit(userId)

  // 2. API Key取得 (復号化)
  const { bearer_token } = await getXApiSettings(userId)

  // 3. X API投稿
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bearer_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: content }),
  })

  if (!response.ok) {
    throw new Error('X API投稿失敗')
  }

  // 4. 使用量カウント
  await incrementUsage(userId)

  return response.json()
}
```

---

**最終更新**: 2025-10-02
**ステータス**: 設計完了、実装待ち
