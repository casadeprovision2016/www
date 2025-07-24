import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { requestLogger, logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { cacheService } from './services/cacheService';

// Importar rotas
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import membersRoutes from './routes/members';
import donationsRoutes from './routes/donations';
import ministriesRoutes from './routes/ministries';
import streamsRoutes from './routes/streams';
import pastoralVisitsRoutes from './routes/pastoralVisits';
import contributionsRoutes from './routes/contributions';
import reportsRoutes from './routes/reports';
import { authenticateToken, requireMemberOrAbove } from './middleware/auth';
import { getDashboardStats } from './controllers/reportsController';

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy for Cloudflare and rate limiting
app.set('trust proxy', true);

// Verificar variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Variável de ambiente obrigatória não encontrada: ${envVar}`);
    process.exit(1);
  }
}

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuração
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://casadeprovision.es',
  'https://www.casadeprovision.es',
  'http://localhost:3000',
  'http://localhost:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como Postman ou apps mobile)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Não permitido pelo CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}));

// Parse JSON com limite
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting geral (DESABILITADO PARA DESENVOLVIMENTO)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // limite muito alto para desenvolvimento
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting completamente em desenvolvimento
    return true; // Sempre pular rate limiting
  }
});

// app.use(generalLimiter); // DESABILITADO PARA DESENVOLVIMENTO

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 tentativas de login por 15min (mais permissivo)
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  skip: (req) => {
    return req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  }
});

// Rate limiting para upload
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 uploads por minuto
  message: {
    success: false,
    error: 'Limite de upload excedido. Tente novamente em 1 minuto.'
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Verificar conexão com Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    // Verificar Redis
    const redisHealthy = await cacheService.healthCheck();

    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbError ? 'error' : 'ok',
        redis: redisHealthy ? 'ok' : 'error'
      }
    };

    const httpStatus = (!dbError && redisHealthy) ? 200 : 503;
    
    res.status(httpStatus).json(status);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Rotas da API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/ministries', ministriesRoutes);
app.use('/api/streams', streamsRoutes);
app.use('/api/pastoral-visits', pastoralVisitsRoutes);
app.use('/api/contributions', contributionsRoutes);

// Temporary backward compatibility route for old dashboard stats endpoint
app.get('/api/dashboard/stats', authenticateToken, requireMemberOrAbove, getDashboardStats);

app.use('/api/reports', reportsRoutes);

// Upload endpoints com rate limiting
app.use('/api/upload', uploadLimiter);

// Middleware de erro 404
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Servidor CCCP API iniciado na porta ${PORT}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;