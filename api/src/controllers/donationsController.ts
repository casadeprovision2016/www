import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, CreateDonationRequest, DonationQueryParams, PaginatedResponse, StatsResponse } from '@shared/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cacheService';
import { uploadService } from '../services/uploadService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const getDonations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
    query = query.gte('data_doacao', start_date);
  }
  if (end_date) {
    query = query.lte('data_doacao', end_date);
  }
  if (min_amount) {
    query = query.gte('valor', parseFloat(min_amount));
  }
  if (max_amount) {
    query = query.lte('valor', parseFloat(max_amount));
  }

  // Ordenação e paginação
  query = query
    .order(sort, { ascending: order === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Erro ao buscar doações', 500);
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

export const getDonationById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
});

export const createDonation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const donationData: CreateDonationRequest = req.body;

  // Verificar se o usuário existe
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', donationData.user_id)
    .single();

  if (userError || !user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const { data, error } = await supabase
    .from('donations')
    .insert(donationData)
    .select(`
      *,
      user:users(name, email)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao criar doação', 500);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:donations*');
  await cacheService.invalidate('stats:dashboard');

  res.status(201).json({
    success: true,
    data,
    message: 'Doação registrada com sucesso'
  });
});

export const updateDonation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await supabase
    .from('donations')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      user:users(name, email)
    `)
    .single();

  if (error) {
    throw new AppError('Erro ao atualizar doação', 500);
  }

  if (!data) {
    throw new AppError('Doação não encontrada', 404);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:donations*');
  await cacheService.invalidate('stats:dashboard');

  res.json({
    success: true,
    data,
    message: 'Doação atualizada com sucesso'
  });
});

export const deleteDonation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('Erro ao deletar doação', 500);
  }

  // Invalidar cache
  await cacheService.invalidate('stats:donations*');
  await cacheService.invalidate('stats:dashboard');

  res.json({
    success: true,
    message: 'Doação deletada com sucesso'
  });
});

export const uploadReceipt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    throw new AppError('Arquivo não fornecido', 400);
  }

  // Verificar se a doação existe
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .select('id')
    .eq('id', id)
    .single();

  if (donationError || !donation) {
    throw new AppError('Doação não encontrada', 404);
  }

  try {
    // Upload do arquivo
    const filePath = await uploadService.uploadImage(file, 'receipts');

    // Atualizar doação com o caminho do comprovante
    const { data, error } = await supabase
      .from('donations')
      .update({ comprovante: filePath })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError('Erro ao salvar comprovante', 500);
    }

    res.json({
      success: true,
      data,
      message: 'Comprovante enviado com sucesso'
    });
  } catch (error) {
    throw new AppError('Erro no upload do arquivo', 500);
  }
});

export const getDonationStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cacheKey = 'stats:donations';
  const cached = await cacheService.get(cacheKey);
  
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

  const totalAmount = totalAmountData?.reduce((sum, donation) => sum + donation.valor, 0) || 0;

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

  const thisMonthAmount = thisMonthAmountData?.reduce((sum, donation) => sum + donation.valor, 0) || 0;

  // Estatísticas por tipo
  const { data: typeStats } = await supabase
    .from('donations')
    .select('tipo, valor');

  const byType = typeStats?.reduce((acc: any, donation) => {
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

  await cacheService.set(cacheKey, stats, 1800); // 30 minutos

  res.json({
    success: true,
    data: stats
  });
});

export const exportDonations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { format = 'csv', start_date, end_date, tipo } = req.query as any;

  let query = supabase
    .from('donations')
    .select(`
      *,
      user:users(name, email)
    `);

  // Filtros
  if (start_date) {
    query = query.gte('data_doacao', start_date);
  }
  if (end_date) {
    query = query.lte('data_doacao', end_date);
  }
  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  const { data, error } = await query.order('data_doacao', { ascending: false });

  if (error) {
    throw new AppError('Erro ao buscar doações para exportação', 500);
  }

  if (format === 'csv') {
    // Gerar CSV
    const csvHeader = 'Data,Tipo,Valor,Doador,Email,Descrição\n';
    const csvRows = data?.map(donation => 
      `${donation.data_doacao},${donation.tipo},${donation.valor},"${donation.user?.name || ''}","${donation.user?.email || ''}","${donation.descricao || ''}"`
    ).join('\n') || '';

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=doacoes.csv');
    res.send(csv);
  } else {
    // Retornar JSON
    res.json({
      success: true,
      data: data || []
    });
  }
});

export const getDonationsByUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query as any;

  const { data, error, count } = await supabase
    .from('donations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('data_doacao', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    throw new AppError('Erro ao buscar doações do usuário', 500);
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