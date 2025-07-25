"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validateAndSanitize = void 0;
const zod_1 = require("zod");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const validateAndSanitize = (schema) => {
    return (req, res, next) => {
        try {
            // Sanitizar strings no corpo da requisição
            const sanitized = sanitizeObject(req.body);
            // Validar com Zod
            const validated = schema.parse(sanitized);
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Dados de entrada inválidos',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: 'Erro na validação dos dados'
                });
            }
        }
    };
};
exports.validateAndSanitize = validateAndSanitize;
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return isomorphic_dompurify_1.default.sanitize(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
};
// Schemas de validação comuns
exports.schemas = {
    // Eventos
    createEvent: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
        description: zod_1.z.string().max(2000, 'Descrição muito longa').optional(),
        date: zod_1.z.string().min(1, 'Data é obrigatória'),
        time: zod_1.z.string().min(1, 'Hora é obrigatória'),
        location: zod_1.z.string().max(200, 'Local muito longo').optional(),
        category: zod_1.z.string().optional(), // Opcional pois não existe na tabela
        capacity: zod_1.z.number().int().positive().max(1000).optional()
    }),
    updateEvent: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200).optional(),
        description: zod_1.z.string().max(2000).optional(),
        date: zod_1.z.string().min(1).optional(),
        time: zod_1.z.string().min(1).optional(),
        location: zod_1.z.string().max(200).optional(),
        category: zod_1.z.string().optional(),
        capacity: zod_1.z.number().int().positive().max(1000).optional()
    }),
    // Membros
    createMember: zod_1.z.object({
        user_id: zod_1.z.string().uuid('ID do usuário inválido'),
        membership_type: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado']),
        join_date: zod_1.z.string().datetime('Data de ingresso inválida'),
        observacoes: zod_1.z.string().max(1000).optional()
    }),
    updateMember: zod_1.z.object({
        membership_type: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado']).optional(),
        status: zod_1.z.enum(['ativo', 'inativo']).optional(),
        end_date: zod_1.z.string().datetime().optional(),
        observacoes: zod_1.z.string().max(1000).optional()
    }),
    // Doações
    createDonation: zod_1.z.object({
        user_id: zod_1.z.string().uuid('ID do usuário inválido'),
        valor: zod_1.z.number().positive('Valor deve ser positivo'),
        tipo: zod_1.z.enum(['dizimo', 'oferta', 'missoes', 'outros']),
        descricao: zod_1.z.string().max(500).optional(),
        data_doacao: zod_1.z.string().datetime('Data da doação inválida')
    }),
    // Streams
    createStream: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Título é obrigatório').max(200),
        description: zod_1.z.string().max(1000).optional(),
        streamUrl: zod_1.z.string().url('URL da stream inválida'),
        startDate: zod_1.z.string().datetime('Data de início inválida'),
        endDate: zod_1.z.string().datetime('Data de fim inválida').optional().nullable(),
        status: zod_1.z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
        public: zod_1.z.boolean().optional(),
    }),
    updateStream: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200).optional(),
        description: zod_1.z.string().max(1000).optional(),
        streamUrl: zod_1.z.string().url('URL da stream inválida').optional(),
        startDate: zod_1.z.string().datetime('Data de início inválida').optional(),
        endDate: zod_1.z.string().datetime('Data de fim inválida').optional(),
        status: zod_1.z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
        public: zod_1.z.boolean().optional(),
    }),
    // Ministérios
    createMinistry: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100),
        descricao: zod_1.z.string().max(1000).optional(),
        lider_id: zod_1.z.string().uuid('ID do líder inválido')
    }),
    // Visitantes
    createVisitor: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100),
        email: zod_1.z.string().email('Email inválido').optional(),
        phone: zod_1.z.string().max(20).optional(),
        address: zod_1.z.string().max(200).optional(),
        visitDate: zod_1.z.string().datetime('Data da visita inválida'),
        source: zod_1.z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']), // Adicione as opções de fonte
        notes: zod_1.z.string().max(1000).optional(),
        followUpStatus: zod_1.z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).optional(),
        followUpDate: zod_1.z.string().datetime().optional(),
        interestedInMembership: zod_1.z.boolean().optional(),
    }),
    updateVisitor: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100).optional(),
        email: zod_1.z.string().email('Email inválido').optional(),
        phone: zod_1.z.string().max(20).optional(),
        address: zod_1.z.string().max(200).optional(),
        visitDate: zod_1.z.string().datetime('Data da visita inválida').optional(),
        source: zod_1.z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']).optional(),
        notes: zod_1.z.string().max(1000).optional(),
        followUpStatus: zod_1.z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).optional(),
        followUpDate: zod_1.z.string().datetime().optional(),
        interestedInMembership: zod_1.z.boolean().optional(),
    }),
    // Visitas Pastorais
    createPastoralVisit: zod_1.z.object({
        visitado_id: zod_1.z.string().uuid('ID do visitado inválido'),
        pastor_id: zod_1.z.string().uuid('ID do pastor inválido'),
        data_visita: zod_1.z.string().datetime('Data da visita inválida'),
        motivo: zod_1.z.string().max(500).optional(),
        observacoes: zod_1.z.string().max(1000).optional()
    }),
    // Login
    login: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        password: zod_1.z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
    }),
    // Query parameters
    pagination: zod_1.z.object({
        page: zod_1.z.coerce.number().int().positive().default(1),
        limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
        sort: zod_1.z.string().optional(),
        order: zod_1.z.enum(['asc', 'desc']).default('desc')
    }),
    eventQuery: zod_1.z.object({
        upcoming: zod_1.z.coerce.boolean().optional(),
        past: zod_1.z.coerce.boolean().optional(),
        month: zod_1.z.string().regex(/^\d{4}-\d{2}$/).optional(),
        year: zod_1.z.string().regex(/^\d{4}$/).optional()
    }),
    donationQuery: zod_1.z.object({
        tipo: zod_1.z.enum(['dizimo', 'oferta', 'missoes', 'outros']).optional(),
        user_id: zod_1.z.string().uuid().optional(),
        start_date: zod_1.z.string().datetime().optional(),
        end_date: zod_1.z.string().datetime().optional(),
        min_amount: zod_1.z.coerce.number().positive().optional(),
        max_amount: zod_1.z.coerce.number().positive().optional()
    })
};
//# sourceMappingURL=validation.js.map