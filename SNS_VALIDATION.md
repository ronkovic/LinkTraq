# SNS投稿バリデーション設計

このドキュメントは、SNS投稿の文字数・画像枚数制限バリデーションの詳細設計を定義します。

---

## 概要

SNSプラットフォームごとに異なる投稿制限を管理し、投稿作成時にリアルタイムでバリデーションを実行することで、投稿失敗を防止します。

---

## プラットフォーム別制限仕様

### 1. X (Twitter)

```typescript
const X_LIMITS = {
  text: {
    min: 1,
    max: 280,
    unit: '文字',
  },
  images: {
    min: 0,
    max: 4,
    acceptedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  videos: {
    min: 0,
    max: 1,
    acceptedFormats: ['video/mp4', 'video/mov'],
    maxFileSize: 512 * 1024 * 1024, // 512MB
    maxDuration: 140, // 2分20秒
  },
  hashtags: {
    max: Infinity,
    recommended: 5,
    warning: 10, // 10個以上で警告表示
  },
  urls: {
    countAs: 23, // URLは23文字としてカウント
  },
}
```

**特記事項**:
- 画像と動画は同時投稿不可
- URLは短縮後の文字数 (23文字) としてカウント
- ハッシュタグが多すぎるとエンゲージメントが下がる可能性

---

### 2. Instagram

```typescript
const INSTAGRAM_LIMITS = {
  text: {
    min: 0, // キャプションなしでも投稿可能
    max: 2200,
    unit: '文字',
  },
  images: {
    min: 1, // 最低1枚必要
    max: 10,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxFileSize: 8 * 1024 * 1024, // 8MB
    recommendedAspectRatio: '1:1', // 正方形推奨
  },
  videos: {
    min: 0,
    max: 1, // フィード投稿は1本のみ
    acceptedFormats: ['video/mp4', 'video/mov'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxDuration: 60, // 60秒
  },
  hashtags: {
    max: 30,
    recommended: 10,
    warning: 25, // 25個以上で警告表示
  },
  urls: {
    countAs: 1, // URLは通常の文字数としてカウント
    clickable: false, // キャプション内のURLはクリック不可
    bioLinkOnly: true, // プロフィールのリンクのみクリック可能
  },
}
```

**特記事項**:
- 画像は最低1枚必須
- カルーセル投稿 (複数画像) 可能
- キャプション内のURLはクリック不可 (プロフィールリンク推奨)
- ハッシュタグは最大30個だが、多すぎるとスパム判定のリスク

---

### 3. Facebook

```typescript
const FACEBOOK_LIMITS = {
  text: {
    min: 0,
    max: 63206,
    unit: '文字',
    recommended: 500, // エンゲージメント最適化のため
  },
  images: {
    min: 0,
    max: Infinity, // 実質無制限 (UI上は10枚程度に制限推奨)
    acceptedFormats: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  videos: {
    min: 0,
    max: 1,
    acceptedFormats: ['video/mp4', 'video/mov'],
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxDuration: 240, // 4分 (通常投稿)
  },
  hashtags: {
    max: Infinity,
    recommended: 3,
    warning: 5, // Facebookではハッシュタグの効果が低い
  },
  urls: {
    countAs: 1, // URLは通常の文字数としてカウント
    clickable: true,
  },
}
```

**特記事項**:
- 制限が非常に緩い
- ハッシュタグの効果は低い (3個程度推奨)
- 長文よりも500文字程度がエンゲージメント高い

---

## Zodバリデーションスキーマ設計

### 基本スキーマ構造

```typescript
// lib/validation/sns-post.schema.ts
import { z } from 'zod'

// プラットフォーム列挙型
export const SNSPlatformSchema = z.enum(['x', 'instagram', 'facebook'])
export type SNSPlatform = z.infer<typeof SNSPlatformSchema>

// メディアタイプ
export const MediaTypeSchema = z.enum(['image', 'video'])
export type MediaType = z.infer<typeof MediaTypeSchema>

// メディアファイル
export const MediaFileSchema = z.object({
  id: z.string().uuid(),
  type: MediaTypeSchema,
  url: z.string().url(),
  mimeType: z.string(),
  fileSize: z.number().positive(),
  duration: z.number().optional(), // 動画の場合のみ
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})
export type MediaFile = z.infer<typeof MediaFileSchema>

// 投稿ベーススキーマ
export const PostBaseSchema = z.object({
  content: z.string(),
  hashtags: z.array(z.string()).default([]),
  mediaFiles: z.array(MediaFileSchema).default([]),
  platform: SNSPlatformSchema,
})
export type PostBase = z.infer<typeof PostBaseSchema>
```

