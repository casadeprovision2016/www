"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityLogger = exports.performanceLogger = exports.uploadLogger = exports.dataLogger = exports.authLogger = exports.requestLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
// Configuração do logger
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'cccp-api' },
    transports: [
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
    ],
});
// Em desenvolvimento, também logar no console
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
// Middleware de log de requests
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    // Adicionar ID da requisição aos headers
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    // Log da requisição iniciada
    exports.logger.info({
        type: 'request_start',
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    // Interceptar a resposta
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'error' : 'info';
        exports.logger[level]({
            type: 'request_complete',
            requestId,
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('content-length'),
            timestamp: new Date().toISOString()
        });
    });
    next();
};
exports.requestLogger = requestLogger;
// Logger para autenticação
exports.authLogger = {
    loginAttempt: (email, ip, success) => {
        exports.logger.info({
            type: 'auth_attempt',
            email,
            ip,
            success,
            timestamp: new Date().toISOString()
        });
    },
    logout: (userId, ip) => {
        exports.logger.info({
            type: 'auth_logout',
            userId,
            ip,
            timestamp: new Date().toISOString()
        });
    },
    tokenExpired: (userId, ip) => {
        exports.logger.info({
            type: 'auth_token_expired',
            userId,
            ip,
            timestamp: new Date().toISOString()
        });
    }
};
// Logger para operações de dados
exports.dataLogger = {
    created: (table, id, userId) => {
        exports.logger.info({
            type: 'data_created',
            table,
            recordId: id,
            userId,
            timestamp: new Date().toISOString()
        });
    },
    updated: (table, id, userId, changes) => {
        exports.logger.info({
            type: 'data_updated',
            table,
            recordId: id,
            userId,
            changes: Object.keys(changes),
            timestamp: new Date().toISOString()
        });
    },
    deleted: (table, id, userId) => {
        exports.logger.warn({
            type: 'data_deleted',
            table,
            recordId: id,
            userId,
            timestamp: new Date().toISOString()
        });
    }
};
// Logger para upload de arquivos
exports.uploadLogger = {
    success: (fileName, fileSize, userId) => {
        exports.logger.info({
            type: 'upload_success',
            fileName,
            fileSize,
            userId,
            timestamp: new Date().toISOString()
        });
    },
    failed: (fileName, error, userId) => {
        exports.logger.error({
            type: 'upload_failed',
            fileName,
            error,
            userId,
            timestamp: new Date().toISOString()
        });
    }
};
// Logger para performance
exports.performanceLogger = {
    slowQuery: (query, duration, table) => {
        exports.logger.warn({
            type: 'performance_slow_query',
            query,
            duration: `${duration}ms`,
            table,
            timestamp: new Date().toISOString()
        });
    },
    highMemoryUsage: (usage) => {
        exports.logger.warn({
            type: 'performance_high_memory',
            memoryUsage: `${Math.round(usage / 1024 / 1024)}MB`,
            timestamp: new Date().toISOString()
        });
    }
};
// Logger para segurança
exports.securityLogger = {
    suspiciousActivity: (type, ip, details) => {
        exports.logger.error({
            type: 'security_suspicious',
            activityType: type,
            ip,
            details,
            timestamp: new Date().toISOString()
        });
    },
    rateLimitExceeded: (ip, endpoint, limit) => {
        exports.logger.warn({
            type: 'security_rate_limit',
            ip,
            endpoint,
            limit,
            timestamp: new Date().toISOString()
        });
    },
    invalidToken: (token, ip) => {
        exports.logger.warn({
            type: 'security_invalid_token',
            token: token.substring(0, 10) + '...',
            ip,
            timestamp: new Date().toISOString()
        });
    }
};
//# sourceMappingURL=logger.js.map