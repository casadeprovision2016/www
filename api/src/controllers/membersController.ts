import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, CreateMemberRequest, MemberQueryParams, PaginatedResponse, StatsResponse } from '@shared/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cacheService';
import { startOfWeek, endOfWeek, format } from 'date-fns';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const getMembers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Mock user para testes - REMOVER EM PRODUÇÃO
  if (!req.user) {
    req.user = { id: '550e8400-e29b-41d4-a716-446655440001', role: 'admin' } as any;
  }
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
      users!inner(id, nome, email, telefone)
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
    name: member.users?.nome || 'Nome não informado',
    email: member.users?.email || '',
    phone: member.users?.telefone || '',
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
  // Mock user para testes - REMOVER EM PRODUÇÃO
  if (!req.user) {
    req.user = { id: '550e8400-e29b-41d4-a716-446655440001', role: 'admin' } as any;
  }
  const { id } = req.params;

  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      users!inner(id, nome, email, telefone),
      ministry_members(
        id,
        cargo,
        ativo,
        data_ingresso,
        ministries!inner(id, nome, descricao)
      ),
      donations(id, valor, tipo, data_doacao),
      pastoral_visits!pastoral_visits_visitado_id_fkey(
        id, data_visita, motivo, status,
        users!pastoral_visits_pastor_id_fkey(nome)
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
  console.log('🔄 Creating member with data:', req.body);
  
  const memberData = req.body;
  let userId = memberData.user_id;
  
  // Se não tem user_id, criar um novo usuário primeiro
  if (!userId && memberData.name && memberData.email) {
    console.log('📝 Creating new user first');
    
    // Verificar se email já existe na tabela users  
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', memberData.email)
      .single();
    
    if (existingUser) {
      throw new AppError('Email já está em uso', 400);
    }
    
    let authUserId: string;
    
    // Usar upsert em vez de insert para ser mais robusto
    console.log('🔐 Creating or finding auth user');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: memberData.email,
      password: Math.random().toString(36).slice(-8) + 'A1!', // Senha temporária
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      
      // Se o email já existe no auth, buscar o usuário existente
      if (authError.message?.includes('already registered')) {
        console.log('🔍 Auth user already exists, trying to find existing user');
        
        // Buscar usuários para encontrar o ID do usuário com este email
        const { data: allUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = allUsers?.users?.find((u: any) => u.email === memberData.email);
        
        if (existingAuthUser) {
          authUserId = existingAuthUser.id;
          console.log('✅ Found existing auth user with ID:', authUserId);
        } else {
          throw new AppError('Email já está registrado mas usuário não encontrado', 400);
        }
      } else {
        throw new AppError('Erro ao criar usuário de autenticação', 500);
      }
    } else if (authUser.user) {
      authUserId = authUser.user.id;
      console.log('✅ New auth user created with ID:', authUserId);
    } else {
      throw new AppError('Falha ao criar usuário de autenticação', 500);
    }

    // Criar registro na tabela users usando UPSERT para ser mais robusto
    console.log('📋 Creating user record with UPSERT');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        nome: memberData.name,
        email: memberData.email,
        telefone: memberData.phone || null,
        endereco: memberData.address || null,
        data_nascimento: memberData.birthDate ? new Date(memberData.birthDate).toISOString().split('T')[0] : null,
        role: 'member',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select('id')
      .single();
    
    if (userError || !newUser) {
      console.error('❌ Error creating user record:', userError);
      
      // Se der erro na tabela users, tentar limpar o auth user criado
      try {
        await supabase.auth.admin.deleteUser(authUserId);
        console.log('🗑️ Cleaned up auth user after failure');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }
      
      throw new AppError('Erro ao criar registro de usuário', 500);
    }
    
    userId = newUser.id;
    console.log('✅ User record created with ID:', userId);
  }
  
  if (!userId) {
    throw new AppError('ID do usuário é obrigatório', 400);
  }
  
  // Verificar se já é membro
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (existing) {
    throw new AppError('Usuário já é membro', 400);
  }
  
  // Preparar dados do membro
  const tipoMembro = memberData.tipo_membro || memberData.membership_type || memberData.membershipType || 'congregado';
  const dataIngresso = memberData.data_ingresso || memberData.join_date || memberData.joinDate || new Date().toISOString().split('T')[0]; // Formato DATE
  
  const { data, error } = await supabase
    .from('members')
    .insert({
      user_id: userId,
      tipo_membro: tipoMembro,
      data_ingresso: dataIngresso,
      status: 'ativo',
      observacoes: memberData.observacoes || memberData.notes || null
    })
    .select(`
      *,
      users!inner(nome, email, telefone)
    `)
    .single();
  
  if (error) {
    console.error('❌ Error creating member:', error);
    throw new AppError('Erro ao criar membro', 500);
  }
  
  console.log('✅ Member created successfully');
  
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
  // Mock user para testes - REMOVER EM PRODUÇÃO
  if (!req.user) {
    req.user = { id: '550e8400-e29b-41d4-a716-446655440001', role: 'admin' } as any;
  }
  const { id } = req.params;
  const updateData = req.body;
  
  console.log('🔄 Updating member with ID:', id);
  console.log('📝 Update data received:', updateData);

  // Mapear campos inglês -> português se necessário
  const mappedData: any = {};
  
  if (updateData.status) {
    mappedData.status = updateData.status === 'active' ? 'ativo' : updateData.status === 'inactive' ? 'inativo' : updateData.status;
  }
  if (updateData.membershipType || updateData.membership_type) {
    mappedData.tipo_membro = updateData.membershipType || updateData.membership_type;
  }
  if (updateData.notes || updateData.observacoes) {
    mappedData.observacoes = updateData.notes || updateData.observacoes;
  }
  if (updateData.baptized !== undefined) {
    mappedData.batizado = updateData.baptized;
  }
  if (updateData.baptismDate || updateData.data_batismo) {
    mappedData.data_batismo = updateData.baptismDate || updateData.data_batismo;
  }
  if (updateData.tithe !== undefined || updateData.dizimista !== undefined) {
    mappedData.dizimista = updateData.tithe !== undefined ? updateData.tithe : updateData.dizimista;
  }
  if (updateData.joinDate || updateData.data_ingresso) {
    mappedData.data_ingresso = updateData.joinDate || updateData.data_ingresso;
  }
  if (updateData.endDate || updateData.data_saida) {
    mappedData.data_saida = updateData.endDate || updateData.data_saida;
  }
  
  // O trigger update_members_updated_at atualiza automaticamente o updated_at
  // mappedData.updated_at = new Date().toISOString();
  
  console.log('📋 Mapped data for database:', mappedData);

  const { data, error } = await supabase
    .from('members')
    .update(mappedData)
    .eq('id', id)
    .select(`
      *,
      users!inner(nome, email)
    `)
    .single();

  if (error) {
    console.error('❌ Database error:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    throw new AppError(`Erro ao atualizar membro: ${error.message}`, 500);
  }

  if (!data) {
    throw new AppError('Membro não encontrado', 404);
  }

  console.log('✅ Member updated successfully');

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
      data_saida: new Date().toISOString().split('T')[0]
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
      users!inner(id, nome, email, data_nascimento)
    `)
    .eq('status', 'ativo')
    .not('users.data_nascimento', 'is', null);

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
    if (!member.users?.data_nascimento) return false;
    
    const birthdate = new Date(member.users.data_nascimento);
    const thisYearBirthday = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
    
    return thisYearBirthday >= weekStart && thisYearBirthday <= weekEnd;
  });

  await cacheService.set(cacheKey, weekBirthdays, 3600); // 1 hora

  res.json({
    success: true,
    data: weekBirthdays
  });
});