/**
 * 🎯 MEMBERS CONTROLLER - TESTES COMPLETOS CONSOLIDADOS
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

// 1. GET /members - Lista de membros
const getMembersTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from('members').select('*', { count: 'exact' });

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
      data: { members: data || [], pagination },
    });
  }
);

// 2. GET /members/:id - Membro específico
const getMemberByIdTestable = (supabase: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('Membro não encontrado', 404);

    res.json({ success: true, data });
  }
);

// 3. POST /members - Criar membro
const createMemberTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, tipo_membro, data_ingresso } = req.body;

    if (!user_id || !tipo_membro) {
      throw new AppError('Dados inválidos para criação de membro', 400);
    }

    const memberData = {
      user_id,
      tipo_membro,
      data_ingresso,
      status: 'ativo',
      created_by: req.user?.id,
    };

    const { data, error } = await supabase
      .from('members')
      .insert(memberData)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    await cache.invalidatePattern('members:*');

    res.status(201).json({
      success: true,
      data,
      message: 'Membro criado com sucesso',
    });
  }
);

// 4. GET /members/stats - Estatísticas
const getMemberStatsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Verificar cache primeiro
    const cached = await cache.get('stats:members');
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Calcular estatísticas
    const [
      { count: total },
      { count: active },
      { count: inactive }
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo'),
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inativo'),
    ]);

    const stats = {
      total_members: total || 0,
      active_members: active || 0,
      inactive_members: inactive || 0,
    };

    // Cachear por 30 minutos
    await cache.set('stats:members', stats, 1800);

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
app.get('/api/members', getMembersTestable(mockSupabase, mockCacheService));
app.get('/api/members/stats', getMemberStatsTestable(mockSupabase, mockCacheService));
app.get('/api/members/:id', getMemberByIdTestable(mockSupabase));
app.post('/api/members', createMemberTestable(mockSupabase, mockCacheService));

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
describe('🎯 MEMBERS CONTROLLER - TODOS OS TESTES', () => {
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

  describe('✅ 1. GET /api/members - Lista de membros', () => {
    it('deve retornar lista de membros com paginação', async () => {
      const mockMembers = [
        { id: '1', user_id: 'user-1', tipo_membro: 'efetivo', status: 'ativo', data_ingresso: '2020-01-15' },
        { id: '2', user_id: 'user-2', tipo_membro: 'congregado', status: 'ativo', data_ingresso: '2021-03-10' }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockMembers,
        error: null,
        count: 2
      });

      const response = await request(app)
        .get('/api/members')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          members: mockMembers,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('members');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
    });

    it('deve filtrar membros por status', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await request(app)
        .get('/api/members?status=ativo')
        .expect(200);

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'ativo');
    });
  });

  describe('✅ 2. GET /api/members/:id - Membro específico', () => {
    it('deve retornar membro por ID', async () => {
      const mockMember = { id: '1', user_id: 'user-1', tipo_membro: 'efetivo', status: 'ativo' };

      mockSupabase.single.mockResolvedValue({
        data: mockMember,
        error: null
      });

      const response = await request(app)
        .get('/api/members/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMember
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('members');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('deve retornar 404 quando membro não encontrado', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const response = await request(app)
        .get('/api/members/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Membro não encontrado');
    });
  });

  describe('✅ 3. POST /api/members - Criar membro', () => {
    it('deve criar um novo membro', async () => {
      const newMember = {
        user_id: 'user-3',
        tipo_membro: 'congregado',
        data_ingresso: '2025-01-15'
      };

      const createdMember = { id: '3', ...newMember, status: 'ativo' };

      mockSupabase.single.mockResolvedValue({
        data: createdMember,
        error: null
      });

      const response = await request(app)
        .post('/api/members')
        .send(newMember)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdMember,
        message: 'Membro criado com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('members');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('members:*');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidMember = { user_id: '' }; // Dados inválidos

      const response = await request(app)
        .post('/api/members')
        .send(invalidMember)
        .expect(400);

      expect(response.body.message).toBe('Dados inválidos para criação de membro');
    });
  });

  describe('✅ 4. GET /api/members/stats - Estatísticas', () => {
    it('deve retornar estatísticas dos membros', async () => {
      // Clear all previous mocks
      jest.clearAllMocks();
      
      // Reset chain methods
      mockSupabase.from.mockReturnThis();
      mockSupabase.eq.mockReturnThis();

      const mockStats = {
        total_members: 100,
        active_members: 85,
        inactive_members: 15
      };

      // Mock the three queries for stats
      // Query 1: total members - just .from().select()
      mockSupabase.select.mockResolvedValueOnce({ count: 100, data: null, error: null });
      
      // Query 2: active members - .from().select().eq()
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ count: 85, data: null, error: null })
      });
      
      // Query 3: inactive members - .from().select().eq()  
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ count: 15, data: null, error: null })
      });

      const response = await request(app)
        .get('/api/members/stats');
        
      console.log('Stats response:', response.status, response.body);
      
      if (response.status !== 200) {
        throw new Error(`Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`);
      }

      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });

      expect(mockCacheService.set).toHaveBeenCalledWith('stats:members', mockStats, 1800);
    });

    it('deve usar cache quando disponível', async () => {
      const cachedStats = { total_members: 120, active_members: 100, inactive_members: 20 };

      mockCacheService.get.mockResolvedValue(cachedStats);

      const response = await request(app)
        .get('/api/members/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: cachedStats
      });

      expect(mockCacheService.get).toHaveBeenCalledWith('stats:members');
      // Não deve fazer queries ao banco quando há cache
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