---

### プラットフォーム別バリデーションスキーマ

```typescript
// X (Twitter) バリデーション
export const XPostSchema = PostBaseSchema.extend({
  platform: z.literal('x'),
}).superRefine((data, ctx) => {
  // 文字数チェック (URLは23文字としてカウント)
  const contentLength = calculateXContentLength(data.content)

  if (contentLength < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: 'string',
      inclusive: true,
      path: ['content'],
      message: '投稿内容を入力してください',
    })
  }

  if (contentLength > 280) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 280,
      type: 'string',
      inclusive: true,
      path: ['content'],
      message: `文字数制限を超えています (${contentLength}/280)`,
    })
  }

  // 画像枚数チェック
  const images = data.mediaFiles.filter(m => m.type === 'image')
  if (images.length > 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 4,
      type: 'array',
      inclusive: true,
      path: ['mediaFiles'],
      message: '画像は最大4枚までです',
    })
  }

  // 動画チェック
  const videos = data.mediaFiles.filter(m => m.type === 'video')
  if (videos.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 1,
      type: 'array',
      inclusive: true,
      path: ['mediaFiles'],
      message: '動画は1本までです',
    })
  }

  // 画像と動画の同時投稿チェック
  if (images.length > 0 && videos.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['mediaFiles'],
      message: '画像と動画は同時に投稿できません',
    })
  }

  // ハッシュタグ数の警告
  if (data.hashtags.length > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hashtags'],
      message: `ハッシュタグが多すぎます (${data.hashtags.length}個)。5個以下を推奨します`,
      fatal: false, // 警告のみ (エラーではない)
    })
  }
})

// Instagram バリデーション
export const InstagramPostSchema = PostBaseSchema.extend({
  platform: z.literal('instagram'),
}).superRefine((data, ctx) => {
  // 文字数チェック
  if (data.content.length > 2200) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 2200,
      type: 'string',
      inclusive: true,
      path: ['content'],
      message: `文字数制限を超えています (${data.content.length}/2200)`,
    })
  }

  // 画像最低1枚必須
  const images = data.mediaFiles.filter(m => m.type === 'image')
  const videos = data.mediaFiles.filter(m => m.type === 'video')

  if (images.length === 0 && videos.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: 'array',
      inclusive: true,
      path: ['mediaFiles'],
      message: '画像または動画を最低1つ追加してください',
    })
  }

  // 画像枚数チェック
  if (images.length > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 10,
      type: 'array',
      inclusive: true,
      path: ['mediaFiles'],
      message: '画像は最大10枚までです',
    })
  }

  // ハッシュタグ数チェック
  if (data.hashtags.length > 30) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 30,
      type: 'array',
      inclusive: true,
      path: ['hashtags'],
      message: `ハッシュタグは最大30個までです (${data.hashtags.length}/30)`,
    })
  }

  // ハッシュタグ数の警告
  if (data.hashtags.length > 25) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hashtags'],
      message: 'ハッシュタグが多すぎます。10個以下を推奨します',
      fatal: false,
    })
  }

  // URLクリック不可の警告
  const urlRegex = /https?:\/\/[^\s]+/g
  if (urlRegex.test(data.content)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['content'],
      message: 'Instagramのキャプション内のURLはクリックできません。プロフィールにリンクを追加することをお勧めします',
      fatal: false,
    })
  }
})

// Facebook バリデーション
export const FacebookPostSchema = PostBaseSchema.extend({
  platform: z.literal('facebook'),
}).superRefine((data, ctx) => {
  // 文字数チェック
  if (data.content.length > 63206) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 63206,
      type: 'string',
      inclusive: true,
      path: ['content'],
      message: `文字数制限を超えています (${data.content.length}/63206)`,
    })
  }

  // 文字数推奨の警告
  if (data.content.length > 500) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['content'],
      message: '長文よりも500文字程度がエンゲージメントが高い傾向があります',
      fatal: false,
    })
  }

  // ハッシュタグ推奨の警告
  if (data.hashtags.length > 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hashtags'],
      message: 'Facebookではハッシュタグの効果は低いです。3個以下を推奨します',
      fatal: false,
    })
  }
})

// ユニオン型で全プラットフォームをサポート
export const SNSPostSchema = z.discriminatedUnion('platform', [
  XPostSchema,
  InstagramPostSchema,
  FacebookPostSchema,
])
export type SNSPost = z.infer<typeof SNSPostSchema>
```

