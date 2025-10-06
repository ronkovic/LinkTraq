import { describe, it, expect } from 'vitest'
import * as schema from '../../db/schema'
import { allMockData } from '../fixtures/mock-data'

describe('Database Schema Validation', () => {
  describe('Users Schema', () => {
    it('should have correct user table structure', () => {
      const userSchema = schema.users
      expect(userSchema).toBeDefined()

      const mockUser = allMockData.users[0]
      expect(mockUser).toHaveProperty('id')
      expect(mockUser).toHaveProperty('email')
      expect(mockUser).toHaveProperty('createdAt')
      expect(mockUser).toHaveProperty('updatedAt')
    })

    it('should validate user data types', () => {
      const mockUser = allMockData.users[0]
      expect(typeof mockUser.id).toBe('string')
      expect(typeof mockUser.email).toBe('string')
      expect(mockUser.createdAt).toBeInstanceOf(Date)
      expect(mockUser.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('Affiliate Providers Schema', () => {
    it('should have correct affiliate provider table structure', () => {
      const providerSchema = schema.affiliateProviders
      expect(providerSchema).toBeDefined()

      const mockProvider = allMockData.affiliateProviders[0]
      expect(mockProvider).toHaveProperty('id')
      expect(mockProvider).toHaveProperty('userId')
      expect(mockProvider).toHaveProperty('name')
      expect(mockProvider).toHaveProperty('apiKey')
      expect(mockProvider).toHaveProperty('apiSecret')
      expect(mockProvider).toHaveProperty('createdAt')
    })

    it('should validate foreign key relationship with users', () => {
      const mockProvider = allMockData.affiliateProviders[0]
      const mockUser = allMockData.users[0]
      expect(mockProvider.userId).toBe(mockUser.id)
    })
  })

  describe('Products Schema', () => {
    it('should have correct product table structure', () => {
      const productSchema = schema.products
      expect(productSchema).toBeDefined()

      const mockProduct = allMockData.products[0]
      expect(mockProduct).toHaveProperty('id')
      expect(mockProduct).toHaveProperty('userId')
      expect(mockProduct).toHaveProperty('name')
      expect(mockProduct).toHaveProperty('description')
      expect(mockProduct).toHaveProperty('price')
      expect(mockProduct).toHaveProperty('imageUrl')
      expect(mockProduct).toHaveProperty('category')
      expect(mockProduct).toHaveProperty('createdAt')
    })

    it('should validate price format', () => {
      const mockProduct = allMockData.products[0]
      expect(typeof mockProduct.price).toBe('string')
      expect(parseInt(mockProduct.price)).toBeGreaterThan(0)
    })
  })

  describe('Posts Schema', () => {
    it('should have correct post table structure', () => {
      const postSchema = schema.posts
      expect(postSchema).toBeDefined()

      const mockPost = allMockData.posts[0]
      expect(mockPost).toHaveProperty('id')
      expect(mockPost).toHaveProperty('userId')
      expect(mockPost).toHaveProperty('productId')
      expect(mockPost).toHaveProperty('content')
      expect(mockPost).toHaveProperty('imageUrls')
      expect(mockPost).toHaveProperty('hashtags')
      expect(mockPost).toHaveProperty('status')
      expect(mockPost).toHaveProperty('createdAt')
    })

    it('should validate post status enum', () => {
      const mockPost = allMockData.posts[0]
      expect(['draft', 'scheduled', 'published']).toContain(mockPost.status)
    })

    it('should validate hashtags array', () => {
      const mockPost = allMockData.posts[0]
      expect(Array.isArray(mockPost.hashtags)).toBe(true)
      expect(mockPost.hashtags.length).toBeGreaterThan(0)
    })
  })

  describe('Post Schedules Schema', () => {
    it('should have correct post schedule table structure', () => {
      const scheduleSchema = schema.postSchedules
      expect(scheduleSchema).toBeDefined()

      const mockSchedule = allMockData.postSchedules[0]
      expect(mockSchedule).toHaveProperty('id')
      expect(mockSchedule).toHaveProperty('postId')
      expect(mockSchedule).toHaveProperty('scheduledAt')
      expect(mockSchedule).toHaveProperty('snsPlatform')
      expect(mockSchedule).toHaveProperty('status')
      expect(mockSchedule).toHaveProperty('retryCount')
      expect(mockSchedule).toHaveProperty('lastError')
      expect(mockSchedule).toHaveProperty('lastRetryAt')
      expect(mockSchedule).toHaveProperty('nextRetryAt')
    })

    it('should validate SNS platform enum', () => {
      const mockSchedule = allMockData.postSchedules[0]
      expect(['x', 'instagram', 'facebook']).toContain(mockSchedule.snsPlatform)
    })

    it('should validate schedule status enum', () => {
      const mockSchedule = allMockData.postSchedules[0]
      expect(['pending', 'processing', 'published', 'failed']).toContain(mockSchedule.status)
    })

    it('should validate retry count is non-negative', () => {
      const mockSchedule = allMockData.postSchedules[0]
      expect(mockSchedule.retryCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Affiliate Links Schema', () => {
    it('should have correct affiliate link table structure', () => {
      const linkSchema = schema.affiliateLinks
      expect(linkSchema).toBeDefined()

      const mockLink = allMockData.affiliateLinks[0]
      expect(mockLink).toHaveProperty('id')
      expect(mockLink).toHaveProperty('providerId')
      expect(mockLink).toHaveProperty('productId')
      expect(mockLink).toHaveProperty('shortCode')
      expect(mockLink).toHaveProperty('originalUrl')
      expect(mockLink).toHaveProperty('createdAt')
    })

    it('should validate short code format', () => {
      const mockLink = allMockData.affiliateLinks[0]
      expect(typeof mockLink.shortCode).toBe('string')
      expect(mockLink.shortCode.length).toBeGreaterThan(0)
    })
  })

  describe('Link Clicks Schema', () => {
    it('should have correct link click table structure', () => {
      const clickSchema = schema.linkClicks
      expect(clickSchema).toBeDefined()

      const mockClick = allMockData.linkClicks[0]
      expect(mockClick).toHaveProperty('id')
      expect(mockClick).toHaveProperty('affiliateLinkId')
      expect(mockClick).toHaveProperty('postId')
      expect(mockClick).toHaveProperty('clickedAt')
      expect(mockClick).toHaveProperty('referrer')
      expect(mockClick).toHaveProperty('userAgent')
      expect(mockClick).toHaveProperty('ipAddress')
      expect(mockClick).toHaveProperty('country')
      expect(mockClick).toHaveProperty('deviceType')
    })

    it('should validate device type', () => {
      const mockClick = allMockData.linkClicks[0]
      expect(typeof mockClick.deviceType).toBe('string')
    })
  })

  describe('Conversions Schema', () => {
    it('should have correct conversion table structure', () => {
      const conversionSchema = schema.conversions
      expect(conversionSchema).toBeDefined()

      const mockConversion = allMockData.conversions[0]
      expect(mockConversion).toHaveProperty('id')
      expect(mockConversion).toHaveProperty('affiliateLinkId')
      expect(mockConversion).toHaveProperty('clickId')
      expect(mockConversion).toHaveProperty('provider')
      expect(mockConversion).toHaveProperty('orderId')
      expect(mockConversion).toHaveProperty('amount')
      expect(mockConversion).toHaveProperty('commission')
      expect(mockConversion).toHaveProperty('status')
      expect(mockConversion).toHaveProperty('convertedAt')
    })

    it('should validate conversion status enum', () => {
      const mockConversion = allMockData.conversions[0]
      expect(['pending', 'approved', 'rejected', 'cancelled']).toContain(mockConversion.status)
    })

    it('should validate amount and commission format', () => {
      const mockConversion = allMockData.conversions[0]
      expect(typeof mockConversion.amount).toBe('string')
      expect(typeof mockConversion.commission).toBe('string')
      expect(parseFloat(mockConversion.amount)).toBeGreaterThan(0)
      expect(parseFloat(mockConversion.commission)).toBeGreaterThan(0)
    })

    it('should validate import source enum', () => {
      const mockConversion = allMockData.conversions[0]
      expect(['csv_manual', 'api_amazon', 'api_rakuten']).toContain(mockConversion.importSource)
    })
  })

  describe('X API Settings Schema', () => {
    it('should have correct X API settings table structure', () => {
      const xApiSchema = schema.xApiSettings
      expect(xApiSchema).toBeDefined()

      const mockXApi = allMockData.xApiSettings[0]
      expect(mockXApi).toHaveProperty('id')
      expect(mockXApi).toHaveProperty('userId')
      expect(mockXApi).toHaveProperty('apiKey')
      expect(mockXApi).toHaveProperty('apiSecret')
      expect(mockXApi).toHaveProperty('bearerToken')
      expect(mockXApi).toHaveProperty('apiKeyLast4')
      expect(mockXApi).toHaveProperty('planType')
      expect(mockXApi).toHaveProperty('verifiedAt')
    })

    it('should validate plan type enum', () => {
      const mockXApi = allMockData.xApiSettings[0]
      expect(['free', 'basic', 'pro']).toContain(mockXApi.planType)
    })

    it('should validate API key last 4 format', () => {
      const mockXApi = allMockData.xApiSettings[0]
      expect(mockXApi.apiKeyLast4.length).toBe(4)
    })
  })

  describe('X API Usage Schema', () => {
    it('should have correct X API usage table structure', () => {
      const usageSchema = schema.xApiUsage
      expect(usageSchema).toBeDefined()

      const mockUsage = allMockData.xApiUsage[0]
      expect(mockUsage).toHaveProperty('id')
      expect(mockUsage).toHaveProperty('userId')
      expect(mockUsage).toHaveProperty('month')
      expect(mockUsage).toHaveProperty('postsCount')
      expect(mockUsage).toHaveProperty('planLimit')
      expect(mockUsage).toHaveProperty('lastResetAt')
      expect(mockUsage).toHaveProperty('createdAt')
    })

    it('should validate posts count is within limit', () => {
      const mockUsage = allMockData.xApiUsage[0]
      expect(mockUsage.postsCount).toBeLessThanOrEqual(mockUsage.planLimit)
    })
  })

  describe('Notifications Schema', () => {
    it('should have correct notification table structure', () => {
      const notificationSchema = schema.notifications
      expect(notificationSchema).toBeDefined()

      const mockNotification = allMockData.notifications[0]
      expect(mockNotification).toHaveProperty('id')
      expect(mockNotification).toHaveProperty('userId')
      expect(mockNotification).toHaveProperty('type')
      expect(mockNotification).toHaveProperty('title')
      expect(mockNotification).toHaveProperty('message')
      expect(mockNotification).toHaveProperty('data')
      expect(mockNotification).toHaveProperty('read')
      expect(mockNotification).toHaveProperty('createdAt')
    })

    it('should validate notification data is JSON', () => {
      const mockNotification = allMockData.notifications[0]
      expect(typeof mockNotification.data).toBe('object')
    })
  })

  describe('Templates Schema', () => {
    it('should have correct template table structure', () => {
      const templateSchema = schema.templates
      expect(templateSchema).toBeDefined()

      const mockTemplate = allMockData.templates[0]
      expect(mockTemplate).toHaveProperty('id')
      expect(mockTemplate).toHaveProperty('userId')
      expect(mockTemplate).toHaveProperty('name')
      expect(mockTemplate).toHaveProperty('contentTemplate')
      expect(mockTemplate).toHaveProperty('hashtagTemplate')
      expect(mockTemplate).toHaveProperty('createdAt')
    })

    it('should validate hashtag template is array', () => {
      const mockTemplate = allMockData.templates[0]
      expect(Array.isArray(mockTemplate.hashtagTemplate)).toBe(true)
    })
  })

  describe('AI Settings Schema', () => {
    it('should have correct AI settings table structure', () => {
      const aiSchema = schema.aiSettings
      expect(aiSchema).toBeDefined()

      const mockAi = allMockData.aiSettings[0]
      expect(mockAi).toHaveProperty('id')
      expect(mockAi).toHaveProperty('userId')
      expect(mockAi).toHaveProperty('provider')
      expect(mockAi).toHaveProperty('defaultModel')
      expect(mockAi).toHaveProperty('useOwnApiKey')
      expect(mockAi).toHaveProperty('taskModelMapping')
      expect(mockAi).toHaveProperty('monthlyUsageLimit')
      expect(mockAi).toHaveProperty('currentMonthUsage')
    })

    it('should validate task model mapping is JSON', () => {
      const mockAi = allMockData.aiSettings[0]
      expect(typeof mockAi.taskModelMapping).toBe('object')
      expect(mockAi.taskModelMapping).toHaveProperty('productDescription')
      expect(mockAi.taskModelMapping).toHaveProperty('hashtagSuggestion')
    })

    it('should validate current usage is within limit', () => {
      const mockAi = allMockData.aiSettings[0]
      expect(mockAi.currentMonthUsage).toBeLessThanOrEqual(mockAi.monthlyUsageLimit)
    })
  })

  describe('Post Analytics Schema', () => {
    it('should have correct post analytics table structure', () => {
      const analyticsSchema = schema.postAnalytics
      expect(analyticsSchema).toBeDefined()

      const mockAnalytics = allMockData.postAnalytics[0]
      expect(mockAnalytics).toHaveProperty('id')
      expect(mockAnalytics).toHaveProperty('postId')
      expect(mockAnalytics).toHaveProperty('platform')
      expect(mockAnalytics).toHaveProperty('impressions')
      expect(mockAnalytics).toHaveProperty('likes')
      expect(mockAnalytics).toHaveProperty('retweets')
      expect(mockAnalytics).toHaveProperty('comments')
      expect(mockAnalytics).toHaveProperty('engagementRate')
      expect(mockAnalytics).toHaveProperty('fetchedAt')
    })

    it('should validate analytics metrics are non-negative', () => {
      const mockAnalytics = allMockData.postAnalytics[0]
      expect(mockAnalytics.impressions).toBeGreaterThanOrEqual(0)
      expect(mockAnalytics.likes).toBeGreaterThanOrEqual(0)
      expect(mockAnalytics.retweets).toBeGreaterThanOrEqual(0)
      expect(mockAnalytics.comments).toBeGreaterThanOrEqual(0)
    })

    it('should validate engagement rate format', () => {
      const mockAnalytics = allMockData.postAnalytics[0]
      expect(typeof mockAnalytics.engagementRate).toBe('string')
      expect(parseFloat(mockAnalytics.engagementRate)).toBeGreaterThan(0)
    })
  })

  describe('Foreign Key Relationships', () => {
    it('should validate user relationships', () => {
      const mockUser = allMockData.users[0]
      const relatedProducts = allMockData.products.filter(p => p.userId === mockUser.id)
      const relatedPosts = allMockData.posts.filter(p => p.userId === mockUser.id)

      expect(relatedProducts.length).toBeGreaterThan(0)
      expect(relatedPosts.length).toBeGreaterThan(0)
    })

    it('should validate post schedule relationships', () => {
      const mockPost = allMockData.posts[0]
      const relatedSchedules = allMockData.postSchedules.filter(s => s.postId === mockPost.id)

      expect(relatedSchedules.length).toBeGreaterThan(0)
    })

    it('should validate conversion relationships', () => {
      const mockLink = allMockData.affiliateLinks[0]
      const relatedConversions = allMockData.conversions.filter(c => c.affiliateLinkId === mockLink.id)

      expect(relatedConversions.length).toBeGreaterThan(0)
    })
  })
})
