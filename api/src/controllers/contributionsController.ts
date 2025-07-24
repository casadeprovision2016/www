import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, PaginatedResponse } from '@shared/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getContributions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    tipo, 
    user_id, 
    start_date, 
    end_date,
    sort = 'data_contribuicao', 
    order = 'desc' 
  } = req.query as any;
  
  let query = supabase
    .from('contributions')
    .select(`
      *,
      user:users(id, name, email)
    `, { count: 'exact' });

  // Filtros
  if (tipo) {
    query = query.eq('tipo', tipo);
  }
  if (user_id) {
    query = query.eq('user_id', user_id);
  }
  if (start_date) {
    query = query.gte('data_contribuicao', start_date);
  }
  if (end_date) {
    query = query.lte('data_contribuicao', end_date);
  }

  // Ordenação e paginação
  query = query
    .order(sort, { ascending: order === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Erro ao buscar contribuições', 500);
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

export const createContribution = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { user_id, valor, tipo, descricao, data_contribuicao } = req.body;

  // Verificar se o usuário existe
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', user_id)
    .single();

  if (userError || !user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const { data, error } = await supabase
    .from('contributions')
    .insert({
      user_id,
      valor,
      tipo,
      descricao,
      data_contribuicao
    })
    .select(`
      *,
      user:users(name, email)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao criar contribuição', 500);
  }

  res.status(201).json({
    success: true,
    data,
    message: 'Contribuição registrada com sucesso'
  });
});