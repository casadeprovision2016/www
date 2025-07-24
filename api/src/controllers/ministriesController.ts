import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, CreateMinistryRequest, PaginatedResponse } from '@shared/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cacheService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para mapear ministério para frontend
const mapMinistryToFrontend = (ministry: any) => {
  return {
    id: ministry.id,
    name: ministry.nome,
    description: ministry.descricao,
    leader_id: ministry.lider_id,
    active: ministry.ativo,
    created_at: ministry.created_at,
    updated_at: ministry.updated_at,
    leader: ministry.lider
  };
};

export const getMinistries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Erro ao buscar ministérios:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar ministérios'
      });
    }

    // Map Portuguese database fields to English frontend fields
    const mappedData = (data || []).map(ministry => ({
      id: ministry.id,
      name: ministry.nome,
      description: ministry.descricao,
      leader_id: ministry.lider_id,
      active: ministry.ativo,
      created_at: ministry.created_at,
      updated_at: ministry.updated_at
    }));

    return res.json({
      success: true,
      data: {
        data: mappedData,
        total: data.length,
        page: 1,
        limit: 10,
        total_pages: 1
      }
    });
  } catch (error: any) {
    console.error('Erro interno no controller de ministérios:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const getMinistryById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('ministries')
    .select(`
      *,
      lider:users!ministries_lider_id_fkey(id, name, email, telefone),
      members:ministry_members(
        id,
        cargo,
        ativo,
        joined_at,
        user:users(id, name, email)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('Ministério não encontrado', 404);
  }

  res.json({
    success: true,
    data
  });
});

export const createMinistry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ministryData: CreateMinistryRequest = req.body;

  // Verificar se o líder existe
  const { data: leader, error: leaderError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', ministryData.lider_id)
    .single();

  if (leaderError || !leader) {
    throw new AppError('Líder não encontrado', 404);
  }

  // Verificar se já existe ministério com o mesmo nome
  const { data: existing } = await supabase
    .from('ministries')
    .select('id')
    .eq('name', ministryData.name)
    .single();

  if (existing) {
    throw new AppError('Já existe um ministério com este nome', 400);
  }

  const { data, error } = await supabase
    .from('ministries')
    .insert({
      ...ministryData,
      ativo: true
    })
    .select(`
      *,
      lider:users!ministries_lider_id_fkey(name, email)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao criar ministério', 500);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:ministries*');

  res.status(201).json({
    success: true,
    data,
    message: 'Ministério criado com sucesso'
  });
});

export const updateMinistry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Verificar se o líder existe (se estiver sendo atualizado)
  if (updateData.lider_id) {
    const { data: leader, error: leaderError } = await supabase
      .from('users')
      .select('id')
      .eq('id', updateData.lider_id)
      .single();

    if (leaderError || !leader) {
      throw new AppError('Líder não encontrado', 404);
    }
  }

  const { data, error } = await supabase
    .from('ministries')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      lider:users!ministries_lider_id_fkey(name, email)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao atualizar ministério', 500);
  }

  if (!data) {
    throw new AppError('Ministério não encontrado', 404);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:ministries*');

  res.json({
    success: true,
    data,
    message: 'Ministério atualizado com sucesso'
  });
});

export const deleteMinistry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Verificar se há membros no ministério
  const { count } = await supabase
    .from('ministry_members')
    .select('*', { count: 'exact', head: true })
    .eq('ministry_id', id)
    .eq('ativo', true);

  if (count && count > 0) {
    throw new AppError('Não é possível deletar ministério com membros ativos', 400);
  }

  const { error } = await supabase
    .from('ministries')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('Erro ao deletar ministério', 500);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:ministries*');

  res.json({
    success: true,
    message: 'Ministério deletado com sucesso'
  });
});

export const getMinistryMembers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { page = 1, limit = 10, ativo } = req.query as any;

  let query = supabase
    .from('ministry_members')
    .select(`
      *,
      user:users(id, name, email, telefone),
      ministry:ministries(id, name)
    `, { count: 'exact' })
    .eq('ministry_id', id);

  // Filtros
  if (ativo !== undefined) {
    query = query.eq('ativo', ativo === 'true');
  }

  // Paginação
  query = query
    .order('joined_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Erro ao buscar membros do ministério', 500);
  }

  const response: PaginatedResponse<any> = {
    data: data || [],
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

export const addMinistryMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { ministry_id, user_id, cargo } = req.body;

  // Verificar se o ministério existe
  const { data: ministry, error: ministryError } = await supabase
    .from('ministries')
    .select('id, name')
    .eq('id', ministry_id)
    .single();

  if (ministryError || !ministry) {
    throw new AppError('Ministério não encontrado', 404);
  }

  // Verificar se o usuário existe
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', user_id)
    .single();

  if (userError || !user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Verificar se já é membro do ministério
  const { data: existing } = await supabase
    .from('ministry_members')
    .select('id')
    .eq('ministry_id', ministry_id)
    .eq('user_id', user_id)
    .eq('ativo', true)
    .single();

  if (existing) {
    throw new AppError('Usuário já é membro deste ministério', 400);
  }

  const { data, error } = await supabase
    .from('ministry_members')
    .insert({
      ministry_id,
      user_id,
      cargo: cargo || 'Membro',
      ativo: true
    })
    .select(`
      *,
      user:users(name, email),
      ministry:ministries(name)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao adicionar membro ao ministério', 500);
  }

  res.status(201).json({
    success: true,
    data,
    message: 'Membro adicionado ao ministério com sucesso'
  });
});

export const removeMinistryMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('ministry_members')
    .update({ ativo: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Erro ao remover membro do ministério', 500);
  }

  if (!data) {
    throw new AppError('Membro não encontrado', 404);
  }

  res.json({
    success: true,
    message: 'Membro removido do ministério com sucesso'
  });
});

export const updateMinistryMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { cargo, ativo } = req.body;

  const updateData: any = {};
  if (cargo !== undefined) updateData.cargo = cargo;
  if (ativo !== undefined) updateData.ativo = ativo;

  const { data, error } = await supabase
    .from('ministry_members')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      user:users(name, email),
      ministry:ministries(name)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao atualizar membro do ministério', 500);
  }

  if (!data) {
    throw new AppError('Membro não encontrado', 404);
  }

  res.json({
    success: true,
    data,
    message: 'Membro do ministério atualizado com sucesso'
  });
});