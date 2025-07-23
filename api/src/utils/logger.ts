import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

// Configuração do logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cccp-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
  ],
});

// Em desenvolvimento, também logar no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Middleware de log de requests
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Adicionar ID da requisição aos headers
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  // Log da requisição iniciada
  logger.info({
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

    logger[level]({
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

// Logger para autenticação
export const authLogger = {
  loginAttempt: (email: string, ip: string, success: boolean) => {
    logger.info({
      type: 'auth_attempt',
      email,
      ip,
      success,
      timestamp: new Date().toISOString()
    });
  },

  logout: (userId: string, ip: string) => {
    logger.info({
      type: 'auth_logout',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  tokenExpired: (userId: string, ip: string) => {
    logger.info({
      type: 'auth_token_expired',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

// Logger para operações de dados
export const dataLogger = {
  created: (table: string, id: string, userId: string) => {
    logger.info({
      type: 'data_created',
      table,
      recordId: id,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  updated: (table: string, id: string, userId: string, changes: any) => {
    logger.info({
      type: 'data_updated',
      table,
      recordId: id,
      userId,
      changes: Object.keys(changes),
      timestamp: new Date().toISOString()
    });
  },

  deleted: (table: string, id: string, userId: string) => {
    logger.warn({
      type: 'data_deleted',
      table,
      recordId: id,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

// Logger para upload de arquivos
export const uploadLogger = {
  success: (fileName: string, fileSize: number, userId: string) => {
    logger.info({
      type: 'upload_success',
      fileName,
      fileSize,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  failed: (fileName: string, error: string, userId: string) => {
    logger.error({
      type: 'upload_failed',
      fileName,
      error,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

// Logger para performance
export const performanceLogger = {
  slowQuery: (query: string, duration: number, table?: string) => {
    logger.warn({
      type: 'performance_slow_query',
      query,
      duration: `${duration}ms`,
      table,
      timestamp: new Date().toISOString()
    });
  },

  highMemoryUsage: (usage: number) => {
    logger.warn({
      type: 'performance_high_memory',
      memoryUsage: `${Math.round(usage / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });
  }
};

// Logger para segurança
export const securityLogger = {
  suspiciousActivity: (type: string, ip: string, details: any) => {
    logger.error({
      type: 'security_suspicious',
      activityType: type,
      ip,
      details,
      timestamp: new Date().toISOString()
    });
  },

  rateLimitExceeded: (ip: string, endpoint: string, limit: number) => {
    logger.warn({
      type: 'security_rate_limit',
      ip,
      endpoint,
      limit,
      timestamp: new Date().toISOString()
    });
  },

  invalidToken: (token: string, ip: string) => {
    logger.warn({
      type: 'security_invalid_token',
      token: token.substring(0, 10) + '...',
      ip,
      timestamp: new Date().toISOString()
    });
  }
};