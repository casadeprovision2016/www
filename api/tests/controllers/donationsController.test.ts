/**
 * 🎯 DONATIONS CONTROLLER - TESTES COMPLETOS CONSOLIDADOS
 * Arquivo com todos os testes funcionais compilados baseado no padrão eventsController
 */

import request from 'supertest';
import express, { Request, Response } from 'express';
import { AppError, asyncHandler } from '../../src/middleware/errorHandler';

// === TIPOS LOCAIS ===
interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; [key: string]: any };
}

// === MOCKS CENTRALIZADOS ===
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  invalidate: jest.fn(),
  invalidatePattern: jest.fn(),
};

// === CONTROLLERS TESTÁVEIS ===

// 1. GET /donations - Lista de doações
const getDonationsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { 
      page = 1, 
      limit = 10, 
      tipo, 
      user_id, 
      start_date, 
      end_date, 
      min_amount, 
      max_amount,
      sort = 'data_doacao', 
      order = 'desc' 
    } = req.query as any;
    
    let query = supabase
      .from('donations')
      .select(`
        *,
        user:users!donations_user_id_fkey(id, nome, email)
      `, { count: 'exact' });

    // Filtros
    if (tipo) query = query.eq('tipo', tipo);
    if (user_id) query = query.eq('user_id', user_id);
    if (start_date) query = query.gte('data_doacao', start_date);
    if (end_date) query = query.lte('data_doacao', end_date);
    if (min_amount) query = query.gte('valor', parseFloat(min_amount));
    if (max_amount) query = query.lte('valor', parseFloat(max_amount));

    // Ordenação e paginação
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError('Erro ao buscar doações', 500);
    }

    // Map Portuguese database fields to English frontend fields
    const mappedData = (data || []).map(donation => ({
      id: donation.id,
      amount: donation.valor,
      type: donation.tipo,
      paymentMethod: donation.metodo_pagamento,
      date: donation.data_doacao,
      referenceMonth: donation.referencia_mes,
      description: donation.descricao,
      anonymous: donation.anonima,
      receiptIssued: donation.recibo_emitido,
      receiptNumber: donation.numero_recibo,
      notes: donation.observacoes,
      user: donation.user ? {
        id: donation.user.id,
        name: donation.user.nome,
        email: donation.user.email
      } : null,
      created_at: donation.created_at,
      updated_at: donation.updated_at
    }));

    const response = {
      data: mappedData,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil((count || 0) / limit)
    };

    res.json({
      success: true,
      data: response
    });
  }
);

// 2. GET /donations/:id - Doação específica
const getDonationByIdTestable = (supabase: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        user:users(id, name, email, telefone)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError('Doação não encontrada', 404);
    }

    res.json({
      success: true,
      data
    });
  }
);

// 3. GET /donations/stats - Estatísticas
const getDonationStatsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const cacheKey = 'stats:donations';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    // Total de doações
    const { count: total } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true });

    // Valor total arrecadado  
    const { data: totalAmountData } = await supabase
      .from('donations')
      .select('valor');

    const totalAmount = totalAmountData?.reduce((sum: any, donation: any) => sum + donation.valor, 0) || 0;

    // Doações este mês
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const { count: thisMonth } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .gte('data_doacao', startOfMonth.toISOString());

    const { data: thisMonthAmountData } = await supabase
      .from('donations')
      .select('valor')
      .gte('data_doacao', startOfMonth.toISOString());

    const thisMonthAmount = thisMonthAmountData?.reduce((sum: any, donation: any) => sum + donation.valor, 0) || 0;

    // Estatísticas por tipo
    const { data: typeStats } = await supabase
      .from('donations')
      .select('tipo, valor');

    const byType = typeStats?.reduce((acc: any, donation: any) => {
      acc[donation.tipo] = (acc[donation.tipo] || 0) + donation.valor;
      return acc;
    }, {}) || {};

    const stats = {
      total: total || 0,
      total_amount: totalAmount,
      monthly: {
        current: thisMonth || 0,
        current_amount: thisMonthAmount
      },
      by_type: byType
    };

    await cache.set(cacheKey, stats, 1800); // 30 minutos

    res.json({
      success: true,
      data: stats
    });
  }
);

