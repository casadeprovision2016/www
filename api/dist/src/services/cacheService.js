"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.cacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class CacheService {
    constructor() {
        this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
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
    async get(key) {
        try {
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    async set(key, data, ttl = 3600) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(data));
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    async del(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            console.error('Cache del error:', error);
        }
    }
    async invalidate(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error('Cache invalidate error:', error);
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }
    async increment(key, amount = 1) {
        try {
            return await this.redis.incrby(key, amount);
        }
        catch (error) {
            console.error('Cache increment error:', error);
            return 0;
        }
    }
    async expire(key, ttl) {
        try {
            await this.redis.expire(key, ttl);
        }
        catch (error) {
            console.error('Cache expire error:', error);
        }
    }
    async flush() {
        try {
            await this.redis.flushall();
        }
        catch (error) {
            console.error('Cache flush error:', error);
        }
    }
    // Método para cache com auto-refresh
    async getOrSet(key, fetchFunction, ttl = 3600) {
        try {
            let data = await this.get(key);
            if (data === null) {
                data = await fetchFunction();
                if (data !== null && data !== undefined) {
                    await this.set(key, data, ttl);
                }
            }
            return data;
        }
        catch (error) {
            console.error('Cache getOrSet error:', error);
            // Em caso de erro no cache, buscar diretamente
            return await fetchFunction();
        }
    }
    // Rate limiting helper
    async isRateLimited(key, limit, window) {
        try {
            const current = await this.increment(key);
            if (current === 1) {
                await this.expire(key, window);
            }
            return current > limit;
        }
        catch (error) {
            console.error('Rate limit check error:', error);
            return false; // Em caso de erro, não bloquear
        }
    }
    // Session management
    async setSession(sessionId, data, ttl = 86400) {
        await this.set(`session:${sessionId}`, data, ttl);
    }
    async getSession(sessionId) {
        return await this.get(`session:${sessionId}`);
    }
    async deleteSession(sessionId) {
        await this.del(`session:${sessionId}`);
    }
    // Health check
    async healthCheck() {
        try {
            await this.redis.ping();
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.cacheService = new CacheService();
exports.redis = exports.cacheService['redis']; // Export redis instance for direct access
//# sourceMappingURL=cacheService.js.map