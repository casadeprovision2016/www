"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisitsByMember = exports.getVisitsByPastor = exports.getPastoralVisitStats = exports.cancelPastoralVisit = exports.completePastoralVisit = exports.deletePastoralVisit = exports.updatePastoralVisit = exports.createPastoralVisit = exports.getPastoralVisitById = exports.getPastoralVisits = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const errorHandler_1 = require("../middleware/errorHandler");
const cacheService_1 = require("../services/cacheService");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
exports.getPastoralVisits = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status, pastor_id, visitado_id, start_date, end_date, sort = 'data_visita', order = 'desc' } = req.query;
    let query = supabase
        .from('pastoral_visits')
        .select(`
      *,
      pastor:users!pastoral_visits_pastor_id_fkey(id, name, email),
      visitado:users!pastoral_visits_visitado_id_fkey(id, name, email)
    `, { count: 'exact' });
    // Filtros
    if (status) {
        query = query.eq('status', status);
    }
    if (pastor_id) {
        query = query.eq('pastor_id', pastor_id);
    }
    if (visitado_id) {
        query = query.eq('visitado_id', visitado_id);
    }
    if (start_date) {
        query = query.gte('data_visita', start_date);
    }
    if (end_date) {
        query = query.lte('data_visita', end_date);
    }
    // Ordenação e paginação
    query = query
        .order(sort, { ascending: order === 'asc' })
        .range((page - 1) * limit, page * limit - 1);
    const { data, error, count } = await query;
    if (error) {
        throw new errorHandler_1.AppError('Erro ao buscar visitas pastorais', 500);
    }
    const response = {
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
exports.getPastoralVisitById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('pastoral_visits')
        .select(`
      *,
      pastor:users!pastoral_visits_pastor_id_fkey(id, name, email, telefone),
      visitado:users!pastoral_visits_visitado_id_fkey(id, name, email, telefone)
    `)
        .eq('id', id)
        .single();
    if (error || !data) {
        throw new errorHandler_1.AppError('Visita pastoral não encontrada', 404);
    }
    res.json({
        success: true,
        data
    });
});
exports.createPastoralVisit = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const visitData = req.body;
    // Verificar se os usuários existem
    const { data: pastor, error: pastorError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', visitData.pastor_id)
        .single();
    if (pastorError || !pastor) {
        throw new errorHandler_1.AppError('Pastor não encontrado', 404);
    }
    const { data: visitado, error: visitadoError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', visitData.visitado_id)
        .single();
    if (visitadoError || !visitado) {
        throw new errorHandler_1.AppError('Pessoa a ser visitada não encontrada', 404);
    }
    const { data, error } = await supabase
        .from('pastoral_visits')
        .insert({
        ...visitData,
        status: 'agendada'
    })
        .select(`
      *,
      pastor:users!pastoral_visits_pastor_id_fkey(name, email),
      visitado:users!pastoral_visits_visitado_id_fkey(name, email)
    `)
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao criar visita pastoral', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:pastoral_visits*');
    res.status(201).json({
        success: true,
        data,
        message: 'Visita pastoral agendada com sucesso'
    });
});
exports.updatePastoralVisit = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Verificar se novos usuários existem (se estiverem sendo atualizados)
    if (updateData.pastor_id) {
        const { data: pastor, error: pastorError } = await supabase
            .from('users')
            .select('id')
            .eq('id', updateData.pastor_id)
            .single();
        if (pastorError || !pastor) {
            throw new errorHandler_1.AppError('Pastor não encontrado', 404);
        }
    }
    if (updateData.visitado_id) {
        const { data: visitado, error: visitadoError } = await supabase
            .from('users')
            .select('id')
            .eq('id', updateData.visitado_id)
            .single();
        if (visitadoError || !visitado) {
            throw new errorHandler_1.AppError('Pessoa a ser visitada não encontrada', 404);
        }
    }
    const { data, error } = await supabase
        .from('pastoral_visits')
        .update(updateData)
        .eq('id', id)
        .select(`
      *,
      pastor:users!pastoral_visits_pastor_id_fkey(name, email),
      visitado:users!pastoral_visits_visitado_id_fkey(name, email)
    `)
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao atualizar visita pastoral', 500);
    }
    if (!data) {
        throw new errorHandler_1.AppError('Visita pastoral não encontrada', 404);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:pastoral_visits*');
    res.json({
        success: true,
        data,
        message: 'Visita pastoral atualizada com sucesso'
    });
});
exports.deletePastoralVisit = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('pastoral_visits')
        .delete()
        .eq('id', id);
    if (error) {
        throw new errorHandler_1.AppError('Erro ao deletar visita pastoral', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:pastoral_visits*');
    res.json({
        success: true,
        message: 'Visita pastoral deletada com sucesso'
    });
});
exports.completePastoralVisit = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { observacoes } = req.body;
    const { data, error } = await supabase
        .from('pastoral_visits')
        .update({
        status: 'concluida',
        observacoes: observacoes || null
    })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao concluir visita pastoral', 500);
    }
    if (!data) {
        throw new errorHandler_1.AppError('Visita pastoral não encontrada', 404);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:pastoral_visits*');
    res.json({
        success: true,
        data,
        message: 'Visita pastoral concluída com sucesso'
    });
});
exports.cancelPastoralVisit = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { motivo_cancelamento } = req.body;
    const { data, error } = await supabase
        .from('pastoral_visits')
        .update({
        status: 'cancelada',
        observacoes: motivo_cancelamento || 'Visita cancelada'
    })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao cancelar visita pastoral', 500);
    }
    if (!data) {
        throw new errorHandler_1.AppError('Visita pastoral não encontrada', 404);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:pastoral_visits*');
    res.json({
        success: true,
        data,
        message: 'Visita pastoral cancelada com sucesso'
    });
});
exports.getPastoralVisitStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cacheKey = 'stats:pastoral_visits';
    const cached = await cacheService_1.cacheService.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached
        });
    }
    // Total de visitas
    const { count: total } = await supabase
        .from('pastoral_visits')
        .select('*', { count: 'exact', head: true });
    // Visitas concluídas
    const { count: completed } = await supabase
        .from('pastoral_visits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluida');
    // Visitas agendadas
    const { count: scheduled } = await supabase
        .from('pastoral_visits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'agendada');
    // Visitas canceladas
    const { count: cancelled } = await supabase
        .from('pastoral_visits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelada');
    // Visitas este mês
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const { count: thisMonth } = await supabase
        .from('pastoral_visits')
        .select('*', { count: 'exact', head: true })
        .gte('data_visita', startOfMonth.toISOString());
    const stats = {
        total: total || 0,
        active: scheduled || 0,
        inactive: cancelled || 0,
        monthly: {
            current: thisMonth || 0,
            completed: completed || 0
        }
    };
    await cacheService_1.cacheService.set(cacheKey, stats, 1800); // 30 minutos
    res.json({
        success: true,
        data: stats
    });
});
exports.getVisitsByPastor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { pastorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    let query = supabase
        .from('pastoral_visits')
        .select(`
      *,
      visitado:users!pastoral_visits_visitado_id_fkey(name, email)
    `, { count: 'exact' })
        .eq('pastor_id', pastorId);
    if (status) {
        query = query.eq('status', status);
    }
    query = query
        .order('data_visita', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
    const { data, error, count } = await query;
    if (error) {
        throw new errorHandler_1.AppError('Erro ao buscar visitas do pastor', 500);
    }
    const response = {
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
exports.getVisitsByMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { memberId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { data, error, count } = await supabase
        .from('pastoral_visits')
        .select(`
      *,
      pastor:users!pastoral_visits_pastor_id_fkey(name, email)
    `, { count: 'exact' })
        .eq('visitado_id', memberId)
        .order('data_visita', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
    if (error) {
        throw new errorHandler_1.AppError('Erro ao buscar visitas do membro', 500);
    }
    const response = {
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
//# sourceMappingURL=pastoralVisitsController.js.map