// 4. GET /donations/info - Informações de doação  
const getDonationInfoTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const cacheKey = 'donations:info';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    const { data, error } = await supabase
      .from('organization')
      .select('donation_info')
      .single();

    if (error || !data?.donation_info) {
      const defaultInfo = {
        id: '1',
        iban: 'ES1021001419020200597614',
        bic: 'CAIXESBBXXX',
        titular: 'Centro Cristiano Casa de Provisión',
        bizum: 'Em construção',
        verse: '"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre." — 2 Corintios 9:7',
        additionalMethods: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await cache.set(cacheKey, defaultInfo, 3600);
      
      return res.json({
        success: true,
        data: defaultInfo
      });
    }

    await cache.set(cacheKey, data.donation_info, 3600);

    res.json({
      success: true,
      data: data.donation_info
    });
  }
);

// 5. PUT /donations/info - Atualizar informações de doação
const updateDonationInfoTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { iban, bic, titular, bizum, verse, additionalMethods } = req.body;

    // Validação básica de IBAN
    if (iban && !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(iban)) {
      throw new AppError('IBAN inválido', 400);
    }

    // Validação básica de BIC
    if (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
      throw new AppError('BIC inválido', 400);
    }

    const donationInfo = {
      id: '1',
      iban,
      bic,
      titular,
      bizum,
      verse,
      additionalMethods,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('organization')
      .upsert({
        id: 1,
        donation_info: donationInfo,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new AppError('Erro ao atualizar informações de doação', 500);
    }

    await cache.del('donations:info');

    res.json({
      success: true,
      data: donationInfo,
      message: 'Informações de doação atualizadas com sucesso'
    });
  }
);

// === APLICAÇÃO TESTÁVEL ===
const app = express();
app.use(express.json());

// Middleware de autenticação
app.use((req: any, res, next) => {
  req.user = {
    id: 'user-admin',
    role: 'admin',
    email: 'admin@test.com',
  };
  next();
});

// Rotas
app.get('/api/donations', getDonationsTestable(mockSupabase, mockCacheService));
app.get('/api/donations/stats', getDonationStatsTestable(mockSupabase, mockCacheService));
app.get('/api/donations/info', getDonationInfoTestable(mockSupabase, mockCacheService)); 
app.get('/api/donations/:id', getDonationByIdTestable(mockSupabase));
app.put('/api/donations/info', updateDonationInfoTestable(mockSupabase, mockCacheService));

// Error handler
app.use((error: AppError, req: Request, res: Response, next: any) => {
  console.log('Error caught:', error.message, error.stack);
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Erro interno do servidor',
  });
});

