"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endStream = exports.deleteStream = exports.updateStream = exports.createStream = exports.getLiveStream = exports.getStreamById = exports.getStreams = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const errorHandler_1 = require("../middleware/errorHandler");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Mapeia os campos do frontend para o banco de dados
const mapToDbSchema = (data) => {
    const dbData = {};
    if (data.title !== undefined)
        dbData.titulo = data.title;
    if (data.description !== undefined)
        dbData.descricao = data.description;
    if (data.streamUrl !== undefined)
        dbData.url_stream = data.streamUrl;
    if (data.chatUrl !== undefined)
        dbData.url_chat = data.chatUrl;
    if (data.startDate !== undefined)
        dbData.data_inicio = data.startDate;
    if (data.endDate !== undefined)
        dbData.data_fim = data.endDate;
    if (data.status !== undefined)
        dbData.status = data.status;
    if (data.eventId !== undefined)
        dbData.evento_id = data.eventId;
    if (data.views !== undefined)
        dbData.visualizacoes = data.views;
    if (data.recordingUrl !== undefined)
        dbData.gravacao_url = data.recordingUrl;
    if (data.public !== undefined)
        dbData.publico = data.public;
    if (data.password !== undefined)
        dbData.senha = data.password;
    if (data.notes !== undefined)
        dbData.observacoes = data.notes;
    return dbData;
};
// Mapeia os campos do banco de dados para o frontend
const mapToFrontendSchema = (stream) => {
    if (!stream)
        return null;
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
exports.getStreams = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status, month, year, sort = 'data_inicio', order = 'desc' } = req.query;
    let query = supabase
        .from('live_streams')
        .select(`
      *,
      created_by:users!live_streams_created_by_fkey(nome, email)
    `, { count: 'exact' });
    if (status)
        query = query.eq('status', status);
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
    if (error)
        throw new errorHandler_1.AppError('Erro ao buscar transmissões', 500);
    const mappedData = (data || []).map(mapToFrontendSchema);
    const response = {
        data: mappedData,
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil((count || 0) / limit)
    };
    res.json({ success: true, data: response });
});
exports.getStreamById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('live_streams').select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).eq('id', id).single();
    if (error || !data)
        throw new errorHandler_1.AppError('Transmissão não encontrada', 404);
    res.json({ success: true, data: mapToFrontendSchema(data) });
});
exports.getLiveStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { data, error } = await supabase.from('live_streams').select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).eq('status', 'ao_vivo').order('data_inicio', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116')
        throw new errorHandler_1.AppError('Erro ao buscar transmissão ao vivo', 500);
    res.json({ success: true, data: mapToFrontendSchema(data) });
});
exports.createStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const streamData = req.body;
    const userId = req.user.id;
    const dbData = mapToDbSchema(streamData);
    const { data, error } = await supabase.from('live_streams').insert({ ...dbData, created_by: userId, status: 'agendado' }).select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).single();
    if (error) {
        console.error('Create stream error:', error);
        throw new errorHandler_1.AppError('Erro ao criar transmissão', 500);
    }
    res.status(201).json({ success: true, data: mapToFrontendSchema(data), message: 'Transmissão criada com sucesso' });
});
exports.updateStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const dbData = mapToDbSchema(updateData);
    const { data, error } = await supabase.from('live_streams').update(dbData).eq('id', id).select(`*, created_by:users!live_streams_created_by_fkey(nome, email)`).single();
    if (error) {
        console.error('Update stream error:', error);
        throw new errorHandler_1.AppError('Erro ao atualizar transmissão', 500);
    }
    res.json({ success: true, data: mapToFrontendSchema(data), message: 'Transmissão atualizada com sucesso' });
});
exports.deleteStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('live_streams').delete().eq('id', id);
    if (error) {
        console.error('Delete stream error:', error);
        throw new errorHandler_1.AppError('Erro ao deletar transmissão', 500);
    }
    res.json({ success: true, message: 'Transmissão deletada com sucesso' });
});
exports.endStream = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { data: existingStream, error: fetchError } = await supabase.from('live_streams').select('status').eq('id', id).single();
    if (fetchError || !existingStream)
        throw new errorHandler_1.AppError('Transmissão não encontrada', 404);
    if (existingStream.status === 'finalizado' || existingStream.status === 'cancelado')
        throw new errorHandler_1.AppError('Transmissão já foi finalizada ou cancelada', 400);
    const { data, error } = await supabase.from('live_streams').update({ status: 'finalizado', data_fim: new Date().toISOString() }).eq('id', id).select().single();
    if (error) {
        console.error('End stream error:', error);
        throw new errorHandler_1.AppError('Erro ao finalizar transmissão', 500);
    }
    res.json({ success: true, data: mapToFrontendSchema(data), message: 'Transmissão finalizada com sucesso' });
});
//# sourceMappingURL=streamsController.js.map