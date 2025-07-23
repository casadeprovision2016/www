import Redis from 'ioredis';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  async get(key: string): Promise<any> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      console.error('Cache expire error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Método para cache com auto-refresh
  async getOrSet(
    key: string, 
    fetchFunction: () => Promise<any>, 
    ttl: number = 3600
  ): Promise<any> {
    try {
      let data = await this.get(key);
      
      if (data === null) {
        data = await fetchFunction();
        if (data !== null && data !== undefined) {
          await this.set(key, data, ttl);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // Em caso de erro no cache, buscar diretamente
      return await fetchFunction();
    }
  }

  // Rate limiting helper
  async isRateLimited(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await this.increment(key);
      
      if (current === 1) {
        await this.expire(key, window);
      }
      
      return current > limit;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false; // Em caso de erro, não bloquear
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  async getSession(sessionId: string): Promise<any> {
    return await this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const cacheService = new CacheService();
export const redis = cacheService['redis']; // Export redis instance for direct access