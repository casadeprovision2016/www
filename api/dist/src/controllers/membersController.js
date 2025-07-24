"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberBirthdays = exports.getMemberStats = exports.deactivateMember = exports.deleteMember = exports.updateMember = exports.createMember = exports.getMemberById = exports.getMembers = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const errorHandler_1 = require("../middleware/errorHandler");
const cacheService_1 = require("../services/cacheService");
const date_fns_1 = require("date-fns");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
exports.getMembers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status, membership_type, ministry_id, sort = 'created_at', order = 'desc' } = req.query;
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
        throw new errorHandler_1.AppError('Erro ao buscar membros', 500);
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
    const response = {
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
exports.getMemberById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        throw new errorHandler_1.AppError('Membro não encontrado', 404);
    }
    res.json({
        success: true,
        data
    });
});
exports.createMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const memberData = req.body;
    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', memberData.user_id)
        .single();
    if (userError || !user) {
        throw new errorHandler_1.AppError('Usuário não encontrado', 404);
    }
    // Verificar se já é membro
    const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', memberData.user_id)
        .single();
    if (existing) {
        throw new errorHandler_1.AppError('Usuário já é membro', 400);
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
        throw new errorHandler_1.AppError('Erro ao criar membro', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:members*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.status(201).json({
        success: true,
        data,
        message: 'Membro criado com sucesso'
    });
});
exports.updateMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        throw new errorHandler_1.AppError('Erro ao atualizar membro', 500);
    }
    if (!data) {
        throw new errorHandler_1.AppError('Membro não encontrado', 404);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:members*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.json({
        success: true,
        data,
        message: 'Membro atualizado com sucesso'
    });
});
exports.deleteMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
    if (error) {
        throw new errorHandler_1.AppError('Erro ao deletar membro', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:members*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.json({
        success: true,
        message: 'Membro deletado com sucesso'
    });
});
exports.deactivateMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        throw new errorHandler_1.AppError('Erro ao desativar membro', 500);
    }
    if (!data) {
        throw new errorHandler_1.AppError('Membro não encontrado', 404);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:members*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.json({
        success: true,
        data,
        message: 'Membro desativado com sucesso'
    });
});
exports.getMemberStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cacheKey = 'stats:members';
    const cached = await cacheService_1.cacheService.get(cacheKey);
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
    const stats = {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        monthly: {
            current: thisMonth || 0
        }
    };
    await cacheService_1.cacheService.set(cacheKey, stats, 1800); // 30 minutos
    res.json({
        success: true,
        data: stats
    });
});
exports.getMemberBirthdays = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cacheKey = 'members:birthdays:week';
    const cached = await cacheService_1.cacheService.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached
        });
    }
    const today = new Date();
    const weekStart = (0, date_fns_1.startOfWeek)(today);
    const weekEnd = (0, date_fns_1.endOfWeek)(today);
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
        const emptyBirthdays = [];
        await cacheService_1.cacheService.set(cacheKey, emptyBirthdays, 3600);
        return res.json({
            success: true,
            data: emptyBirthdays,
            message: 'Campo de data de nascimento não encontrado na tabela users. Adicione: ALTER TABLE users ADD COLUMN birthdate DATE;'
        });
    }
    // Filtrar aniversariantes da semana
    const weekBirthdays = (birthdays || []).filter(member => {
        if (!member.user?.birthdate)
            return false;
        const birthdate = new Date(member.user.birthdate);
        const thisYearBirthday = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
        return thisYearBirthday >= weekStart && thisYearBirthday <= weekEnd;
    });
    await cacheService_1.cacheService.set(cacheKey, weekBirthdays, 3600); // 1 hora
    res.json({
        success: true,
        data: weekBirthdays
    });
});
//# sourceMappingURL=membersController.js.map