"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDonationInfo = exports.getDonationInfo = exports.getDonationsByUser = exports.exportDonations = exports.getDonationStats = exports.uploadReceipt = exports.deleteDonation = exports.updateDonation = exports.createDonation = exports.getDonationById = exports.getDonations = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const errorHandler_1 = require("../middleware/errorHandler");
const cacheService_1 = require("../services/cacheService");
const uploadService_1 = require("../services/uploadService");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
exports.getDonations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, tipo, user_id, start_date, end_date, min_amount, max_amount, sort = 'data_doacao', order = 'desc' } = req.query;
    let query = supabase
        .from('donations')
        .select(`
      *,
      user:users!donations_user_id_fkey(id, nome, email)
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
        throw new errorHandler_1.AppError('Erro ao buscar doações', 500);
    }
    // Map Portuguese database fields to English frontend fields
    const mappedData = (data || []).map(donation => ({
        id: donation.id,
        amount: donation.valor,
        type: donation.tipo,
        paymentMethod: donation.metodo_pagamento,
        date: donation.data_doacao,
        referenceMonth: donation.referencia_mes,
        description: donation.descricao,
        anonymous: donation.anonima,
        receiptIssued: donation.recibo_emitido,
        receiptNumber: donation.numero_recibo,
        notes: donation.observacoes,
        user: donation.user ? {
            id: donation.user.id,
            name: donation.user.nome,
            email: donation.user.email
        } : null,
        created_at: donation.created_at,
        updated_at: donation.updated_at
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
exports.getDonationById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        throw new errorHandler_1.AppError('Doação não encontrada', 404);
    }
    res.json({
        success: true,
        data
    });
});
exports.createDonation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const donationData = req.body;
    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', donationData.user_id)
        .single();
    if (userError || !user) {
        throw new errorHandler_1.AppError('Usuário não encontrado', 404);
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
        throw new errorHandler_1.AppError('Erro ao criar doação', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:donations*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.status(201).json({
        success: true,
        data,
        message: 'Doação registrada com sucesso'
    });
});
exports.updateDonation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        throw new errorHandler_1.AppError('Erro ao atualizar doação', 500);
    }
    if (!data) {
        throw new errorHandler_1.AppError('Doação não encontrada', 404);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:donations*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.json({
        success: true,
        data,
        message: 'Doação atualizada com sucesso'
    });
});
exports.deleteDonation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', id);
    if (error) {
        throw new errorHandler_1.AppError('Erro ao deletar doação', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.invalidate('stats:donations*');
    await cacheService_1.cacheService.invalidate('stats:dashboard');
    res.json({
        success: true,
        message: 'Doação deletada com sucesso'
    });
});
exports.uploadReceipt = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const file = req.file;
    if (!file) {
        throw new errorHandler_1.AppError('Arquivo não fornecido', 400);
    }
    // Verificar se a doação existe
    const { data: donation, error: donationError } = await supabase
        .from('donations')
        .select('id')
        .eq('id', id)
        .single();
    if (donationError || !donation) {
        throw new errorHandler_1.AppError('Doação não encontrada', 404);
    }
    try {
        // Upload do arquivo
        const filePath = await uploadService_1.uploadService.uploadImage(file, 'receipts');
        // Atualizar doação com o caminho do comprovante
        const { data, error } = await supabase
            .from('donations')
            .update({ comprovante: filePath })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new errorHandler_1.AppError('Erro ao salvar comprovante', 500);
        }
        res.json({
            success: true,
            data,
            message: 'Comprovante enviado com sucesso'
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError('Erro no upload do arquivo', 500);
    }
});
exports.getDonationStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cacheKey = 'stats:donations';
    const cached = await cacheService_1.cacheService.get(cacheKey);
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
    const byType = typeStats?.reduce((acc, donation) => {
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
    await cacheService_1.cacheService.set(cacheKey, stats, 1800); // 30 minutos
    res.json({
        success: true,
        data: stats
    });
});
exports.exportDonations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { format = 'csv', start_date, end_date, tipo } = req.query;
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
        throw new errorHandler_1.AppError('Erro ao buscar doações para exportação', 500);
    }
    if (format === 'csv') {
        // Gerar CSV
        const csvHeader = 'Data,Tipo,Valor,Doador,Email,Descrição\n';
        const csvRows = data?.map(donation => `${donation.data_doacao},${donation.tipo},${donation.valor},"${donation.user?.name || ''}","${donation.user?.email || ''}","${donation.descricao || ''}"`).join('\n') || '';
        const csv = csvHeader + csvRows;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=doacoes.csv');
        res.send(csv);
    }
    else {
        // Retornar JSON
        res.json({
            success: true,
            data: data || []
        });
    }
});
exports.getDonationsByUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { data, error, count } = await supabase
        .from('donations')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('data_doacao', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
    if (error) {
        throw new errorHandler_1.AppError('Erro ao buscar doações do usuário', 500);
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
exports.getDonationInfo = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cacheKey = 'donations:info';
    const cached = await cacheService_1.cacheService.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached
        });
    }
    // Buscar informações de doação na tabela organization ou criar dados padrão
    const { data, error } = await supabase
        .from('organization')
        .select('donation_info')
        .single();
    if (error || !data?.donation_info) {
        // Retornar dados padrão se não existir configuração
        const defaultInfo = {
            id: '1',
            iban: 'ES1021001419020200597614',
            bic: 'CAIXESBBXXX',
            titular: 'Centro Cristiano Casa de Provisión',
            bizum: 'Em construção',
            verse: '"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre." — 2 Corintios 9:7',
            additionalMethods: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        await cacheService_1.cacheService.set(cacheKey, defaultInfo, 3600); // 1 hora
        return res.json({
            success: true,
            data: defaultInfo
        });
    }
    await cacheService_1.cacheService.set(cacheKey, data.donation_info, 3600); // 1 hora
    res.json({
        success: true,
        data: data.donation_info
    });
});
exports.updateDonationInfo = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { iban, bic, titular, bizum, verse, additionalMethods } = req.body;
    const donationInfo = {
        id: '1',
        iban,
        bic,
        titular,
        bizum,
        verse,
        additionalMethods,
        updated_at: new Date().toISOString(),
    };
    // Atualizar na tabela organization
    const { error } = await supabase
        .from('organization')
        .upsert({
        id: 1,
        donation_info: donationInfo,
        updated_at: new Date().toISOString()
    });
    if (error) {
        throw new errorHandler_1.AppError('Erro ao atualizar informações de doação', 500);
    }
    // Invalidar cache
    await cacheService_1.cacheService.del('donations:info');
    res.json({
        success: true,
        data: donationInfo
    });
});
//# sourceMappingURL=donationsController.js.map