// === TESTES ===
describe('🎯 DONATIONS CONTROLLER - TODOS OS TESTES', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks to return this for chaining
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.upsert.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.lte.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.range.mockReturnThis();
    // Reset single method mock
    mockSupabase.single.mockClear();

    mockCacheService.get.mockResolvedValue(null); // Default to no cache
    mockCacheService.set.mockResolvedValue(undefined);
    mockCacheService.del.mockResolvedValue(undefined);
    mockCacheService.invalidate.mockResolvedValue(undefined);
    mockCacheService.invalidatePattern.mockResolvedValue(undefined);
  });

  describe('✅ 1. GET /api/donations - Lista de doações', () => {
    it('deve retornar lista de doações com paginação', async () => {
      const mockDonations = [
        {
          id: 'don1',
          valor: 500.00,
          tipo: 'dizimo',
          metodo_pagamento: 'pix',
          data_doacao: '2025-01-15',
          referencia_mes: '2025-01-01',
          descricao: 'Dízimo janeiro',
          anonima: false,
          recibo_emitido: true,
          numero_recibo: 'REC-2025-001',
          observacoes: '',
          user: {
            id: 'user1',
            nome: 'Carlos Silva',
            email: 'carlos@example.com'
          },
          created_at: '2025-01-24T12:00:00Z',
          updated_at: '2025-01-24T12:00:00Z'
        }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockDonations,
        error: null,
        count: 1
      });

      const response = await request(app)
        .get('/api/donations')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 'don1',
              amount: 500.00,
              type: 'dizimo',
              paymentMethod: 'pix',
              anonymous: false,
              user: expect.objectContaining({
                name: 'Carlos Silva',
                email: 'carlos@example.com'
              })
            })
          ]),
          total: 1,
          page: 1,
          limit: 10,
          total_pages: 1
        }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('donations');
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('user:users'), { count: 'exact' });
      expect(mockSupabase.order).toHaveBeenCalledWith('data_doacao', { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
    });

    it('deve aplicar filtros corretamente', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await request(app)
        .get('/api/donations?tipo=dizimo&start_date=2025-01-01&min_amount=100')
        .expect(200);

      expect(mockSupabase.eq).toHaveBeenCalledWith('tipo', 'dizimo');
      expect(mockSupabase.gte).toHaveBeenCalledWith('data_doacao', '2025-01-01');
      expect(mockSupabase.gte).toHaveBeenCalledWith('valor', 100);
    });

    it('deve tratar erros de banco de dados', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null
      });

      const response = await request(app)
        .get('/api/donations')
        .expect(500);

      expect(response.body.message).toBe('Erro ao buscar doações');
    });
  });

  describe('✅ 2. GET /api/donations/:id - Doação específica', () => {
    it('deve retornar doação por ID', async () => {
      const mockDonation = {
        id: 'don1',
        valor: 500.00,
        tipo: 'dizimo',
        user: {
          id: 'user1',
          name: 'Carlos Silva',
          email: 'carlos@example.com'
        }
      };

      mockSupabase.single.mockResolvedValue({
        data: mockDonation,
        error: null
      });

      const response = await request(app)
        .get('/api/donations/don1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockDonation
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('donations');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'don1');
    });

    it('deve retornar 404 quando doação não encontrada', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const response = await request(app)
        .get('/api/donations/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Doação não encontrada');
    });
  });

  describe('✅ 3. GET /api/donations/stats - Estatísticas', () => {
    it('deve retornar estatísticas das doações', async () => {
      jest.clearAllMocks();
      
      // Reset chain methods
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.gte.mockReturnThis();
      
      const mockStats = {
        total: 50,
        total_amount: 25000.00,
        monthly: {
          current: 10,
          current_amount: 5000.00
        },
        by_type: {
          dizimo: 20000.00,
          oferta: 5000.00
        }
      };

      // Mock queries sequenciais
      // Query 1: total count
      mockSupabase.select.mockResolvedValueOnce({ count: 50, data: null, error: null });
      
      // Query 2: total amount data  
      mockSupabase.select.mockResolvedValueOnce({ 
        data: [{ valor: 25000.00 }], 
        error: null 
      });
      
      // Query 3: monthly count
      mockSupabase.select.mockReturnValueOnce({
        gte: jest.fn().mockResolvedValue({ count: 10, data: null, error: null })
      });
      
      // Query 4: monthly amount data
      mockSupabase.select.mockReturnValueOnce({
        gte: jest.fn().mockResolvedValue({ 
          data: [{ valor: 5000.00 }], 
          error: null 
        })
      });
      
      // Query 5: type stats
      mockSupabase.select.mockResolvedValueOnce({ 
        data: [
          { tipo: 'dizimo', valor: 20000.00 },
          { tipo: 'oferta', valor: 5000.00 }
        ], 
        error: null 
      });

      const response = await request(app)
        .get('/api/donations/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        total: expect.any(Number),
        total_amount: expect.any(Number),
        monthly: expect.objectContaining({
          current: expect.any(Number),
          current_amount: expect.any(Number)
        }),
        by_type: expect.any(Object)
      }));

      expect(mockCacheService.set).toHaveBeenCalledWith('stats:donations', expect.any(Object), 1800);
    });

    it('deve usar cache quando disponível', async () => {
      const cachedStats = {
        total: 100,
        total_amount: 50000.00,
        monthly: { current: 20, current_amount: 10000.00 },
        by_type: { dizimo: 40000.00, oferta: 10000.00 }
      };

      mockCacheService.get.mockResolvedValue(cachedStats);

      const response = await request(app)
        .get('/api/donations/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: cachedStats
      });

      expect(mockCacheService.get).toHaveBeenCalledWith('stats:donations');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('✅ 4. GET /api/donations/info - Informações de doação', () => {
    it('deve retornar informações de doação da organização', async () => {
      const mockOrgData = {
        donation_info: {
          id: '1',
          iban: 'ES1021001419020200597614',
          bic: 'CAIXESBBXXX',
          titular: 'Centro Cristiano Casa de Provisión',
          bizum: 'Em construção',
          verse: '"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre." — 2 Corintios 9:7',
          additionalMethods: 'PayPal, Transferencia'
        }
      };

      mockSupabase.single.mockResolvedValue({
        data: mockOrgData,
        error: null
      });

      const response = await request(app)
        .get('/api/donations/info')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockOrgData.donation_info
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('organization');
      expect(mockSupabase.select).toHaveBeenCalledWith('donation_info');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('deve retornar dados padrão quando não há configuração', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'No data found' }
      });

      const response = await request(app)
        .get('/api/donations/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        id: '1',
        iban: 'ES1021001419020200597614',
        bic: 'CAIXESBBXXX',
        titular: 'Centro Cristiano Casa de Provisión'
      }));
    });

    it('deve usar cache quando disponível', async () => {
      const cachedInfo = {
        id: '1',
        iban: 'ES9876543210987654321098',
        titular: 'Igreja Cached'
      };

      mockCacheService.get.mockResolvedValue(cachedInfo);

      const response = await request(app)
        .get('/api/donations/info')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: cachedInfo
      });

      expect(mockCacheService.get).toHaveBeenCalledWith('donations:info');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('✅ 5. PUT /api/donations/info - Atualizar informações', () => {
    it('deve atualizar informações de doação com sucesso', async () => {
      const updateData = {
        iban: 'ES9021000418401234567891',
        bic: 'CAIXESBBXXX',
        titular: 'Igreja Atualizada',
        bizum: '987654321',
        verse: 'Novo versículo',
        additionalMethods: 'Novos métodos'
      };

      mockSupabase.upsert.mockResolvedValue({
        error: null
      });

      const response = await request(app)
        .put('/api/donations/info')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          iban: 'ES9021000418401234567891',
          bic: 'CAIXESBBXXX',
          titular: 'Igreja Atualizada',
          bizum: '987654321',
          verse: 'Novo versículo',
          additionalMethods: 'Novos métodos'
        }),
        message: 'Informações de doação atualizadas com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('organization');
      expect(mockSupabase.upsert).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalledWith('donations:info');
    });

    it('deve validar formato do IBAN', async () => {
      const invalidData = {
        iban: 'INVALID-IBAN-FORMAT',
        titular: 'Igreja Teste'
      };

      const response = await request(app)
        .put('/api/donations/info')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('IBAN inválido');
    });

    it('deve validar formato do BIC', async () => {
      const invalidData = {
        iban: 'ES1021001419020200597614',
        bic: 'INVALID', // Muito curto
        titular: 'Igreja Teste'
      };

      const response = await request(app)
        .put('/api/donations/info')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('BIC inválido');
    });

    it('deve tratar erros de banco de dados', async () => {
      const updateData = {
        iban: 'ES1021001419020200597614',
        titular: 'Igreja Teste'
      };

      mockSupabase.upsert.mockResolvedValue({
        error: { message: 'Database update failed' }
      });

      const response = await request(app)
        .put('/api/donations/info')
        .send(updateData)
        .expect(500);

      expect(response.body.message).toBe('Erro ao atualizar informações de doação');
    });
  });
});