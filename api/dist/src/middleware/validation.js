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
            // Log para debug
            console.log('🔍 Validating request body:', JSON.stringify(req.body, null, 2));
            // Sanitizar strings no corpo da requisição
            const sanitized = sanitizeObject(req.body);
            // Validar com Zod
            const validated = schema.parse(sanitized);
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.log('❌ Validation error:', error.errors);
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
                console.log('❌ Validation error (not Zod):', error);
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
    // Membros - Schema flexível para criação completa
    createMember: zod_1.z.object({
        // Opção 1: ID de usuário existente
        user_id: zod_1.z.string().uuid('ID do usuário inválido').optional(),
        // Opção 2: Dados para criar novo usuário
        name: zod_1.z.string().min(1, 'Nome é obrigatório').max(200).optional(),
        email: zod_1.z.string().email('Email inválido').optional(),
        phone: zod_1.z.string().max(20).optional(),
        address: zod_1.z.string().max(500).optional(),
        birthDate: zod_1.z.string().optional(), // Data de nascimento
        // Dados específicos do membro
        tipo_membro: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
        membership_type: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
        membershipType: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(), // Inglês
        data_ingresso: zod_1.z.string().optional(),
        join_date: zod_1.z.string().optional(),
        joinDate: zod_1.z.string().optional(), // Inglês
        ministry: zod_1.z.string().max(100).optional(),
        status: zod_1.z.enum(['active', 'inactive', 'ativo', 'inativo']).optional(),
        observacoes: zod_1.z.string().max(1000).optional(),
        notes: zod_1.z.string().max(1000).optional()
    }).refine(data => {
        // Deve ter user_id OU dados para criar usuário
        const hasUserId = data.user_id;
        const hasUserData = data.name && data.email;
        return hasUserId || hasUserData;
    }, {
        message: 'Deve fornecer user_id ou dados completos (name, email) para criar usuário'
    }),
    updateMember: zod_1.z.object({
        // Campos em português (banco de dados)
        tipo_membro: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
        status: zod_1.z.enum(['ativo', 'inativo']).optional(),
        observacoes: zod_1.z.string().max(1000).optional(),
        batizado: zod_1.z.boolean().optional(),
        data_batismo: zod_1.z.string().optional(),
        dizimista: zod_1.z.boolean().optional(),
        data_saida: zod_1.z.string().optional(),
        // Campos em inglês (frontend) - serão mapeados no controller
        membershipType: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
        membership_type: zod_1.z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
        notes: zod_1.z.string().max(1000).optional(),
        baptized: zod_1.z.boolean().optional(),
        baptismDate: zod_1.z.string().optional(),
        tithe: zod_1.z.boolean().optional(),
        joinDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        end_date: zod_1.z.string().optional()
    }),
    // Doações
    createDonation: zod_1.z.object({
        user_id: zod_1.z.string().uuid('ID do usuário inválido'),
        valor: zod_1.z.number().positive('Valor deve ser positivo'),
        tipo: zod_1.z.enum(['dizimo', 'oferta', 'missoes', 'outros']),
        descricao: zod_1.z.string().max(500).optional(),
        data_doacao: zod_1.z.string().datetime('Data da doação inválida')
    }),
    // Informações de doação (dados bancários)
    updateDonationInfo: zod_1.z.object({
        iban: zod_1.z.string().max(34).optional(),
        bic: zod_1.z.string().max(11).optional(),
        titular: zod_1.z.string().max(200).optional(),
        bizum: zod_1.z.string().max(20).optional(),
        verse: zod_1.z.string().max(200).optional(),
        additionalMethods: zod_1.z.string().max(1000).optional(),
    }),
    // Streams
    createStream: zod_1.z.object({
        // Campos em português
        titulo: zod_1.z.string().min(1, 'Título é obrigatório').max(200).optional(),
        descricao: zod_1.z.string().max(1000).optional(),
        url_stream: zod_1.z.string().min(1, 'URL da stream é obrigatória').optional(),
        url_chat: zod_1.z.string().optional(),
        data_inicio: zod_1.z.string().min(1, 'Data de início é obrigatória').optional(),
        data_fim: zod_1.z.string().optional().nullable(),
        status: zod_1.z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
        evento_id: zod_1.z.string().uuid().optional(),
        visualizacoes: zod_1.z.number().int().min(0).optional(),
        gravacao_url: zod_1.z.string().optional(),
        publico: zod_1.z.boolean().optional(),
        senha: zod_1.z.string().max(50).optional(),
        observacoes: zod_1.z.string().optional(),
        // Campos em inglês (para compatibilidade com frontend)
        title: zod_1.z.string().min(1, 'Title é obrigatório').max(200).optional(),
        description: zod_1.z.string().max(1000).optional(),
        streamUrl: zod_1.z.string().min(1, 'Stream URL é obrigatória').optional(),
        chatUrl: zod_1.z.string().optional(),
        startDate: zod_1.z.string().min(1).optional(),
        endDate: zod_1.z.string().optional().nullable(),
        scheduledDate: zod_1.z.string().optional(),
        scheduledTime: zod_1.z.string().optional(),
        platform: zod_1.z.string().optional(),
        eventId: zod_1.z.string().uuid().optional(),
        views: zod_1.z.number().int().min(0).optional(),
        recordingUrl: zod_1.z.string().optional(),
        public: zod_1.z.boolean().optional(),
        password: zod_1.z.string().max(50).optional(),
        notes: zod_1.z.string().optional(),
    }).refine(data => {
        // Pelo menos titulo/title e url_stream/streamUrl devem estar presentes
        const hasTitle = data.titulo || data.title;
        const hasStreamUrl = data.url_stream || data.streamUrl;
        return hasTitle && hasStreamUrl;
    }, {
        message: 'Título e URL da stream são obrigatórios'
    }),
    updateStream: zod_1.z.object({
        // Campos em português
        titulo: zod_1.z.string().min(1).max(200).optional(),
        descricao: zod_1.z.string().max(1000).optional(),
        url_stream: zod_1.z.string().min(1).optional(),
        url_chat: zod_1.z.string().optional(),
        data_inicio: zod_1.z.string().min(1).optional(),
        data_fim: zod_1.z.string().optional().nullable(),
        status: zod_1.z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
        evento_id: zod_1.z.string().uuid().optional(),
        visualizacoes: zod_1.z.number().int().min(0).optional(),
        gravacao_url: zod_1.z.string().optional(),
        publico: zod_1.z.boolean().optional(),
        senha: zod_1.z.string().max(50).optional(),
        observacoes: zod_1.z.string().optional(),
        // Campos em inglês (para compatibilidade com frontend)
        title: zod_1.z.string().min(1).max(200).optional(),
        description: zod_1.z.string().max(1000).optional(),
        streamUrl: zod_1.z.string().min(1).optional(),
        chatUrl: zod_1.z.string().optional(),
        startDate: zod_1.z.string().min(1).optional(),
        endDate: zod_1.z.string().optional().nullable(),
        scheduledDate: zod_1.z.string().optional(),
        scheduledTime: zod_1.z.string().optional(),
        platform: zod_1.z.string().optional(),
        eventId: zod_1.z.string().uuid().optional(),
        views: zod_1.z.number().int().min(0).optional(),
        recordingUrl: zod_1.z.string().optional(),
        public: zod_1.z.boolean().optional(),
        password: zod_1.z.string().max(50).optional(),
        notes: zod_1.z.string().optional(),
    }),
    // Ministérios
    createMinistry: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100),
        descricao: zod_1.z.string().max(1000).optional(),
        lider_id: zod_1.z.string().uuid('ID do líder inválido')
    }),
    // Visitantes
    createVisitor: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Nome é obrigatório').max(255),
        email: zod_1.z.string().email('Email inválido').max(255).optional(),
        phone: zod_1.z.string().max(50).optional(),
        address: zod_1.z.string().optional(),
        visitDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
        source: zod_1.z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']).default('walk_in'),
        notes: zod_1.z.string().optional(),
        followUpStatus: zod_1.z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).default('pending'),
        followUpDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
        interestedInMembership: zod_1.z.boolean().default(false),
    }),
    updateVisitor: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Nome é obrigatório').max(255).optional(),
        email: zod_1.z.string().email('Email inválido').max(255).optional(),
        phone: zod_1.z.string().max(50).optional(),
        address: zod_1.z.string().optional(),
        visitDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
        source: zod_1.z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']).optional(),
        notes: zod_1.z.string().optional(),
        followUpStatus: zod_1.z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).optional(),
        followUpDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
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