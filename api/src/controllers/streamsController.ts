import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, CreateStreamRequest, PaginatedResponse } from '@shared/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapeia os campos do frontend para o banco de dados
const mapToDbSchema = (data: any): { [key: string]: any } => {
  const dbData: { [key: string]: any } = {};
  
  console.log('🔄 Mapping data to DB schema:', data);
  
  // Campos em português (vindos da validação) → campos do banco
  if (data.titulo !== undefined) dbData.titulo = data.titulo;
  if (data.descricao !== undefined) dbData.descricao = data.descricao;
  if (data.url_stream !== undefined) dbData.url_stream = data.url_stream;
  if (data.url_chat !== undefined) dbData.url_chat = data.url_chat;
  if (data.data_inicio !== undefined) dbData.data_inicio = data.data_inicio;
  if (data.data_fim !== undefined) dbData.data_fim = data.data_fim;
  if (data.status !== undefined) dbData.status = data.status;
  if (data.evento_id !== undefined) dbData.evento_id = data.evento_id;
  if (data.visualizacoes !== undefined) dbData.visualizacoes = data.visualizacoes;
  if (data.gravacao_url !== undefined) dbData.gravacao_url = data.gravacao_url;
  if (data.publico !== undefined) dbData.publico = data.publico;
  if (data.senha !== undefined) dbData.senha = data.senha;
  if (data.observacoes !== undefined) dbData.observacoes = data.observacoes;
  
  // Manter compatibilidade com campos em inglês (caso existam)
  if (data.title !== undefined) dbData.titulo = data.title;
  if (data.description !== undefined) dbData.descricao = data.description;
  if (data.streamUrl !== undefined) dbData.url_stream = data.streamUrl;
  if (data.chatUrl !== undefined) dbData.url_chat = data.chatUrl;
  if (data.startDate !== undefined) dbData.data_inicio = data.startDate;
  if (data.endDate !== undefined) dbData.data_fim = data.endDate;
  if (data.eventId !== undefined) dbData.evento_id = data.eventId;
  if (data.views !== undefined) dbData.visualizacoes = data.views;
  if (data.recordingUrl !== undefined) dbData.gravacao_url = data.recordingUrl;
  if (data.public !== undefined) dbData.publico = data.public;
  if (data.password !== undefined) dbData.senha = data.password;
  if (data.notes !== undefined) dbData.observacoes = data.notes;
  
  // Converter scheduledDate + scheduledTime para data_inicio
  if (data.scheduledDate && data.scheduledTime) {
    const dateTimeString = `${data.scheduledDate}T${data.scheduledTime}:00.000Z`;
    dbData.data_inicio = dateTimeString;
    console.log('📅 Combined scheduled date/time:', dateTimeString);
  }
  
  console.log('✅ Mapped DB data:', dbData);
  return dbData;
};

// Mapeia os campos do banco de dados para o frontend
const mapToFrontendSchema = (stream: any): any => {
  if (!stream) return null;
  return {
    id: stream.id,
    title: stream.titulo,
    description: stream.descricao,
    streamUrl: stream.url_stream,
    chatUrl: stream.url_chat,
    startDate: stream.data_inicio,
    endDate: stream.data_fim,
    status: stream.status,
    eventId: stream.evento_id,
    views: stream.visualizacoes,
    recordingUrl: stream.gravacao_url,
    public: stream.publico,
    password: stream.senha,
    notes: stream.observacoes,
    createdBy: stream.created_by ? {
      name: stream.created_by.nome,
      email: stream.created_by.email
    } : null,
    created_at: stream.created_at,
    updated_at: stream.updated_at
  };
};

