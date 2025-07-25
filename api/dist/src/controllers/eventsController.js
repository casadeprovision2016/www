"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unregisterFromEvent = exports.registerForEvent = exports.getEventStats = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getEvents = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const errorHandler_1 = require("../middleware/errorHandler");
const cacheService_1 = require("../services/cacheService");
// Helper function to map database fields to frontend format
const mapEventToFrontend = (event) => {
    if (!event)
        return event;
    return {
        id: event.id,
        title: event.titulo,
        description: event.descricao,
        date: event.data_inicio ? new Date(event.data_inicio).toISOString().split('T')[0] : '',
        time: event.data_inicio ? new Date(event.data_inicio).toTimeString().substring(0, 5) : '',
        location: event.local,
        category: 'culto', // Valor padrão já que não existe na tabela
        capacity: event.max_participantes,
        status: 'scheduled', // Valor padrão já que não existe na tabela
        created_by: event.created_by,
        created_at: event.created_at,
        updated_at: event.updated_at
    };
};
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
exports.getEvents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, upcoming, past, month, year, sort = 'data_inicio', order = 'desc' } = req.query;
    let query = supabase
        .from('events')
        .select('*', { count: 'exact' });
    // Filtros
    if (upcoming) {
        query = query.gte('data_inicio', new Date().toISOString());
    }
    if (past) {
        query = query.lt('data_inicio', new Date().toISOString());
    }
    if (month) {
        const [yearStr, monthStr] = month.split('-');
        const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
        const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0);
        query = query.gte('data_inicio', startDate.toISOString())
            .lte('data_inicio', endDate.toISOString());
    }
    if (year) {
        const startDate = new Date(parseInt(year), 0, 1);
        const endDate = new Date(parseInt(year), 11, 31);
        query = query.gte('data_inicio', startDate.toISOString())
            .lte('data_inicio', endDate.toISOString());
    }
    // Ordenação e paginação
    query = query
        .order(sort, { ascending: order === 'asc' })
        .range((page - 1) * limit, page * limit - 1);
    const { data, error, count } = await query;
    if (error) {
        throw new errorHandler_1.AppError('Erro ao buscar eventos', 500);
    }
    const mappedData = (data || []).map(mapEventToFrontend);
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
exports.getEventById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
    if (error || !data) {
        throw new errorHandler_1.AppError('Evento não encontrado', 404);
    }
    res.json({
        success: true,
        data: mapEventToFrontend(data)
    });
});
exports.createEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { title, description, date, time, location, category, capacity } = req.body;
    const userId = req.user.id;
    // Mapear campos do frontend para a estrutura da base de dados
    const eventData = {
        titulo: title,
        descricao: description,
        data_inicio: new Date(`${date}T${time}:00Z`).toISOString(),
        local: location,
        max_participantes: capacity,
        created_by: userId
    };
    const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao criar evento', 500);
    }
    // Invalidar cache de estatísticas
    await cacheService_1.cacheService.invalidate('stats:events*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.status(201).json({
        success: true,
        data: mapEventToFrontend(data),
        message: 'Evento criado com sucesso'
    });
});
exports.updateEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { title, description, date, time, location, category, capacity } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    // Verificar se o evento existe e se o usuário tem permissão
    const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('created_by')
        .eq('id', id)
        .single();
    if (fetchError || !existingEvent) {
        throw new errorHandler_1.AppError('Evento não encontrado', 404);
    }
    // Apenas admin ou o criador pode editar
    if (userRole !== 'admin' && existingEvent.created_by !== userId) {
        throw new errorHandler_1.AppError('Sem permissão para editar este evento', 403);
    }
    // Mapear campos do frontend para a estrutura da base de dados
    const updateData = {};
    if (title)
        updateData.titulo = title;
    if (description)
        updateData.descricao = description;
    if (date && time)
        updateData.data_inicio = new Date(`${date}T${time}:00Z`).toISOString();
    if (location)
        updateData.local = location;
    if (capacity)
        updateData.max_participantes = capacity;
    // Ignorar category e status pois não existem na tabela atual
    const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao atualizar evento', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:events*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.json({
        success: true,
        data: mapEventToFrontend(data),
        message: 'Evento atualizado com sucesso'
    });
});
exports.deleteEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    // Verificar se o evento existe e permissões
    const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('created_by')
        .eq('id', id)
        .single();
    if (fetchError || !existingEvent) {
        throw new errorHandler_1.AppError('Evento não encontrado', 404);
    }
    if (userRole !== 'admin' && existingEvent.created_by !== userId) {
        throw new errorHandler_1.AppError('Sem permissão para deletar este evento', 403);
    }
    // @ts-ignore
    const { error } = await supabase
        .from('events')
        .eq('id', id)
        .delete();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao deletar evento', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:events*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.json({
        success: true,
        message: 'Evento deletado com sucesso'
    });
});
exports.getEventStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cacheKey = 'stats:events';
    const cached = await cacheService_1.cacheService.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached
        });
    }
    // Total de eventos
    const { count: total } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
    // Eventos este mês
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const { count: thisMonth } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('data_inicio', startOfMonth.toISOString())
        .lte('data_inicio', endOfMonth.toISOString());
    // Eventos próximos (próximos 30 dias)
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    const { count: upcoming } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('data_inicio', new Date().toISOString())
        .lte('data_inicio', next30Days.toISOString());
    const stats = {
        total: total || 0,
        active: upcoming || 0,
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
exports.registerForEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    // Verificar se o evento existe
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, max_participantes')
        .eq('id', id)
        .single();
    if (eventError || !event) {
        throw new errorHandler_1.AppError('Evento não encontrado', 404);
    }
    // Verificar se já está inscrito
    const { data: existing } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', userId)
        .single();
    if (existing) {
        throw new errorHandler_1.AppError('Usuário já inscrito neste evento', 400);
    }
    // Verificar lotação se houver limite
    if (event.max_participantes) {
        const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', id)
            .eq('status', 'confirmada');
        if (count && count >= event.max_participantes) {
            throw new errorHandler_1.AppError('Evento lotado', 400);
        }
    }
    // Criar inscrição
    const { data, error } = await supabase
        .from('event_registrations')
        .insert({
        event_id: id,
        user_id: userId,
        status: 'confirmada'
    })
        .select()
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao realizar inscrição', 500);
    }
    res.status(201).json({
        success: true,
        data,
        message: 'Inscrição realizada com sucesso'
    });
});
exports.unregisterFromEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', id)
        .eq('user_id', userId);
    if (error) {
        throw new errorHandler_1.AppError('Erro ao cancelar inscrição', 500);
    }
    res.json({
        success: true,
        message: 'Inscrição cancelada com sucesso'
    });
});
//# sourceMappingURL=eventsController.js.map