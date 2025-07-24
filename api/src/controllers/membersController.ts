import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, CreateMemberRequest, MemberQueryParams, PaginatedResponse, StatsResponse } from '@shared/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cacheService';
import { startOfWeek, endOfWeek, format } from 'date-fns';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getMembers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    membership_type, 
    ministry_id, 
    sort = 'created_at', 
    order = 'desc' 
  } = req.query as any;
  
  let query = supabase
    .from('members')
    .select(`
      *,
      user:users(id, nome, email, telefone)
    `, { count: 'exact' });

  // Filtros baseados no schema real
  if (status) {
    query = query.eq('status', status);
  }
  if (membership_type) {
    query = query.eq('tipo_membro', membership_type);
  }

  // Ordenação e paginação
  query = query
    .order(sort, { ascending: order === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Erro ao buscar membros', 500);
  }

  // Map Portuguese database fields to English frontend fields
  const mappedData = (data || []).map(member => ({
    id: member.id,
    name: member.user?.nome || 'Nome não informado',
    email: member.user?.email || '',
    phone: member.user?.telefone || '',
    membershipType: member.tipo_membro,
    joinDate: member.data_ingresso,
    status: member.status,
    baptized: member.batizado,
    baptismDate: member.data_batismo,
    tithe: member.dizimista,
    notes: member.observacoes,
    created_at: member.created_at,
    updated_at: member.updated_at
  }));

  const response: PaginatedResponse<any> = {
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
});

export const getMemberById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      user:users(id, name, email, telefone),
      ministries:ministry_members(
        id,
        cargo,
        ativo,
        joined_at,
        ministry:ministries(id, name, descricao)
      ),
      donations:donations(id, valor, tipo, data_doacao),
      visits_received:pastoral_visits!pastoral_visits_visitado_id_fkey(
        id, data_visita, motivo, status,
        pastor:users!pastoral_visits_pastor_id_fkey(name)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('Membro não encontrado', 404);
  }

  res.json({
    success: true,
    data
  });
});

export const createMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberData: CreateMemberRequest = req.body;

  // Verificar se o usuário existe
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', memberData.user_id)
    .single();

  if (userError || !user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Verificar se já é membro
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', memberData.user_id)
    .single();

  if (existing) {
    throw new AppError('Usuário já é membro', 400);
  }

  const { data, error } = await supabase
    .from('members')
    .insert({
      ...memberData,
      status: 'ativo'
    })
    .select(`
      *,
      user:users(name, email)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao criar membro', 500);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:members*');
  await cacheService.invalidate('stats:dashboard');

  res.status(201).json({
    success: true,
    data,
    message: 'Membro criado com sucesso'
  });
});

export const updateMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      user:users(name, email)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao atualizar membro', 500);
  }

  if (!data) {
    throw new AppError('Membro não encontrado', 404);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:members*');
  await cacheService.invalidate('stats:dashboard');

  res.json({
    success: true,
    data,
    message: 'Membro atualizado com sucesso'
  });
});

export const deleteMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('Erro ao deletar membro', 500);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:members*');
  await cacheService.invalidate('stats:dashboard');

  res.json({
    success: true,
    message: 'Membro deletado com sucesso'
  });
});

export const deactivateMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('members')
    .update({ 
      status: 'inativo',
      end_date: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Erro ao desativar membro', 500);
  }

  if (!data) {
    throw new AppError('Membro não encontrado', 404);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:members*');
  await cacheService.invalidate('stats:dashboard');

  res.json({
    success: true,
    data,
    message: 'Membro desativado com sucesso'
  });
});

export const getMemberStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cacheKey = 'stats:members';
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return res.json({
      success: true,
      data: cached
    });
  }

  // Total de membros
  const { count: total } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });

  // Membros ativos
  const { count: active } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo');

  // Membros inativos
  const { count: inactive } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inativo');

  // Novos membros este mês
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

  const { count: thisMonth } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .gte('join_date', startOfMonth.toISOString());

  const stats: StatsResponse = {
    total: total || 0,
    active: active || 0,
    inactive: inactive || 0,
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

export const getMemberBirthdays = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cacheKey = 'members:birthdays:week';
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return res.json({
      success: true,
      data: cached
    });
  }

  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  // Buscar membros com data de nascimento na semana atual
  // Assumindo que o campo birthdate foi adicionado à tabela users
  const { data: birthdays, error } = await supabase
    .from('members')
    .select(`
      *,
      user:users(id, name, email, birthdate)
    `)
    .eq('status', 'ativo')
    .not('users.birthdate', 'is', null);

  if (error) {
    // Se o campo birthdate não existir, retornar lista vazia
    const emptyBirthdays: any[] = [];
    await cacheService.set(cacheKey, emptyBirthdays, 3600);
    
    return res.json({
      success: true,
      data: emptyBirthdays,
      message: 'Campo de data de nascimento não encontrado na tabela users. Adicione: ALTER TABLE users ADD COLUMN birthdate DATE;'
    });
  }

  // Filtrar aniversariantes da semana
  const weekBirthdays = (birthdays || []).filter(member => {
    if (!member.user?.birthdate) return false;
    
    const birthdate = new Date(member.user.birthdate);
    const thisYearBirthday = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
    
    return thisYearBirthday >= weekStart && thisYearBirthday <= weekEnd;
  });

  await cacheService.set(cacheKey, weekBirthdays, 3600); // 1 hora

  res.json({
    success: true,
    data: weekBirthdays
  });
});