---

### ヘルパー関数

```typescript
// lib/validation/sns-helpers.ts

/**
 * X (Twitter) の文字数カウント
 * URLは23文字としてカウント
 */
export function calculateXContentLength(content: string): number {
  const urlRegex = /https?:\/\/[^\s]+/g
  const urls = content.match(urlRegex) || []

  // URLを一時的に削除
  let contentWithoutUrls = content
  urls.forEach(url => {
    contentWithoutUrls = contentWithoutUrls.replace(url, '')
  })

  // 通常の文字数 + URL数 × 23
  return contentWithoutUrls.length + (urls.length * 23)
}

/**
 * ハッシュタグを抽出
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g
  return content.match(hashtagRegex) || []
}

/**
 * メディアファイルのバリデーション
 */
export function validateMediaFile(
  file: File,
  platform: SNSPlatform,
  type: MediaType
): { valid: boolean; error?: string } {
  const limits = {
    x: {
      image: { maxSize: 5 * 1024 * 1024, formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
      video: { maxSize: 512 * 1024 * 1024, formats: ['video/mp4', 'video/quicktime'] },
    },
    instagram: {
      image: { maxSize: 8 * 1024 * 1024, formats: ['image/jpeg', 'image/png'] },
      video: { maxSize: 100 * 1024 * 1024, formats: ['video/mp4', 'video/quicktime'] },
    },
    facebook: {
      image: { maxSize: 10 * 1024 * 1024, formats: ['image/jpeg', 'image/png', 'image/gif'] },
      video: { maxSize: 1024 * 1024 * 1024, formats: ['video/mp4', 'video/quicktime'] },
    },
  }

  const limit = limits[platform][type]

  // ファイルサイズチェック
  if (file.size > limit.maxSize) {
    const maxSizeMB = Math.round(limit.maxSize / (1024 * 1024))
    return { valid: false, error: `ファイルサイズは${maxSizeMB}MB以下にしてください` }
  }

  // フォーマットチェック
  if (!limit.formats.includes(file.type)) {
    return { valid: false, error: `対応していないファイル形式です (${file.type})` }
  }

  return { valid: true }
}
```

---

## エラーメッセージ設計

### エラーメッセージの種類

```typescript
// lib/validation/error-messages.ts

export const ERROR_MESSAGES = {
  // 文字数エラー
  TEXT_TOO_SHORT: (platform: SNSPlatform) =>
    `投稿内容を入力してください`,

  TEXT_TOO_LONG: (platform: SNSPlatform, current: number, max: number) =>
    `文字数制限を超えています (${current}/${max})`,

  // メディアエラー
  NO_MEDIA_REQUIRED: (platform: SNSPlatform) =>
    `画像または動画を最低1つ追加してください`,

  TOO_MANY_IMAGES: (platform: SNSPlatform, current: number, max: number) =>
    `画像は最大${max}枚までです (現在: ${current}枚)`,

  TOO_MANY_VIDEOS: (platform: SNSPlatform, max: number) =>
    `動画は${max}本までです`,

  MEDIA_CONFLICT: () =>
    `画像と動画は同時に投稿できません`,

  FILE_TOO_LARGE: (maxSizeMB: number) =>
    `ファイルサイズは${maxSizeMB}MB以下にしてください`,

  UNSUPPORTED_FORMAT: (format: string) =>
    `対応していないファイル形式です (${format})`,

  // ハッシュタグエラー
  TOO_MANY_HASHTAGS: (platform: SNSPlatform, current: number, max: number) =>
    `ハッシュタグは最大${max}個までです (現在: ${current}個)`,
}

export const WARNING_MESSAGES = {
  // 推奨事項の警告
  HASHTAGS_TOO_MANY_RECOMMENDED: (current: number, recommended: number) =>
    `ハッシュタグが多すぎます (${current}個)。${recommended}個以下を推奨します`,

  TEXT_TOO_LONG_RECOMMENDED: (current: number, recommended: number) =>
    `長文よりも${recommended}文字程度がエンゲージメントが高い傾向があります (現在: ${current}文字)`,

  INSTAGRAM_URL_NOT_CLICKABLE: () =>
    `Instagramのキャプション内のURLはクリックできません。プロフィールにリンクを追加することをお勧めします`,

  FACEBOOK_HASHTAGS_LOW_EFFECT: () =>
    `Facebookではハッシュタグの効果は低いです。3個以下を推奨します`,
}
```

