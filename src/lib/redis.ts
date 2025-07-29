import { createClient } from 'redis'

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries')
        return false
      }
      return Math.min(retries * 100, 3000)
    }
  }
})

// Connect to Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redisClient.on('ready', () => {
  console.log('✅ Redis client ready')
})

// Initialize connection
if (!redisClient.isOpen) {
  redisClient.connect().catch(console.error)
}

// Cache utility functions
export const cache = {
  // Set cache with TTL
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },

  // Get cache value
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  // Delete cache key
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  },

  // Clear all cache
  async clear(): Promise<void> {
    try {
      await redisClient.flushAll()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  },

  // Get cache statistics
  async getStats(): Promise<{ keys: number; memory: string }> {
    try {
      const info = await redisClient.info('memory')
      const keys = await redisClient.dbSize()
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(\S+)/)
      const memory = memoryMatch ? memoryMatch[1] : 'Unknown'
      
      return { keys, memory }
    } catch (error) {
      console.error('Cache stats error:', error)
      return { keys: 0, memory: 'Unknown' }
    }
  }
}

// Cache keys for different data types
export const CACHE_KEYS = {
  // Content generation cache
  CONTENT_GENERATION: (keywords: string) => `content:${keywords}`,
  FAQ_GENERATION: (content: string) => `faq:${content.substring(0, 50)}`,
  META_GENERATION: (keyword: string) => `meta:${keyword}`,
  
  // Rate limiting cache
  RATE_LIMIT: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
  
  // Page data cache
  PAGE_DATA: (handle: string) => `page:${handle}`,
  PAGE_LIST: (filters: string) => `pages:${filters}`,
  
  // Security cache
  SECURITY_EVENTS: (ip: string) => `security:${ip}`,
  THREAT_SCORE: (ip: string) => `threat:${ip}`,
  
  // Analytics cache
  ANALYTICS: (type: string, date: string) => `analytics:${type}:${date}`,
}

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  CONTENT: 3600, // 1 hour
  FAQ: 3600, // 1 hour
  META: 7200, // 2 hours
  PAGE_DATA: 1800, // 30 minutes
  PAGE_LIST: 900, // 15 minutes
  RATE_LIMIT: 60, // 1 minute
  SECURITY: 300, // 5 minutes
  ANALYTICS: 3600, // 1 hour
}

export default redisClient 