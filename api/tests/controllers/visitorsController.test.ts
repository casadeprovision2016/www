/**
 * 🎯 VISITORS CONTROLLER - TESTES COMPLETOS CONSOLIDADOS
 * Aplicando a mesma estratégia dos testes de Events Controller
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
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  invalidatePattern: jest.fn(),
};

// === CONTROLLERS TESTÁVEIS ===

// 1. GET /visitors - Lista de visitantes
const getVisitorsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from('visitors').select('*', { count: 'exact' });

    // Filtros
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError(error.message, 500);

    const pagination = {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    };

    res.json({
      success: true,
      data: { visitors: data || [], pagination },
    });
  }
);

// 2. GET /visitors/:id - Visitante específico
const getVisitorByIdTestable = (supabase: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('Visitante não encontrado', 404);

    res.json({ success: true, data });
  }
);

// 3. POST /visitors - Criar visitante
const createVisitorTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { nome, email, telefone, origem_visita } = req.body;

    if (!nome || !email) {
      throw new AppError('Nome e email são obrigatórios', 400);
    }

    const visitorData = {
      nome,
      email,
      telefone,
      origem_visita,
      data_primeira_visita: new Date().toISOString(),
      status: 'ativo',
      created_by: req.user?.id,
    };

    const { data, error } = await supabase
      .from('visitors')
      .insert(visitorData)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    await cache.invalidatePattern('visitors:*');

    res.status(201).json({
      success: true,
      data,
      message: 'Visitante registrado com sucesso',
    });
  }
);

// 4. PUT /visitors/:id - Atualizar visitante
const updateVisitorTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
      updated_by: req.user?.id,
    };

    const { data, error } = await supabase
      .from('visitors')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('Visitante não encontrado', 404);

    await cache.invalidatePattern('visitors:*');

    res.json({
      success: true,
      data,
      message: 'Visitante atualizado com sucesso',
    });
  }
);

// 5. GET /visitors/stats - Estatísticas
const getVisitorStatsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Verificar cache primeiro
    const cached = await cache.get('stats:visitors');
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Calcular estatísticas
    const [
      { count: total },
      { count: recent }
    ] = await Promise.all([
      supabase.from('visitors').select('*', { count: 'exact', head: true }),
      supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('data_primeira_visita', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const stats = {
      total_visitors: total || 0,
      recent_visitors: recent || 0,
    };

    // Cachear por 30 minutos
    await cache.set('stats:visitors', stats, 1800);

    res.json({ success: true, data: stats });
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
app.get('/api/visitors', getVisitorsTestable(mockSupabase, mockCacheService));
app.get('/api/visitors/stats', getVisitorStatsTestable(mockSupabase, mockCacheService));
app.get('/api/visitors/:id', getVisitorByIdTestable(mockSupabase));
app.post('/api/visitors', createVisitorTestable(mockSupabase, mockCacheService));
app.put('/api/visitors/:id', updateVisitorTestable(mockSupabase, mockCacheService));

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
describe('🎯 VISITORS CONTROLLER - TODOS OS TESTES', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks to return this for chaining
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.lt.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.range.mockReturnThis();
    // Reset single method mock
    mockSupabase.single.mockClear();

    mockCacheService.set.mockResolvedValue(undefined);
    mockCacheService.invalidatePattern.mockResolvedValue(undefined);
    mockCacheService.get.mockResolvedValue(null); // Default to no cache
  });

  describe('✅ 1. GET /api/visitors - Lista de visitantes', () => {
    it('deve retornar lista de visitantes com paginação', async () => {
      const mockVisitors = [
        { id: '1', nome: 'João Silva', email: 'joao@test.com', telefone: '11999999999', origem_visita: 'culto' },
        { id: '2', nome: 'Maria Santos', email: 'maria@test.com', telefone: '11888888888', origem_visita: 'evento' }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockVisitors,
        error: null,
        count: 2
      });

      const response = await request(app)
        .get('/api/visitors')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          visitors: mockVisitors,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visitors');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
    });

    it('deve filtrar visitantes por status', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await request(app)
        .get('/api/visitors?status=ativo')
        .expect(200);

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'ativo');
    });
  });

  describe('✅ 2. GET /api/visitors/:id - Visitante específico', () => {
    it('deve retornar visitante por ID', async () => {
      const mockVisitor = { id: '1', nome: 'João Silva', email: 'joao@test.com', status: 'ativo' };

      mockSupabase.single.mockResolvedValue({
        data: mockVisitor,
        error: null
      });

      const response = await request(app)
        .get('/api/visitors/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockVisitor
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visitors');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('deve retornar 404 quando visitante não encontrado', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const response = await request(app)
        .get('/api/visitors/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Visitante não encontrado');
    });
  });

  describe('✅ 3. POST /api/visitors - Criar visitante', () => {
    it('deve criar um novo visitante', async () => {
      const newVisitor = {
        nome: 'Pedro Costa',
        email: 'pedro@test.com',
        telefone: '11777777777',
        origem_visita: 'indicação'
      };

      const createdVisitor = { id: '3', ...newVisitor, status: 'ativo' };

      mockSupabase.single.mockResolvedValue({
        data: createdVisitor,
        error: null
      });

      const response = await request(app)
        .post('/api/visitors')
        .send(newVisitor)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdVisitor,
        message: 'Visitante registrado com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visitors');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('visitors:*');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidVisitor = { nome: '', email: '' }; // Dados inválidos

      const response = await request(app)
        .post('/api/visitors')
        .send(invalidVisitor)
        .expect(400);

      expect(response.body.message).toBe('Nome e email são obrigatórios');
    });
  });

  describe('✅ 4. PUT /api/visitors/:id - Atualizar visitante', () => {
    it('deve atualizar um visitante', async () => {
      const updateData = { telefone: '11666666666' };
      const updatedVisitor = { id: '1', nome: 'João Silva', email: 'joao@test.com', telefone: '11666666666' };

      mockSupabase.single.mockResolvedValue({
        data: updatedVisitor,
        error: null
      });

      const response = await request(app)
        .put('/api/visitors/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedVisitor,
        message: 'Visitante atualizado com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visitors');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('visitors:*');
    });
  });

  describe('✅ 5. GET /api/visitors/stats - Estatísticas', () => {
    it('deve retornar estatísticas dos visitantes', async () => {
      // Clear all previous mocks
      jest.clearAllMocks();
      
      // Reset chain methods
      mockSupabase.from.mockReturnThis();
      mockSupabase.gte.mockReturnThis();

      const mockStats = {
        total_visitors: 50,
        recent_visitors: 15
      };

      // Mock the two queries for stats
      mockSupabase.select.mockResolvedValueOnce({ count: 50, data: null, error: null });
      
      mockSupabase.select.mockReturnValueOnce({
        gte: jest.fn().mockResolvedValue({ count: 15, data: null, error: null })
      });

      const response = await request(app)
        .get('/api/visitors/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });

      expect(mockCacheService.set).toHaveBeenCalledWith('stats:visitors', mockStats, 1800);
    });

    it('deve usar cache quando disponível', async () => {
      const cachedStats = { total_visitors: 60, recent_visitors: 20 };

      mockCacheService.get.mockResolvedValue(cachedStats);

      const response = await request(app)
        .get('/api/visitors/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: cachedStats
      });

      expect(mockCacheService.get).toHaveBeenCalledWith('stats:visitors');
      // Não deve fazer queries ao banco quando há cache
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
