import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest, DashboardStats } from '@shared/types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cacheService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cacheKey = 'stats:dashboard';
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return res.json({
      success: true,
      data: cached
    });
  }

  try {
    // Executar todas as consultas em paralelo para melhor performance
    const [
      eventsResult,
      membersResult,
      donationsResult,
      visitorsResult,
      streamsResult,
      donationAmountResult
    ] = await Promise.all([
      // Estatísticas de eventos
      supabase.from('events').select('*', { count: 'exact', head: true }),
      
      // Estatísticas de membros
      supabase.from('members').select('status', { count: 'exact' }),
      
      // Estatísticas de doações
      supabase.from('donations').select('*', { count: 'exact', head: true }),
      
      // Estatísticas de visitantes (assumindo que existe uma tabela visitors)
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'visitor'),
      
      // Estatísticas de streams
      supabase.from('live_streams').select('*', { count: 'exact', head: true }),
      
      // Valor total de doações
      supabase.from('donations').select('valor')
    ]);

    // Processar resultados de membros por status
    const activeMembers = membersResult.data?.filter(m => m.status === 'ativo').length || 0;
    const inactiveMembers = membersResult.data?.filter(m => m.status === 'inativo').length || 0;

    // Calcular valor total de doações
    const totalDonationAmount = donationAmountResult.data?.reduce((sum, d) => sum + d.valor, 0) || 0;

    // Eventos próximos (próximos 30 dias)
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    
    const { count: upcomingEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('data_inicio', new Date().toISOString())
      .lte('data_inicio', next30Days.toISOString());

    // Streams ativas
    const { count: activeStreams } = await supabase
      .from('live_streams')
      .select('*', { count: 'exact', head: true })
      .eq('ativa', true);

    const stats: DashboardStats = {
      events: {
        total: eventsResult.count || 0,
        active: upcomingEvents || 0,
        monthly: {}
      },
      members: {
        total: (membersResult.count || 0),
        active: activeMembers,
        inactive: inactiveMembers,
        monthly: {}
      },
      donations: {
        total: donationsResult.count || 0,
        total_amount: totalDonationAmount,
        monthly: {}
      },
      visitors: {
        total: visitorsResult.count || 0,
        monthly: {}
      },
      streams: {
        total: streamsResult.count || 0,
        active: activeStreams || 0,
        monthly: {}
      }
    };

    await cacheService.set(cacheKey, stats, 1800); // 30 minutos

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    throw new AppError('Erro ao gerar estatísticas do dashboard', 500);
  }
});

export const getMonthlyReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { year, month } = req.query as any;
  
  if (!year || !month) {
    throw new AppError('Ano e mês são obrigatórios', 400);
  }

  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  try {
    const [
      eventsResult,
      donationsResult,
      newMembersResult,
      pastoralVisitsResult
    ] = await Promise.all([
      // Eventos do mês
      supabase
        .from('events')
        .select('*')
        .gte('data_inicio', startDate.toISOString())
        .lte('data_inicio', endDate.toISOString()),

      // Doações do mês
      supabase
        .from('donations')
        .select('*')
        .gte('data_doacao', startDate.toISOString())
        .lte('data_doacao', endDate.toISOString()),

      // Novos membros do mês
      supabase
        .from('members')
        .select('*')
        .gte('join_date', startDate.toISOString())
        .lte('join_date', endDate.toISOString()),

      // Visitas pastorais do mês
      supabase
        .from('pastoral_visits')
        .select('*')
        .gte('data_visita', startDate.toISOString())
        .lte('data_visita', endDate.toISOString())
    ]);

    const report = {
      period: {
        year: parseInt(year),
        month: parseInt(month),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      events: {
        total: eventsResult.data?.length || 0,
        list: eventsResult.data || []
      },
      donations: {
        total: donationsResult.data?.length || 0,
        total_amount: donationsResult.data?.reduce((sum, d) => sum + d.valor, 0) || 0,
        by_type: donationsResult.data?.reduce((acc: any, d) => {
          acc[d.tipo] = (acc[d.tipo] || 0) + d.valor;
          return acc;
        }, {}) || {}
      },
      new_members: {
        total: newMembersResult.data?.length || 0,
        list: newMembersResult.data || []
      },
      pastoral_visits: {
        total: pastoralVisitsResult.data?.length || 0,
        completed: pastoralVisitsResult.data?.filter(v => v.status === 'concluida').length || 0,
        scheduled: pastoralVisitsResult.data?.filter(v => v.status === 'agendada').length || 0,
        cancelled: pastoralVisitsResult.data?.filter(v => v.status === 'cancelada').length || 0
      }
    };

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    throw new AppError('Erro ao gerar relatório mensal', 500);
  }
});

