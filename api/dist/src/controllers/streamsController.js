"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endStream = exports.deleteStream = exports.updateStream = exports.createStream = exports.getLiveStream = exports.getStreamById = exports.getStreams = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const errorHandler_1 = require("../middleware/errorHandler");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
exports.getStreams = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status, month, year, sort = 'data_inicio', order = 'desc' } = req.query;
    let query = supabase
        .from('live_streams')
        .select(`
      *,
      created_by:users!live_streams_created_by_fkey(name, email)
    `, { count: 'exact' });
    // Filtros
    if (status === 'ativa') {
        query = query.eq('ativa', true);
    }
    else if (status === 'finalizada') {
        query = query.eq('ativa', false);
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
        throw new errorHandler_1.AppError('Erro ao buscar transmissões', 500);
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
exports.getStreamById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('live_streams')
        .select(`
      *,
      created_by:users!live_streams_created_by_fkey(name, email)
    `)
        .eq('id', id)
        .single();
    if (error || !data) {
        throw new errorHandler_1.AppError('Transmissão não encontrada', 404);
    }
    res.json({
        success: true,
        data
    });
});
exports.getLiveStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { data, error } = await supabase
        .from('live_streams')
        .select(`
      *,
      created_by:users!live_streams_created_by_fkey(name, email)
    `)
        .eq('ativa', true)
        .order('data_inicio', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116') {
        throw new errorHandler_1.AppError('Erro ao buscar transmissão ao vivo', 500);
    }
    res.json({
        success: true,
        data: data || null
    });
});
exports.createStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const streamData = req.body;
    const userId = req.user.id;
    const { data, error } = await supabase
        .from('live_streams')
        .insert({
        ...streamData,
        created_by: userId,
        ativa: true
    })
        .select(`
      *,
      created_by:users!live_streams_created_by_fkey(name, email)
    `)
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao criar transmissão', 500);
    }
    res.status(201).json({
        success: true,
        data,
        message: 'Transmissão criada com sucesso'
    });
});
exports.updateStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    // Verificar se a transmissão existe e permissões
    const { data: existingStream, error: fetchError } = await supabase
        .from('live_streams')
        .select('created_by')
        .eq('id', id)
        .single();
    if (fetchError || !existingStream) {
        throw new errorHandler_1.AppError('Transmissão não encontrada', 404);
    }
    // Apenas admin ou o criador pode editar
    if (userRole !== 'admin' && existingStream.created_by !== userId) {
        throw new errorHandler_1.AppError('Sem permissão para editar esta transmissão', 403);
    }
    const { data, error } = await supabase
        .from('live_streams')
        .update(updateData)
        .eq('id', id)
        .select(`
      *,
      created_by:users!live_streams_created_by_fkey(name, email)
    `)
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao atualizar transmissão', 500);
    }
    res.json({
        success: true,
        data,
        message: 'Transmissão atualizada com sucesso'
    });
});
exports.deleteStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    // Verificar permissões
    const { data: existingStream, error: fetchError } = await supabase
        .from('live_streams')
        .select('created_by')
        .eq('id', id)
        .single();
    if (fetchError || !existingStream) {
        throw new errorHandler_1.AppError('Transmissão não encontrada', 404);
    }
    if (userRole !== 'admin' && existingStream.created_by !== userId) {
        throw new errorHandler_1.AppError('Sem permissão para deletar esta transmissão', 403);
    }
    const { error } = await supabase
        .from('live_streams')
        .delete()
        .eq('id', id);
    if (error) {
        throw new errorHandler_1.AppError('Erro ao deletar transmissão', 500);
    }
    res.json({
        success: true,
        message: 'Transmissão deletada com sucesso'
    });
});
exports.endStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    // Verificar permissões
    const { data: existingStream, error: fetchError } = await supabase
        .from('live_streams')
        .select('created_by, ativa')
        .eq('id', id)
        .single();
    if (fetchError || !existingStream) {
        throw new errorHandler_1.AppError('Transmissão não encontrada', 404);
    }
    if (userRole !== 'admin' && existingStream.created_by !== userId) {
        throw new errorHandler_1.AppError('Sem permissão para finalizar esta transmissão', 403);
    }
    if (!existingStream.ativa) {
        throw new errorHandler_1.AppError('Transmissão já foi finalizada', 400);
    }
    const { data, error } = await supabase
        .from('live_streams')
        .update({
        ativa: false,
        data_fim: new Date().toISOString()
    })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw new errorHandler_1.AppError('Erro ao finalizar transmissão', 500);
    }
    res.json({
        success: true,
        data,
        message: 'Transmissão finalizada com sucesso'
    });
});
//# sourceMappingURL=streamsController.js.map