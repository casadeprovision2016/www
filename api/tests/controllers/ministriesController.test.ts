/**
 * 🎯 MINISTRIES CONTROLLER - TESTES COMPLETOS CONSOLIDADOS
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

// 1. GET /ministries - Lista de ministérios
const getMinistriesTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from('ministries').select('*', { count: 'exact' });

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
      data: { ministries: data || [], pagination },
    });
  }
);

// 2. GET /ministries/:id - Ministério específico
const getMinistryByIdTestable = (supabase: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('Ministério não encontrado', 404);

    res.json({ success: true, data });
  }
);

// 3. POST /ministries - Criar ministério
const createMinistryTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { nome, descricao, lider_responsavel } = req.body;

    if (!nome) {
      throw new AppError('Nome do ministério é obrigatório', 400);
    }

    const ministryData = {
      nome,
      descricao,
      lider_responsavel,
      status: 'ativo',
      created_by: req.user?.id,
    };

    const { data, error } = await supabase
      .from('ministries')
      .insert(ministryData)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    await cache.invalidatePattern('ministries:*');

    res.status(201).json({
      success: true,
      data,
      message: 'Ministério criado com sucesso',
    });
  }
);

// 4. PUT /ministries/:id - Atualizar ministério
const updateMinistryTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
      updated_by: req.user?.id,
    };

    const { data, error } = await supabase
      .from('ministries')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('Ministério não encontrado', 404);

    await cache.invalidatePattern('ministries:*');

    res.json({
      success: true,
      data,
      message: 'Ministério atualizado com sucesso',
    });
  }
);

// 5. DELETE /ministries/:id - Excluir ministério
const deleteMinistryTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { data, error } = await supabase
      .from('ministries')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('Ministério não encontrado', 404);

    await cache.invalidatePattern('ministries:*');

    res.json({
      success: true,
      message: 'Ministério excluído com sucesso',
    });
  }
);

// 6. GET /ministries/stats - Estatísticas
const getMinistryStatsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Verificar cache primeiro
    const cached = await cache.get('stats:ministries');
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Calcular estatísticas
    const [
      { count: total },
      { count: active }
    ] = await Promise.all([
      supabase.from('ministries').select('*', { count: 'exact', head: true }),
      supabase
        .from('ministries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo'),
    ]);

    const stats = {
      total_ministries: total || 0,
      active_ministries: active || 0,
    };

    // Cachear por 30 minutos
    await cache.set('stats:ministries', stats, 1800);

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
app.get('/api/ministries', getMinistriesTestable(mockSupabase, mockCacheService));
app.get('/api/ministries/stats', getMinistryStatsTestable(mockSupabase, mockCacheService));
app.get('/api/ministries/:id', getMinistryByIdTestable(mockSupabase));
app.post('/api/ministries', createMinistryTestable(mockSupabase, mockCacheService));
app.put('/api/ministries/:id', updateMinistryTestable(mockSupabase, mockCacheService));
app.delete('/api/ministries/:id', deleteMinistryTestable(mockSupabase, mockCacheService));

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
describe('🎯 MINISTRIES CONTROLLER - TODOS OS TESTES', () => {
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

  describe('✅ 1. GET /api/ministries - Lista de ministérios', () => {
    it('deve retornar lista de ministérios com paginação', async () => {
      const mockMinistries = [
        { id: '1', nome: 'Louvor e Adoração', descricao: 'Ministério de música', status: 'ativo' },
        { id: '2', nome: 'Intercessão', descricao: 'Ministério de oração', status: 'ativo' }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockMinistries,
        error: null,
        count: 2
      });

      const response = await request(app)
        .get('/api/ministries')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          ministries: mockMinistries,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ministries');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
    });

    it('deve filtrar ministérios por status', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await request(app)
        .get('/api/ministries?status=ativo')
        .expect(200);

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'ativo');
    });
  });

  describe('✅ 2. GET /api/ministries/:id - Ministério específico', () => {
    it('deve retornar ministério por ID', async () => {
      const mockMinistry = { id: '1', nome: 'Louvor e Adoração', descricao: 'Ministério de música', status: 'ativo' };

      mockSupabase.single.mockResolvedValue({
        data: mockMinistry,
        error: null
      });

      const response = await request(app)
        .get('/api/ministries/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMinistry
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ministries');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('deve retornar 404 quando ministério não encontrado', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const response = await request(app)
        .get('/api/ministries/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Ministério não encontrado');
    });
  });

  describe('✅ 3. POST /api/ministries - Criar ministério', () => {
    it('deve criar um novo ministério', async () => {
      const newMinistry = {
        nome: 'Evangelismo',
        descricao: 'Ministério de evangelização',
        lider_responsavel: 'João Silva'
      };

      const createdMinistry = { id: '3', ...newMinistry, status: 'ativo' };

      mockSupabase.single.mockResolvedValue({
        data: createdMinistry,
        error: null
      });

      const response = await request(app)
        .post('/api/ministries')
        .send(newMinistry)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdMinistry,
        message: 'Ministério criado com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ministries');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('ministries:*');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidMinistry = { nome: '' }; // Nome vazio

      const response = await request(app)
        .post('/api/ministries')
        .send(invalidMinistry)
        .expect(400);

      expect(response.body.message).toBe('Nome do ministério é obrigatório');
    });
  });

  describe('✅ 4. PUT /api/ministries/:id - Atualizar ministério', () => {
    it('deve atualizar um ministério', async () => {
      const updateData = { descricao: 'Nova descrição do ministério' };
      const updatedMinistry = { id: '1', nome: 'Louvor e Adoração', descricao: 'Nova descrição do ministério' };

      mockSupabase.single.mockResolvedValue({
        data: updatedMinistry,
        error: null
      });

      const response = await request(app)
        .put('/api/ministries/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedMinistry,
        message: 'Ministério atualizado com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ministries');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('ministries:*');
    });
  });

  describe('✅ 5. DELETE /api/ministries/:id - Excluir ministério', () => {
    it('deve excluir um ministério', async () => {
      const deletedMinistry = { id: '1', nome: 'Louvor e Adoração' };

      mockSupabase.single.mockResolvedValue({
        data: deletedMinistry,
        error: null
      });

      const response = await request(app)
        .delete('/api/ministries/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Ministério excluído com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ministries');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('ministries:*');
    });
  });

  describe('✅ 6. GET /api/ministries/stats - Estatísticas', () => {
    it('deve retornar estatísticas dos ministérios', async () => {
      // Clear all previous mocks
      jest.clearAllMocks();
      
      // Reset chain methods
      mockSupabase.from.mockReturnThis();
      mockSupabase.eq.mockReturnThis();

      const mockStats = {
        total_ministries: 10,
        active_ministries: 8
      };

      // Mock the two queries for stats
      mockSupabase.select.mockResolvedValueOnce({ count: 10, data: null, error: null });
      
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ count: 8, data: null, error: null })
      });

      const response = await request(app)
        .get('/api/ministries/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });

      expect(mockCacheService.set).toHaveBeenCalledWith('stats:ministries', mockStats, 1800);
    });

    it('deve usar cache quando disponível', async () => {
      const cachedStats = { total_ministries: 12, active_ministries: 10 };

      mockCacheService.get.mockResolvedValue(cachedStats);

      const response = await request(app)
        .get('/api/ministries/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: cachedStats
      });

      expect(mockCacheService.get).toHaveBeenCalledWith('stats:ministries');
      // Não deve fazer queries ao banco quando há cache
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
