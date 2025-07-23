import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
export declare const logger: winston.Logger;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const authLogger: {
    loginAttempt: (email: string, ip: string, success: boolean) => void;
    logout: (userId: string, ip: string) => void;
    tokenExpired: (userId: string, ip: string) => void;
};
export declare const dataLogger: {
    created: (table: string, id: string, userId: string) => void;
    updated: (table: string, id: string, userId: string, changes: any) => void;
    deleted: (table: string, id: string, userId: string) => void;
};
export declare const uploadLogger: {
    success: (fileName: string, fileSize: number, userId: string) => void;
    failed: (fileName: string, error: string, userId: string) => void;
};
export declare const performanceLogger: {
    slowQuery: (query: string, duration: number, table?: string) => void;
    highMemoryUsage: (usage: number) => void;
};
export declare const securityLogger: {
    suspiciousActivity: (type: string, ip: string, details: any) => void;
    rateLimitExceeded: (ip: string, endpoint: string, limit: number) => void;
    invalidToken: (token: string, ip: string) => void;
};
//# sourceMappingURL=logger.d.ts.map