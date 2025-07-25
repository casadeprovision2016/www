"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const cacheService_1 = require("./services/cacheService");
// Importar rotas
const auth_1 = __importDefault(require("./routes/auth"));
const events_1 = __importDefault(require("./routes/events"));
const members_1 = __importDefault(require("./routes/members"));
const donations_1 = __importDefault(require("./routes/donations"));
const ministries_1 = __importDefault(require("./routes/ministries"));
const streams_1 = __importDefault(require("./routes/streams"));
const pastoralVisits_1 = __importDefault(require("./routes/pastoralVisits"));
const contributions_1 = __importDefault(require("./routes/contributions"));
const visitors_1 = __importDefault(require("./routes/visitors"));
const reports_1 = __importDefault(require("./routes/reports"));
const auth_2 = require("./middleware/auth");
const reportsController_1 = require("./controllers/reportsController");
const app = (0, express_1.default)();
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
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permite requisições sem origin (como Postman ou apps mobile)
        if (!origin)
            return callback(null, true);
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(logger_1.requestLogger);
// Rate limiting geral (DESABILITADO PARA DESENVOLVIMENTO)
const generalLimiter = (0, express_rate_limit_1.default)({
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
const authLimiter = (0, express_rate_limit_1.default)({
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
const uploadLimiter = (0, express_rate_limit_1.default)({
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
        const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { error: dbError } = await supabase
            .from('users')
            .select('id')
            .limit(1);
        // Verificar Redis
        const redisHealthy = await cacheService_1.cacheService.healthCheck();
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
    }
    catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Service unavailable'
        });
    }
});
// Rotas da API
app.use('/api/auth', authLimiter, auth_1.default);
app.use('/api/events', events_1.default);
app.use('/api/members', members_1.default);
app.use('/api/donations', donations_1.default);
app.use('/api/ministries', ministries_1.default);
app.use('/api/streams', streams_1.default);
app.use('/api/pastoral-visits', pastoralVisits_1.default);
app.use('/api/contributions', contributions_1.default);
app.use('/api/visitors', visitors_1.default);
// Temporary backward compatibility route for old dashboard stats endpoint
app.get('/api/dashboard/stats', auth_2.authenticateToken, auth_2.requireMemberOrAbove, reportsController_1.getDashboardStats);
app.use('/api/reports', reports_1.default);
// Upload endpoints com rate limiting
app.use('/api/upload', uploadLimiter);
// Middleware de erro 404
app.use(errorHandler_1.notFoundHandler);
// Middleware de tratamento de erros
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Iniciar servidor
app.listen(PORT, () => {
    logger_1.logger.info(`Servidor CCCP API iniciado na porta ${PORT}`);
    logger_1.logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logger_1.logger.info(`Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=app.js.map