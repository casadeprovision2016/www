import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const validateAndSanitize = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitizar strings no corpo da requisição
      const sanitized = sanitizeObject(req.body);
      
      // Validar com Zod
      const validated = schema.parse(sanitized);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Dados de entrada inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
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

  // Membros
  createMember: z.object({
    user_id: z.string().uuid('ID do usuário inválido'),
    membership_type: z.enum(['efetivo', 'em_experiencia', 'congregado']),
    join_date: z.string().datetime('Data de ingresso inválida'),
    observacoes: z.string().max(1000).optional()
  }),

  updateMember: z.object({
    membership_type: z.enum(['efetivo', 'em_experiencia', 'congregado']).optional(),
    status: z.enum(['ativo', 'inativo']).optional(),
    end_date: z.string().datetime().optional(),
    observacoes: z.string().max(1000).optional()
  }),

  // Doações
  createDonation: z.object({
    user_id: z.string().uuid('ID do usuário inválido'),
    valor: z.number().positive('Valor deve ser positivo'),
    tipo: z.enum(['dizimo', 'oferta', 'missoes', 'outros']),
    descricao: z.string().max(500).optional(),
    data_doacao: z.string().datetime('Data da doação inválida')
  }),

  // Streams
  createStream: z.object({
    title: z.string().min(1, 'Título é obrigatório').max(200),
    description: z.string().max(1000).optional(),
    streamUrl: z.string().url('URL da stream inválida'),
    startDate: z.string().datetime('Data de início inválida'),
    endDate: z.string().datetime('Data de fim inválida').optional().nullable(),
    status: z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
    public: z.boolean().optional(),
  }),

  updateStream: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    streamUrl: z.string().url('URL da stream inválida').optional(),
    startDate: z.string().datetime('Data de início inválida').optional(),
    endDate: z.string().datetime('Data de fim inválida').optional(),
    status: z.enum(['agendado', 'ao_vivo', 'finalizado', 'cancelado']).optional(),
    public: z.boolean().optional(),
  }),

  // Ministérios
  createMinistry: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    descricao: z.string().max(1000).optional(),
    lider_id: z.string().uuid('ID do líder inválido')
  }),

  // Visitantes
  createVisitor: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    email: z.string().email('Email inválido').optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(200).optional(),
    visitDate: z.string().datetime('Data da visita inválida'),
    source: z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']), // Adicione as opções de fonte
    notes: z.string().max(1000).optional(),
    followUpStatus: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).optional(),
    followUpDate: z.string().datetime().optional(),
    interestedInMembership: z.boolean().optional(),
  }),

  updateVisitor: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100).optional(),
    email: z.string().email('Email inválido').optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(200).optional(),
    visitDate: z.string().datetime('Data da visita inválida').optional(),
    source: z.enum(['invitation', 'social_media', 'walk_in', 'website', 'other']).optional(),
    notes: z.string().max(1000).optional(),
    followUpStatus: z.enum(['pending', 'contacted', 'scheduled', 'completed', 'no_interest']).optional(),
    followUpDate: z.string().datetime().optional(),
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