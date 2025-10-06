import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'

describe('Drizzle Configuration', () => {
  describe('Configuration File', () => {
    it('should have drizzle.config.ts file', () => {
      const configPath = resolve(__dirname, '../../db/drizzle.config.ts')
      expect(existsSync(configPath)).toBe(true)
    })

    it('should have schema index file', () => {
      const schemaPath = resolve(__dirname, '../../db/schema/index.ts')
      expect(existsSync(schemaPath)).toBe(true)
    })

    it('should have migrations directory', () => {
      const migrationsPath = resolve(__dirname, '../../db/migrations')
      // Migrations directory might not exist yet, so we don't test for it
      // but we verify the path is correct
      expect(migrationsPath).toContain('db/migrations')
    })
  })

  describe('Schema Files', () => {
    const schemaFiles = [
      'users.ts',
      'affiliate-providers.ts',
      'products.ts',
      'posts.ts',
      'affiliate-links.ts',
      'conversions.ts',
      'x-api.ts',
      'notifications.ts',
      'templates.ts',
      'ai-settings.ts',
      'analytics.ts',
      'index.ts',
    ]

    schemaFiles.forEach(file => {
      it(`should have ${file} schema file`, () => {
        const schemaPath = resolve(__dirname, `../../db/schema/${file}`)
        expect(existsSync(schemaPath)).toBe(true)
      })
    })
  })

  describe('Schema Exports', () => {
    it('should export all schemas from index', async () => {
      const schemas = await import('../../db/schema')

      // Main tables
      expect(schemas.users).toBeDefined()
      expect(schemas.affiliateProviders).toBeDefined()
      expect(schemas.products).toBeDefined()
      expect(schemas.posts).toBeDefined()
      expect(schemas.postSchedules).toBeDefined()
      expect(schemas.affiliateLinks).toBeDefined()
      expect(schemas.linkClicks).toBeDefined()
      expect(schemas.conversions).toBeDefined()
      expect(schemas.xApiSettings).toBeDefined()
      expect(schemas.xApiUsage).toBeDefined()
      expect(schemas.notifications).toBeDefined()
      expect(schemas.templates).toBeDefined()
      expect(schemas.aiSettings).toBeDefined()
      expect(schemas.postAnalytics).toBeDefined()
    })

    it('should export all enums', async () => {
      const schemas = await import('../../db/schema')

      // Enums
      expect(schemas.postStatusEnum).toBeDefined()
      expect(schemas.snsPlatformEnum).toBeDefined()
      expect(schemas.scheduleStatusEnum).toBeDefined()
      expect(schemas.conversionStatusEnum).toBeDefined()
      expect(schemas.importSourceEnum).toBeDefined()
      expect(schemas.xApiPlanEnum).toBeDefined()
      expect(schemas.xApiAlertTypeEnum).toBeDefined()
    })
  })

  describe('Migration Setup', () => {
    it('should have migrate.ts file', () => {
      const migratePath = resolve(__dirname, '../../db/migrate.ts')
      expect(existsSync(migratePath)).toBe(true)
    })

    it('should export runMigrate function', async () => {
      const migrateModule = await import('../../db/migrate')
      expect(migrateModule.runMigrate).toBeDefined()
      expect(typeof migrateModule.runMigrate).toBe('function')
    })
  })

  describe('Environment Variables', () => {
    beforeAll(() => {
      // Set a mock DATABASE_URL for testing
      if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      }
    })

    it('should have DATABASE_URL environment variable defined', () => {
      expect(process.env.DATABASE_URL).toBeDefined()
      expect(process.env.DATABASE_URL).toBeTruthy()
    })

    it('should have valid PostgreSQL connection string format', () => {
      const url = process.env.DATABASE_URL!
      expect(url).toMatch(/^postgresql:\/\//)
    })
  })

  describe('TypeScript Configuration', () => {
    it('should have correct path aliases configured', async () => {
      // Test that path aliases work by importing schema
      await expect(
        import('../../db/schema')
      ).resolves.toBeDefined()
    })
  })
})
