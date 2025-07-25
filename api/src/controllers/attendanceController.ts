import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '@shared/types';
import { cacheService } from '../services/cacheService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Listar todas as presenças
export const getAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, event_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('event_registrations')
      .select(`
        id,
        user_id,
        event_id,
        status,
        data_inscricao,
        valor_pago,
        metodo_pagamento,
        observacoes,
        users!inner(nome, email),
        events!inner(titulo, data_inicio)
      `)
      .order('data_inscricao', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar presenças'
      });
      return;
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });

  } catch (error: any) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Buscar presenças por evento
export const getAttendanceByEventId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        id,
        user_id,
        status,
        data_inscricao,
        valor_pago,
        metodo_pagamento,
        observacoes,
        users!inner(nome, email, telefone)
      `)
      .eq('event_id', eventId)
      .order('users(nome)', { ascending: true });

    if (error) {
      console.error('Error fetching event attendance:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar presenças do evento'
      });
      return;
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    console.error('Event attendance fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Marcar presença
export const markAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { event_id, user_id, status = 'confirmado' } = req.body;
    const currentUserId = req.user?.id;

    // Verificar se o evento existe
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, titulo')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      res.status(404).json({
        success: false,
        error: 'Evento não encontrado'
      });
      return;
    }

    // Verificar se já existe registro
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', user_id || currentUserId)
      .single();

    if (existingRegistration) {
      // Atualizar presença existente
      const { data, error } = await supabase
        .from('event_registrations')
        .update({ 
          status
        })
        .eq('id', existingRegistration.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({
          success: false,
          error: 'Erro ao atualizar presença'
        });
        return;
      }

      res.json({
        success: true,
        data,
        message: 'Presença atualizada com sucesso'
      });
    } else {
      // Criar nova inscrição/presença
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id,
          user_id: user_id || currentUserId,
          status,
          data_inscricao: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating attendance:', error);
        res.status(500).json({
          success: false,
          error: 'Erro ao marcar presença'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data,
        message: 'Presença marcada com sucesso'
      });
    }

  } catch (error: any) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Atualizar presença
export const updateAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, attended_at } = req.body;

    const { data, error } = await supabase
      .from('event_registrations')
      .update({
        status
      })
      .eq('id', id)
      .select(`
        *,
        users!inner(nome, email),
        events!inner(titulo)
      `)
      .single();

    if (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar presença'
      });
      return;
    }

    res.json({
      success: true,
      data,
      message: 'Presença atualizada com sucesso'
    });

  } catch (error: any) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Estatísticas de presença
export const getAttendanceStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'attendance_stats';
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      res.json({
        success: true,
        data: cached,
        cached: true
      });
      return;
    }

    // Total de inscrições
    const { count: totalRegistrations } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true });

    // Total de presenças confirmadas
    const { count: totalAttended } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'presente');

    // Taxa de presença
    const attendanceRate = totalRegistrations > 0 
      ? ((totalAttended || 0) / totalRegistrations * 100).toFixed(1)
      : '0.0';

    // Presenças por evento (top 5)
    const { data: eventStats } = await supabase
      .from('event_registrations')
      .select(`
        event_id,
        events!inner(titulo),
        status
      `)
      .eq('status', 'presente');

    const eventAttendance = eventStats?.reduce((acc: any, curr: any) => {
      const eventId = curr.event_id;
      const eventTitle = curr.events.titulo;
      
      if (!acc[eventId]) {
        acc[eventId] = {
          event_id: eventId,
          titulo: eventTitle,
          total_presente: 0
        };
      }
      acc[eventId].total_presente++;
      return acc;
    }, {});

    const topEvents = Object.values(eventAttendance || {})
      .sort((a: any, b: any) => b.total_presente - a.total_presente)
      .slice(0, 5);

    const stats = {
      total_registrations: totalRegistrations || 0,
      total_attended: totalAttended || 0,
      attendance_rate: attendanceRate,
      top_events: topEvents
    };

    await cacheService.set(cacheKey, stats, 300); // Cache por 5 minutos

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Attendance stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};