export const getYearlyReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { year } = req.query as any;
  
  if (!year) {
    throw new AppError('Ano é obrigatório', 400);
  }

  const startDate = new Date(parseInt(year), 0, 1);
  const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);

  try {
    const [
      eventsResult,
      donationsResult,
      membersResult,
      pastoralVisitsResult
    ] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .gte('data_inicio', startDate.toISOString())
        .lte('data_inicio', endDate.toISOString()),

      supabase
        .from('donations')
        .select('*')
        .gte('data_doacao', startDate.toISOString())
        .lte('data_doacao', endDate.toISOString()),

      supabase
        .from('members')
        .select('*')
        .gte('join_date', startDate.toISOString())
        .lte('join_date', endDate.toISOString()),

      supabase
        .from('pastoral_visits')
        .select('*')
        .gte('data_visita', startDate.toISOString())
        .lte('data_visita', endDate.toISOString())
    ]);

    // Agrupar dados por mês
    const monthlyData: any = {};
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(parseInt(year), month, 1);
      const monthEnd = new Date(parseInt(year), month + 1, 0, 23, 59, 59);
      
      monthlyData[month + 1] = {
        events: eventsResult.data?.filter(e => {
          const eventDate = new Date(e.data_inicio);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }).length || 0,
        
        donations: {
          count: donationsResult.data?.filter(d => {
            const donationDate = new Date(d.data_doacao);
            return donationDate >= monthStart && donationDate <= monthEnd;
          }).length || 0,
          
          amount: donationsResult.data?.filter(d => {
            const donationDate = new Date(d.data_doacao);
            return donationDate >= monthStart && donationDate <= monthEnd;
          }).reduce((sum, d) => sum + d.valor, 0) || 0
        },
        
        new_members: membersResult.data?.filter(m => {
          const joinDate = new Date(m.join_date);
          return joinDate >= monthStart && joinDate <= monthEnd;
        }).length || 0,
        
        pastoral_visits: pastoralVisitsResult.data?.filter(v => {
          const visitDate = new Date(v.data_visita);
          return visitDate >= monthStart && visitDate <= monthEnd;
        }).length || 0
      };
    }

    const report = {
      year: parseInt(year),
      summary: {
        total_events: eventsResult.data?.length || 0,
        total_donations: donationsResult.data?.length || 0,
        total_donation_amount: donationsResult.data?.reduce((sum, d) => sum + d.valor, 0) || 0,
        new_members: membersResult.data?.length || 0,
        pastoral_visits: pastoralVisitsResult.data?.length || 0
      },
      monthly: monthlyData
    };

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    throw new AppError('Erro ao gerar relatório anual', 500);
  }
});

export const getCustomReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { start_date, end_date, include_events, include_donations, include_members, include_visits } = req.query as any;

  if (!start_date || !end_date) {
    throw new AppError('Datas de início e fim são obrigatórias', 400);
  }

  const report: any = {
    period: {
      start_date,
      end_date
    }
  };

  try {
    const promises: Promise<any>[] = [];

    if (include_events === 'true') {
      promises.push(
        Promise.resolve(supabase
          .from('events')
          .select('*')
          .gte('data_inicio', start_date)
          .lte('data_inicio', end_date))
          .then(result => ({ type: 'events', data: result.data }))
      );
    }

    if (include_donations === 'true') {
      promises.push(
        Promise.resolve(supabase
          .from('donations')
          .select('*, user:users(name, email)')
          .gte('data_doacao', start_date)
          .lte('data_doacao', end_date))
          .then(result => ({ type: 'donations', data: result.data }))
      );
    }

    if (include_members === 'true') {
      promises.push(
        Promise.resolve(supabase
          .from('members')
          .select('*, user:users(name, email)')
          .gte('join_date', start_date)
          .lte('join_date', end_date))
          .then(result => ({ type: 'members', data: result.data }))
      );
    }

    if (include_visits === 'true') {
      promises.push(
        Promise.resolve(supabase
          .from('pastoral_visits')
          .select('*, pastor:users!pastoral_visits_pastor_id_fkey(name), visitado:users!pastoral_visits_visitado_id_fkey(name)')
          .gte('data_visita', start_date)
          .lte('data_visita', end_date))
          .then(result => ({ type: 'visits', data: result.data }))
      );
    }

    const results = await Promise.all(promises);

    results.forEach(result => {
      report[result.type] = result.data || [];
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    throw new AppError('Erro ao gerar relatório customizado', 500);
  }
});