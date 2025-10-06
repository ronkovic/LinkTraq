/**
 * モックデータ - テスト用のサンプルデータ
 */

export const mockUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test1@example.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'test2@example.com',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  },
]

export const mockAffiliateProviders = [
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    userId: mockUsers[0].id,
    name: 'Amazon Associates',
    apiKey: 'encrypted_api_key_123',
    apiSecret: 'encrypted_api_secret_123',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    userId: mockUsers[0].id,
    name: '楽天アフィリエイト',
    apiKey: 'encrypted_api_key_456',
    apiSecret: 'encrypted_api_secret_456',
    createdAt: new Date('2025-01-01'),
  },
]

export const mockProducts = [
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    userId: mockUsers[0].id,
    name: 'ワイヤレスイヤホン Pro',
    description: '高音質ノイズキャンセリング搭載',
    price: '29800',
    imageUrl: 'https://example.com/images/earphones.jpg',
    category: '電子機器',
    createdAt: new Date('2025-01-05'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    userId: mockUsers[0].id,
    name: 'スマートウォッチ X1',
    description: '健康管理機能搭載',
    price: '45000',
    imageUrl: 'https://example.com/images/smartwatch.jpg',
    category: '電子機器',
    createdAt: new Date('2025-01-06'),
  },
]

export const mockPosts = [
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    userId: mockUsers[0].id,
    productId: mockProducts[0].id,
    content: '新発売のワイヤレスイヤホンが超おすすめ！ノイキャン最高です🎧',
    imageUrls: ['https://example.com/images/post1.jpg'],
    hashtags: ['ガジェット', 'イヤホン', 'おすすめ'],
    status: 'published' as const,
    createdAt: new Date('2025-01-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    userId: mockUsers[0].id,
    productId: mockProducts[1].id,
    content: 'スマートウォッチで健康管理が楽になりました💪',
    imageUrls: ['https://example.com/images/post2.jpg'],
    hashtags: ['健康', 'スマートウォッチ', 'フィットネス'],
    status: 'draft' as const,
    createdAt: new Date('2025-01-11'),
  },
]

export const mockPostSchedules = [
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    postId: mockPosts[0].id,
    scheduledAt: new Date('2025-01-15T10:00:00Z'),
    snsPlatform: 'x' as const,
    publishedAt: new Date('2025-01-15T10:00:30Z'),
    status: 'published' as const,
    retryCount: 0,
    lastError: null,
    lastRetryAt: null,
    nextRetryAt: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    postId: mockPosts[1].id,
    scheduledAt: new Date('2025-01-20T14:00:00Z'),
    snsPlatform: 'instagram' as const,
    publishedAt: null,
    status: 'pending' as const,
    retryCount: 0,
    lastError: null,
    lastRetryAt: null,
    nextRetryAt: null,
  },
]

export const mockAffiliateLinks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    providerId: mockAffiliateProviders[0].id,
    productId: mockProducts[0].id,
    shortCode: 'abc123',
    originalUrl: 'https://amazon.co.jp/dp/B0XXXXX?tag=your-affiliate-id',
    createdAt: new Date('2025-01-05'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    providerId: mockAffiliateProviders[1].id,
    productId: mockProducts[1].id,
    shortCode: 'def456',
    originalUrl: 'https://item.rakuten.co.jp/shop/item-id/?scid=your-affiliate-id',
    createdAt: new Date('2025-01-06'),
  },
]

export const mockLinkClicks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    affiliateLinkId: mockAffiliateLinks[0].id,
    postId: mockPosts[0].id,
    clickedAt: new Date('2025-01-15T11:30:00Z'),
    referrer: 'x.com',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    ipAddress: '192.168.1.100',
    country: 'JP',
    deviceType: 'mobile',
  },
]

export const mockConversions = [
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    affiliateLinkId: mockAffiliateLinks[0].id,
    clickId: mockLinkClicks[0].id,
    provider: 'amazon',
    orderId: 'AMZ-123456789',
    amount: '29800',
    commission: '1490',
    status: 'approved' as const,
    convertedAt: new Date('2025-01-15T12:00:00Z'),
    approvedAt: new Date('2025-01-20T10:00:00Z'),
    rejectedAt: null,
    rejectionReason: null,
    importSource: 'csv_manual' as const,
    importedAt: new Date('2025-01-21'),
    createdAt: new Date('2025-01-21'),
    updatedAt: new Date('2025-01-21'),
  },
]

export const mockXApiSettings = [
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    userId: mockUsers[0].id,
    apiKey: 'encrypted_x_api_key',
    apiSecret: 'encrypted_x_api_secret',
    bearerToken: 'encrypted_bearer_token',
    apiKeyLast4: '1234',
    planType: 'free' as const,
    verifiedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
]

export const mockXApiUsage = [
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    userId: mockUsers[0].id,
    month: '2025-01',
    postsCount: 15,
    planLimit: 1500,
    lastResetAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
  },
]

export const mockNotifications = [
  {
    id: '550e8400-e29b-41d4-a716-446655440017',
    userId: mockUsers[0].id,
    type: 'post_success',
    title: '投稿が成功しました',
    message: 'X への投稿が正常に完了しました',
    data: { postScheduleId: mockPostSchedules[0].id },
    read: 'false',
    readAt: null,
    createdAt: new Date('2025-01-15T10:01:00Z'),
  },
]

export const mockTemplates = [
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    userId: mockUsers[0].id,
    name: '商品紹介テンプレート',
    contentTemplate: '{{productName}}がおすすめ！\\n{{description}}\\n\\n詳細はこちら👇',
    hashtagTemplate: ['おすすめ', 'レビュー', '{{category}}'],
    createdAt: new Date('2025-01-01'),
  },
]

export const mockAiSettings = [
  {
    id: '550e8400-e29b-41d4-a716-446655440019',
    userId: mockUsers[0].id,
    provider: 'openrouter',
    defaultModel: 'deepseek/deepseek-v3.1:free',
    useOwnApiKey: 'false',
    apiKey: null,
    apiKeyLast4: null,
    apiKeyVerifiedAt: null,
    taskModelMapping: {
      productDescription: 'deepseek/deepseek-v3.1:free',
      hashtagSuggestion: 'meta-llama/llama-4-maverick:free',
    },
    monthlyUsageLimit: 10000,
    currentMonthUsage: 2500,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
  },
]

export const mockPostAnalytics = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    postId: mockPosts[0].id,
    platform: 'x' as const,
    impressions: 15000,
    likes: 350,
    retweets: 45,
    comments: 12,
    engagementRate: '2.71',
    fetchedAt: new Date('2025-01-16'),
  },
]

// エクスポート: すべてのモックデータをまとめたオブジェクト
export const allMockData = {
  users: mockUsers,
  affiliateProviders: mockAffiliateProviders,
  products: mockProducts,
  posts: mockPosts,
  postSchedules: mockPostSchedules,
  affiliateLinks: mockAffiliateLinks,
  linkClicks: mockLinkClicks,
  conversions: mockConversions,
  xApiSettings: mockXApiSettings,
  xApiUsage: mockXApiUsage,
  notifications: mockNotifications,
  templates: mockTemplates,
  aiSettings: mockAiSettings,
  postAnalytics: mockPostAnalytics,
}