export const getStreams = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    month, 
    year, 
    sort = 'data_inicio', 
    order = 'desc' 
  } = req.query as any;
  
  let query = supabase
    .from('live_streams')
    .select(`
      *,
      created_by:users!live_streams_created_by_fkey(nome, email)
    `, { count: 'exact' });

  if (status) query = query.eq('status', status);

  if (month) {
    const [yearStr, monthStr] = month.split('-');
    const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0);
    query = query.gte('data_inicio', startDate.toISOString()).lte('data_inicio', endDate.toISOString());
  }

  if (year) {
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31);
    query = query.gte('data_inicio', startDate.toISOString()).lte('data_inicio', endDate.toISOString());
  }

  query = query.order(sort, { ascending: order === 'asc' }).range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) throw new AppError('Erro ao buscar transmissões', 500);

  const mappedData = (data || []).map(mapToFrontendSchema);
  const response: PaginatedResponse<any> = {
    data: mappedData,
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil((count || 0) / limit)
  };

  res.json({ success: true, data: response });
});

export const getStreamById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('live_streams').select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).eq('id', id).single();
  if (error || !data) throw new AppError('Transmissão não encontrada', 404);
  res.json({ success: true, data: mapToFrontendSchema(data) });
});

export const getLiveStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase.from('live_streams').select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).eq('status', 'ao_vivo').order('data_inicio', { ascending: false }).limit(1).single();
  if (error && error.code !== 'PGRST116') throw new AppError('Erro ao buscar transmissão ao vivo', 500);
  res.json({ success: true, data: mapToFrontendSchema(data) });
});

export const createStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const streamData: CreateStreamRequest = req.body;
  const userId = req.user.id;
  const dbData = mapToDbSchema(streamData);

  const { data, error } = await supabase.from('live_streams').insert({ ...dbData, created_by: userId, status: 'agendado' }).select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).single();
  if (error) {
    console.error('Create stream error:', error);
    throw new AppError('Erro ao criar transmissão', 500);
  }
  res.status(201).json({ success: true, data: mapToFrontendSchema(data), message: 'Transmissão criada com sucesso' });
});

export const updateStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const dbData = mapToDbSchema(updateData);

  const { data, error } = await supabase.from('live_streams').update(dbData).eq('id', id).select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).single();
  if (error) {
    console.error('Update stream error:', error);
    throw new AppError('Erro ao atualizar transmissão', 500);
  }
  res.json({ success: true, data: mapToFrontendSchema(data), message: 'Transmissão atualizada com sucesso' });
});

export const deleteStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('live_streams').delete().eq('id', id);
  if (error) {
    console.error('Delete stream error:', error);
    throw new AppError('Erro ao deletar transmissão', 500);
  }
  res.json({ success: true, message: 'Transmissão deletada com sucesso' });
});

export const endStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { data: existingStream, error: fetchError } = await supabase.from('live_streams').select('status').eq('id', id).single();
  if (fetchError || !existingStream) throw new AppError('Transmissão não encontrada', 404);
  if (existingStream.status === 'finalizado' || existingStream.status === 'cancelado') throw new AppError('Transmissão já foi finalizada ou cancelada', 400);

  const { data, error } = await supabase.from('live_streams').update({ status: 'finalizado', data_fim: new Date().toISOString() }).eq('id', id).select().single();
  if (error) {
    console.error('End stream error:', error);
    throw new AppError('Erro ao finalizar transmissão', 500);
  }
  res.json({ success: true, data: mapToFrontendSchema(data), message: 'Transmissão finalizada com sucesso' });
});

export const getStreamStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { cacheService } = require('../services/cacheService');
  const cacheKey = 'stats:streams';
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return res.json({
      success: true,
      data: cached
    });
  }

  // Total de transmissões
  const { count: total } = await supabase
    .from('live_streams')
    .select('*', { count: 'exact', head: true });

  // Transmissões este mês
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const { count: thisMonth } = await supabase
    .from('live_streams')
    .select('*', { count: 'exact', head: true })
    .gte('data_inicio', startOfMonth.toISOString())
    .lte('data_inicio', endOfMonth.toISOString());

  // Transmissões ativas (futuras)
  const { count: active } = await supabase
    .from('live_streams')
    .select('*', { count: 'exact', head: true })
    .gte('data_inicio', new Date().toISOString());

  const stats = {
    total: total || 0,
    active: active || 0,
    monthly: {
      current: thisMonth || 0
    }
  };

  await cacheService.set(cacheKey, stats, 1800); // 30 minutos

  res.json({
    success: true,
    data: stats
  });
});