---

## UI表示方針

### 1. リアルタイム文字数カウンター

```typescript
// components/PostEditor/CharacterCounter.tsx
interface CharacterCounterProps {
  content: string
  platform: SNSPlatform
}

function CharacterCounter({ content, platform }: CharacterCounterProps) {
  const limits = {
    x: 280,
    instagram: 2200,
    facebook: 63206,
  }

  const count = platform === 'x'
    ? calculateXContentLength(content)
    : content.length

  const limit = limits[platform]
  const percentage = (count / limit) * 100

  // 色の変化: 緑 → 黄 → 赤
  const color = percentage > 100 ? 'text-red-600'
    : percentage > 90 ? 'text-yellow-600'
    : 'text-gray-600'

  return (
    <div className="flex items-center gap-2">
      <span className={color}>
        {count} / {limit}
      </span>

      {/* プログレスバー */}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentage > 100 ? 'bg-red-500'
            : percentage > 90 ? 'bg-yellow-500'
            : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
```

---

### 2. メディア枚数表示

```typescript
// components/PostEditor/MediaCounter.tsx
interface MediaCounterProps {
  images: MediaFile[]
  videos: MediaFile[]
  platform: SNSPlatform
}

function MediaCounter({ images, videos, platform }: MediaCounterProps) {
  const limits = {
    x: { images: 4, videos: 1 },
    instagram: { images: 10, videos: 1 },
    facebook: { images: Infinity, videos: 1 },
  }

  const limit = limits[platform]

  return (
    <div className="flex gap-4 text-sm">
      <div className={images.length > limit.images ? 'text-red-600' : 'text-gray-600'}>
        画像: {images.length} / {limit.images === Infinity ? '∞' : limit.images}
      </div>

      <div className={videos.length > limit.videos ? 'text-red-600' : 'text-gray-600'}>
        動画: {videos.length} / {limit.videos}
      </div>
    </div>
  )
}
```

---

### 3. バリデーションエラー表示

```typescript
// components/PostEditor/ValidationErrors.tsx
interface ValidationError {
  path: string[]
  message: string
  fatal: boolean // エラー or 警告
}

interface ValidationErrorsProps {
  errors: ValidationError[]
}

function ValidationErrors({ errors }: ValidationErrorsProps) {
  const fatalErrors = errors.filter(e => e.fatal)
  const warnings = errors.filter(e => !e.fatal)

  return (
    <div className="space-y-2">
      {/* エラー (赤色) */}
      {fatalErrors.map((error, i) => (
        <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error.message}</div>
        </div>
      ))}

      {/* 警告 (黄色) */}
      {warnings.map((warning, i) => (
        <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">{warning.message}</div>
        </div>
      ))}
    </div>
  )
}
```

---

### 4. プラットフォーム切り替え時の制限表示

