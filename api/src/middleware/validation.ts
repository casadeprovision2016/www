import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const validateAndSanitize = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Log para debug
      console.log('🔍 Validating request body:', JSON.stringify(req.body, null, 2));
      
      // Sanitizar strings no corpo da requisição
      const sanitized = sanitizeObject(req.body);
      
      // Validar com Zod
      const validated = schema.parse(sanitized);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('❌ Validation error:', error.errors);
        res.status(400).json({
          success: false,
          error: 'Dados de entrada inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        console.log('❌ Validation error (not Zod):', error);
        res.status(400).json({
          success: false,
          error: 'Erro na validação dos dados'
        });
      }
    }
  };
};

const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

// Schemas de validação comuns
export const schemas = {
  // Eventos
  createEvent: z.object({
    title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
    description: z.string().max(2000, 'Descrição muito longa').optional(),
    date: z.string().min(1, 'Data é obrigatória'),
    time: z.string().min(1, 'Hora é obrigatória'),
    location: z.string().max(200, 'Local muito longo').optional(),
    category: z.string().optional(), // Opcional pois não existe na tabela
    capacity: z.number().int().positive().max(1000).optional()
  }),

  updateEvent: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    date: z.string().min(1).optional(),
    time: z.string().min(1).optional(),
    location: z.string().max(200).optional(),
    category: z.string().optional(),
    capacity: z.number().int().positive().max(1000).optional()
  }),

  // Membros - Schema flexível para criação completa
  createMember: z.object({
    // Opção 1: ID de usuário existente
    user_id: z.string().uuid('ID do usuário inválido').optional(),
    
    // Opção 2: Dados para criar novo usuário
    name: z.string().min(1, 'Nome é obrigatório').max(200).optional(),
    email: z.string().email('Email inválido').optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    birthDate: z.string().optional(), // Data de nascimento
    
    // Dados específicos do membro
    tipo_membro: z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
    membership_type: z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
    membershipType: z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(), // Inglês
    data_ingresso: z.string().optional(),
    join_date: z.string().optional(),
    joinDate: z.string().optional(), // Inglês
    ministry: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive', 'ativo', 'inativo']).optional(),
    observacoes: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional()
  }).refine(data => {
    // Deve ter user_id OU dados para criar usuário
    const hasUserId = data.user_id;
    const hasUserData = data.name && data.email;
    return hasUserId || hasUserData;
  }, {
    message: 'Deve fornecer user_id ou dados completos (name, email) para criar usuário'
  }),

  updateMember: z.object({
    // Campos em português (banco de dados)
    tipo_membro: z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
    status: z.enum(['ativo', 'inativo']).optional(),
    observacoes: z.string().max(1000).optional(),
    batizado: z.boolean().optional(),
    data_batismo: z.string().optional(),
    dizimista: z.boolean().optional(),
    data_saida: z.string().optional(),
    
    // Campos em inglês (frontend) - serão mapeados no controller
    membershipType: z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
    membership_type: z.enum(['efetivo', 'em_experiencia', 'congregado', 'visitante']).optional(),
    notes: z.string().max(1000).optional(),
    baptized: z.boolean().optional(),
    baptismDate: z.string().optional(),
    tithe: z.boolean().optional(),
    joinDate: z.string().optional(),
    endDate: z.string().optional(),
    end_date: z.string().optional()
  }),

  // Doações
  createDonation: z.object({
    user_id: z.string().uuid('ID do usuário inválido'),
    valor: z.number().positive('Valor deve ser positivo'),
    tipo: z.enum(['dizimo', 'oferta', 'missoes', 'outros']),
    descricao: z.string().max(500).optional(),
    data_doacao: z.string().datetime('Data da doação inválida')
  }),

  // Informações de doação (dados bancários)
  updateDonationInfo: z.object({
    iban: z.string().max(34).optional(),
    bic: z.string().max(11).optional(),
    titular: z.string().max(200).optional(),
    bizum: z.string().max(20).optional(),
    verse: z.string().max(200).optional(),
    additionalMethods: z.string().max(1000).optional(),
  }),

  // Streams
  createStream: z.object({
    // Campos em português
    titulo: z.string().min(1, 'Título é obrigatório').max(200).optional(),
    descricao: z.string().max(1000).optional(),
    url_stream: z.string().min(1, 'URL da stream é obrigatória').optional(),
    url_chat: z.string().optional(),
    data_inicio: z.string().min(1, 'Data de início é obrigatória').optional(),
    data_fim: z.string().optional().nullable(),
    status: z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
    evento_id: z.string().uuid().optional(),
    visualizacoes: z.number().int().min(0).optional(),
    gravacao_url: z.string().optional(),
    publico: z.boolean().optional(),
    senha: z.string().max(50).optional(),
    observacoes: z.string().optional(),
    // Campos em inglês (para compatibilidade com frontend)
    title: z.string().min(1, 'Title é obrigatório').max(200).optional(),
    description: z.string().max(1000).optional(),
    streamUrl: z.string().min(1, 'Stream URL é obrigatória').optional(),
    chatUrl: z.string().optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().optional().nullable(),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
    platform: z.string().optional(),
    eventId: z.string().uuid().optional(),
    views: z.number().int().min(0).optional(),
    recordingUrl: z.string().optional(),
    public: z.boolean().optional(),
    password: z.string().max(50).optional(),
    notes: z.string().optional(),
  }).refine(data => {
    // Pelo menos titulo/title e url_stream/streamUrl devem estar presentes
    const hasTitle = data.titulo || data.title;
    const hasStreamUrl = data.url_stream || data.streamUrl;
    return hasTitle && hasStreamUrl;
  }, {
    message: 'Título e URL da stream são obrigatórios'
  }),

  updateStream: z.object({
    // Campos em português
    titulo: z.string().min(1).max(200).optional(),
    descricao: z.string().max(1000).optional(),
    url_stream: z.string().min(1).optional(),
    url_chat: z.string().optional(),
    data_inicio: z.string().min(1).optional(),
    data_fim: z.string().optional().nullable(),
    status: z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
    evento_id: z.string().uuid().optional(),
    visualizacoes: z.number().int().min(0).optional(),
    gravacao_url: z.string().optional(),
    publico: z.boolean().optional(),
    senha: z.string().max(50).optional(),
    observacoes: z.string().optional(),
    // Campos em inglês (para compatibilidade com frontend)
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    streamUrl: z.string().min(1).optional(),
    chatUrl: z.string().optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().optional().nullable(),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
    platform: z.string().optional(),
    eventId: z.string().uuid().optional(),
    views: z.number().int().min(0).optional(),
    recordingUrl: z.string().optional(),
    public: z.boolean().optional(),
    password: z.string().max(50).optional(),
    notes: z.string().optional(),
  }),

  // Ministérios
  createMinistry: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    descricao: z.string().max(1000).optional(),
    lider_id: z.string().uuid('ID do líder inválido')
  }),

  // Visitantes
  createVisitor: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(255),
    email: z.string().email('Email inválido').max(255).optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    source: z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']).default('walk_in'),
    notes: z.string().optional(),
    followUpStatus: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).default('pending'),
    followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
    interestedInMembership: z.boolean().default(false),
  }),

  updateVisitor: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
    email: z.string().email('Email inválido').max(255).optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
    source: z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']).optional(),
    notes: z.string().optional(),
    followUpStatus: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).optional(),
    followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
    interestedInMembership: z.boolean().optional(),
  }),

  // Visitas Pastorais
  createPastoralVisit: z.object({
    visitado_id: z.string().uuid('ID do visitado inválido'),
    pastor_id: z.string().uuid('ID do pastor inválido'),
    data_visita: z.string().datetime('Data da visita inválida'),
    motivo: z.string().max(500).optional(),
    observacoes: z.string().max(1000).optional()
  }),

  // Login
  login: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
  }),

  // Query parameters
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  eventQuery: z.object({
    upcoming: z.coerce.boolean().optional(),
    past: z.coerce.boolean().optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    year: z.string().regex(/^\d{4}$/).optional()
  }),

  donationQuery: z.object({
    tipo: z.enum(['dizimo', 'oferta', 'missoes', 'outros']).optional(),
    user_id: z.string().uuid().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    min_amount: z.coerce.number().positive().optional(),
    max_amount: z.coerce.number().positive().optional()
  })
};