declare class CacheService {
    private redis;
    constructor();
    get(key: string): Promise<any>;
    set(key: string, data: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidate(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    increment(key: string, amount?: number): Promise<number>;
    expire(key: string, ttl: number): Promise<void>;
    flush(): Promise<void>;
    getOrSet(key: string, fetchFunction: () => Promise<any>, ttl?: number): Promise<any>;
    isRateLimited(key: string, limit: number, window: number): Promise<boolean>;
    setSession(sessionId: string, data: any, ttl?: number): Promise<void>;
    getSession(sessionId: string): Promise<any>;
    deleteSession(sessionId: string): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export declare const cacheService: CacheService;
export {};
//# sourceMappingURL=cacheService.d.ts.map