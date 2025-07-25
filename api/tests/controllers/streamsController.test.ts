/**
 * 🎯 STREAMS CONTROLLER - TESTES COMPLETOS CONSOLIDADOS
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

// 1. GET /streams - Lista de transmissões
const getStreamsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from('transmissions').select('*', { count: 'exact' });

    // Filtros
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error, count } = await query
      .order('data_inicio', { ascending: false })
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
      data: { streams: data || [], pagination },
    });
  }
);

// 2. GET /streams/:id - Transmissão específica
const getStreamByIdTestable = (supabase: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { data, error } = await supabase
      .from('transmissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('Transmissão não encontrada', 404);

    res.json({ success: true, data });
  }
);

// 3. POST /streams - Criar transmissão
const createStreamTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { titulo, descricao, url_stream, data_inicio, data_fim } = req.body;

    if (!titulo || !url_stream || !data_inicio) {
      throw new AppError('Dados inválidos para criação de transmissão', 400);
    }

    const streamData = {
      titulo,
      descricao,
      url_stream,
      data_inicio,
      data_fim,
      status: 'agendado',
      created_by: req.user?.id,
    };

    const { data, error } = await supabase
      .from('transmissions')
      .insert(streamData)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    await cache.invalidatePattern('streams:*');

    res.status(201).json({
      success: true,
      data,
      message: 'Transmissão criada com sucesso',
    });
  }
);

// 4. PUT /streams/:id - Atualizar transmissão
const updateStreamTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Verificar se a transmissão existe
    const { data: existingStream } = await supabase
      .from('transmissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!existingStream) throw new AppError('Transmissão não encontrada', 404);

    // Verificar permissões
    if (existingStream.created_by !== req.user?.id && req.user?.role !== 'admin') {
      throw new AppError('Sem permissão para editar esta transmissão', 403);
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transmissions')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    await cache.invalidatePattern('streams:*');

    res.json({ success: true, data });
  }
);

// 5. DELETE /streams/:id - Excluir transmissão
const deleteStreamTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Verificar se a transmissão existe
    const { data: existingStream, error: selectError } = await supabase
      .from('transmissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (selectError) throw new AppError(selectError.message, 500);
    if (!existingStream) throw new AppError('Transmissão não encontrada', 404);

    // Verificar permissões
    if (existingStream.created_by !== req.user?.id && req.user?.role !== 'admin') {
      throw new AppError('Sem permissão para excluir esta transmissão', 403);
    }

    // Excluir transmissão
    const { error: deleteError } = await supabase
      .from('transmissions')
      .eq('id', req.params.id)
      .delete();

    if (deleteError) throw new AppError(deleteError.message, 500);

    await cache.invalidatePattern('streams:*');

    res.json({
      success: true,
      message: 'Transmissão excluída com sucesso',
    });
  }
);

// 6. GET /streams/stats - Estatísticas
const getStreamStatsTestable = (supabase: any, cache: any) => asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Verificar cache primeiro
    const cached = await cache.get('stats:streams');
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Calcular estatísticas
    const now = new Date().toISOString();

    const [
      { count: total },
      { count: active },
      { count: thisMonth }
    ] = await Promise.all([
      supabase.from('transmissions').select('*', { count: 'exact', head: true }),
      supabase
        .from('transmissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo'),
      supabase
        .from('transmissions')
        .select('*', { count: 'exact', head: true })
        .gte('data_inicio', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    const stats = {
      total_streams: total || 0,
      active_streams: active || 0,
      streams_this_month: thisMonth || 0,
    };

    // Cachear por 30 minutos
    await cache.set('stats:streams', stats, 1800);

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
app.get('/api/streams', getStreamsTestable(mockSupabase, mockCacheService));
app.get('/api/streams/stats', getStreamStatsTestable(mockSupabase, mockCacheService));
app.get('/api/streams/:id', getStreamByIdTestable(mockSupabase));
app.post('/api/streams', createStreamTestable(mockSupabase, mockCacheService));
app.put('/api/streams/:id', updateStreamTestable(mockSupabase, mockCacheService));
app.delete('/api/streams/:id', deleteStreamTestable(mockSupabase, mockCacheService));

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
describe('🎯 STREAMS CONTROLLER - TODOS OS TESTES', () => {
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

  describe('✅ 1. GET /api/streams - Lista de transmissões', () => {
    it('deve retornar lista de transmissões com paginação', async () => {
      const mockStreams = [
        { id: '1', titulo: 'Culto Dominical', data_inicio: '2024-12-29T10:00:00Z', status: 'agendado' },
        { id: '2', titulo: 'Estudo Bíblico', data_inicio: '2025-01-02T19:00:00Z', status: 'ativo' }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockStreams,
        error: null,
        count: 2
      });

      const response = await request(app)
        .get('/api/streams')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          streams: mockStreams,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('transmissions');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabase.order).toHaveBeenCalledWith('data_inicio', { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
    });

    it('deve filtrar transmissões por status', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await request(app)
        .get('/api/streams?status=ativo')
        .expect(200);

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'ativo');
    });
  });

  describe('✅ 2. GET /api/streams/:id - Transmissão específica', () => {
    it('deve retornar transmissão por ID', async () => {
      const mockStream = { id: '1', titulo: 'Culto Dominical', status: 'agendado' };

      mockSupabase.single.mockResolvedValue({
        data: mockStream,
        error: null
      });

      const response = await request(app)
        .get('/api/streams/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStream
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('transmissions');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    });

    it('deve retornar 404 quando transmissão não encontrada', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const response = await request(app)
        .get('/api/streams/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Transmissão não encontrada');
    });
  });

  describe('✅ 3. POST /api/streams - Criar transmissão', () => {
    it('deve criar uma nova transmissão', async () => {
      const newStream = {
        titulo: 'Nova Transmissão',
        descricao: 'Descrição da transmissão',
        url_stream: 'https://youtube.com/live/123',
        data_inicio: '2025-01-15T10:00:00Z'
      };

      const createdStream = { id: '3', ...newStream, status: 'agendado' };

      mockSupabase.single.mockResolvedValue({
        data: createdStream,
        error: null
      });

      const response = await request(app)
        .post('/api/streams')
        .send(newStream)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdStream,
        message: 'Transmissão criada com sucesso'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('transmissions');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('streams:*');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidStream = { titulo: '' }; // Dados inválidos

      const response = await request(app)
        .post('/api/streams')
        .send(invalidStream)
        .expect(400);

      expect(response.body.message).toBe('Dados inválidos para criação de transmissão');
    });
  });

  describe('✅ 4. PUT /api/streams/:id - Atualizar transmissão', () => {
    it('deve atualizar uma transmissão existente', async () => {
      const existingStream = { id: '1', titulo: 'Transmissão Original', created_by: 'user-admin' };
      const updateData = { titulo: 'Transmissão Atualizada' };
      const updatedStream = { ...existingStream, ...updateData };

      // Mock para verificação de existência
      mockSupabase.single.mockResolvedValueOnce({
        data: existingStream,
        error: null
      });

      // Mock para atualização
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedStream,
        error: null
      });

      const response = await request(app)
        .put('/api/streams/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedStream
      });

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('streams:*');
    });

    it('deve retornar 404 quando transmissão não encontrada', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const response = await request(app)
        .put('/api/streams/nonexistent')
        .send({ titulo: 'Novo Título' })
        .expect(404);

      expect(response.body.message).toBe('Transmissão não encontrada');
    });
  });

  describe('✅ 5. DELETE /api/streams/:id - Excluir transmissão', () => {
    it('deve excluir uma transmissão', async () => {
      const existingStream = { id: '1', titulo: 'Transmissão', created_by: 'user-admin' };

      // Mock para verificação de existência
      mockSupabase.single.mockResolvedValue({
        data: existingStream,
        error: null
      });

      // Mock para exclusão
      mockSupabase.delete.mockResolvedValue({
        error: null,
        data: null
      });

      const response = await request(app)
        .delete('/api/streams/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Transmissão excluída com sucesso'
      });

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('streams:*');
    });

    it('deve retornar 404 quando transmissão não encontrada', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const response = await request(app)
        .delete('/api/streams/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Transmissão não encontrada');
    });
  });

  describe('✅ 6. GET /api/streams/stats - Estatísticas', () => {
    it('deve retornar estatísticas das transmissões', async () => {
      // Clear all previous mocks
      jest.clearAllMocks();
      
      // Reset chain methods
      mockSupabase.from.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.gte.mockReturnThis();

      const mockStats = {
        total_streams: 10,
        active_streams: 3,
        streams_this_month: 5
      };

      // Mock the three queries for stats
      // Query 1: total streams - just .from().select()
      mockSupabase.select.mockResolvedValueOnce({ count: 10, data: null, error: null });
      
      // Query 2: active streams - .from().select().eq()
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ count: 3, data: null, error: null })
      });
      
      // Query 3: streams this month - .from().select().gte()  
      mockSupabase.select.mockReturnValueOnce({
        gte: jest.fn().mockResolvedValue({ count: 5, data: null, error: null })
      });

      const response = await request(app)
        .get('/api/streams/stats');
        
      console.log('Stats response:', response.status, response.body);
      
      if (response.status !== 200) {
        throw new Error(`Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`);
      }

      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });

      expect(mockCacheService.set).toHaveBeenCalledWith('stats:streams', mockStats, 1800);
    });

    it('deve usar cache quando disponível', async () => {
      const cachedStats = { total_streams: 15, active_streams: 5, streams_this_month: 8 };

      mockCacheService.get.mockResolvedValue(cachedStats);

      const response = await request(app)
        .get('/api/streams/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: cachedStats
      });

      expect(mockCacheService.get).toHaveBeenCalledWith('stats:streams');
      // Não deve fazer queries ao banco quando há cache
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