```typescript
// components/PostEditor/PlatformSelector.tsx
interface PlatformSelectorProps {
  selectedPlatform: SNSPlatform
  onPlatformChange: (platform: SNSPlatform) => void
}

function PlatformSelector({ selectedPlatform, onPlatformChange }: PlatformSelectorProps) {
  const platforms: { value: SNSPlatform; label: string; limits: string }[] = [
    {
      value: 'x',
      label: 'X (Twitter)',
      limits: '280文字、画像4枚、動画1本',
    },
    {
      value: 'instagram',
      label: 'Instagram',
      limits: '2,200文字、画像10枚、動画1本、ハッシュタグ30個',
    },
    {
      value: 'facebook',
      label: 'Facebook',
      limits: '63,206文字、画像・動画無制限',
    },
  ]

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">投稿先を選択</label>

      <div className="grid grid-cols-3 gap-2">
        {platforms.map(platform => (
          <button
            key={platform.value}
            onClick={() => onPlatformChange(platform.value)}
            className={`p-3 border rounded-lg text-left transition ${
              selectedPlatform === platform.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">{platform.label}</div>
            <div className="text-xs text-gray-600 mt-1">{platform.limits}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## 実装フェーズ

### Phase 1: 基本バリデーション (MVP)
- [ ] Zodスキーマ作成 (X, Instagram, Facebook)
- [ ] 文字数カウンター実装
- [ ] メディア枚数チェック実装
- [ ] エラーメッセージ表示
- [ ] リアルタイムバリデーション

### Phase 2: 拡張機能
- [ ] 警告表示 (推奨事項)
- [ ] プラットフォーム切り替え時の自動調整
- [ ] ハッシュタグ自動抽出
- [ ] URL短縮プレビュー (X)
- [ ] 画像アスペクト比チェック

### Phase 3: 高度な機能
- [ ] 投稿プレビュー (プラットフォーム別)
- [ ] 下書き保存時のバリデーションスキップ
- [ ] 複数プラットフォーム同時投稿時の最小公倍数制限
- [ ] バリデーションルールのカスタマイズ機能

---

## テストケース

### 文字数バリデーションテスト

```typescript
// __tests__/validation/sns-post.test.ts
import { describe, it, expect } from 'vitest'
import { XPostSchema } from '@/lib/validation/sns-post.schema'

describe('XPostSchema', () => {
  it('280文字以内の投稿は有効', () => {
    const post = {
      platform: 'x' as const,
      content: 'a'.repeat(280),
      hashtags: [],
      mediaFiles: [],
    }

    expect(() => XPostSchema.parse(post)).not.toThrow()
  })

  it('281文字の投稿はエラー', () => {
    const post = {
      platform: 'x' as const,
      content: 'a'.repeat(281),
      hashtags: [],
      mediaFiles: [],
    }

    expect(() => XPostSchema.parse(post)).toThrow()
  })

  it('URLは23文字としてカウント', () => {
    const post = {
      platform: 'x' as const,
      content: 'a'.repeat(257) + ' https://example.com', // 257 + 1 (space) + 23 (URL) = 281
      hashtags: [],
      mediaFiles: [],
    }

    expect(() => XPostSchema.parse(post)).toThrow()
  })
})

describe('InstagramPostSchema', () => {
  it('メディアなしはエラー', () => {
    const post = {
      platform: 'instagram' as const,
      content: 'テスト投稿',
      hashtags: [],
      mediaFiles: [],
    }

    expect(() => InstagramPostSchema.parse(post)).toThrow()
  })

  it('ハッシュタグ31個はエラー', () => {
    const post = {
      platform: 'instagram' as const,
      content: 'テスト投稿',
      hashtags: Array(31).fill('#tag'),
      mediaFiles: [{ id: '1', type: 'image', url: 'https://example.com/img.jpg', mimeType: 'image/jpeg', fileSize: 1024 }],
    }

    expect(() => InstagramPostSchema.parse(post)).toThrow()
  })
})
```

---

## データベース拡張 (必要に応じて)

現在のスキーマで十分対応可能ですが、プラットフォーム別の制限をDBで管理する場合:

```sql
-- SNSプラットフォーム制限設定 (オプション)
sns_platform_limits
  - id (uuid, primary key)
  - platform (enum: x, instagram, facebook)
  - max_text_length (integer)
  - max_images (integer)
  - max_videos (integer)
  - max_hashtags (integer, nullable)
  - recommended_hashtags (integer, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)

-- デフォルトデータ
INSERT INTO sns_platform_limits (platform, max_text_length, max_images, max_videos, max_hashtags, recommended_hashtags)
VALUES
  ('x', 280, 4, 1, NULL, 5),
  ('instagram', 2200, 10, 1, 30, 10),
  ('facebook', 63206, 999, 1, NULL, 3);
```

**注**: 現時点では不要。制限値はコード内で管理する方がシンプル。

---

## セキュリティ考慮事項

### 1. クライアント側バリデーション
- フロントエンドでの即座のフィードバック
- ユーザー体験向上

### 2. サーバー側バリデーション (必須)
- Cloudflare Workers での最終チェック
- 悪意のあるリクエストの防止
- 同じZodスキーマを使用

### 3. ファイルアップロード検証
- MIMEタイプチェック
- ファイルサイズ制限
- マルウェアスキャン (Phase 2)

---

## コスト影響

**追加コスト**: $0/月

- バリデーションはクライアント/サーバー側のロジックのみ
- 追加の外部サービス不要

---

## 次のステップ

1. [ ] PROJECT_PLAN.md にバリデーション設計セクション追加
2. [ ] REVIEW_ITEMS.md の該当項目を✅完了にマーク
3. [ ] Phase 3の実装タスクにバリデーション実装を追加
4. [ ] 実装時にこの設計書を参照

---

**最終更新**: 2025-10-03
**ステータス**: 設計完了
**次回アクション**: プランニングファイル更新 → 実装タスクへ
