-- =====================================================
-- CCCP - CASA DE PROVISIÓN
-- ÍNDICES DE PERFORMANCE
-- =====================================================
-- Arquivo: 02_indices_performance.sql
-- Descrição: Criação de índices para otimizar performance das consultas
-- Autor: Sistema CCCP
-- Data: 2025-01-24
-- =====================================================

-- =====================================================
-- EXTENSÕES NECESSÁRIAS (INSTALAR PRIMEIRO!)
-- =====================================================
-- Extensão para busca por similaridade (OBRIGATÓRIA ANTES DOS ÍNDICES)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- ÍNDICES PARA TABELA USERS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON public.users(ativo);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_nome_trgm ON public.users USING gin(nome gin_trgm_ops);

-- =====================================================
-- ÍNDICES PARA TABELA EVENTS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_events_data_inicio ON public.events(data_inicio);
CREATE INDEX IF NOT EXISTS idx_events_data_fim ON public.events(data_fim);
CREATE INDEX IF NOT EXISTS idx_events_tipo ON public.events(tipo);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_publico ON public.events(publico);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_data_status ON public.events(data_inicio, status);
CREATE INDEX IF NOT EXISTS idx_events_titulo_trgm ON public.events USING gin(titulo gin_trgm_ops);

-- =====================================================
-- ÍNDICES PARA TABELA MEMBERS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_tipo_membro ON public.members(tipo_membro);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_data_ingresso ON public.members(data_ingresso);
CREATE INDEX IF NOT EXISTS idx_members_batizado ON public.members(batizado);
CREATE INDEX IF NOT EXISTS idx_members_dizimista ON public.members(dizimista);

-- =====================================================
-- ÍNDICES PARA TABELA MINISTRIES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ministries_lider_id ON public.ministries(lider_id);
CREATE INDEX IF NOT EXISTS idx_ministries_vice_lider_id ON public.ministries(vice_lider_id);
CREATE INDEX IF NOT EXISTS idx_ministries_ativo ON public.ministries(ativo);
CREATE INDEX IF NOT EXISTS idx_ministries_reuniao_dia ON public.ministries(reuniao_dia);
CREATE INDEX IF NOT EXISTS idx_ministries_nome_trgm ON public.ministries USING gin(nome gin_trgm_ops);

-- =====================================================
-- ÍNDICES PARA TABELA MINISTRY_MEMBERS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry_id ON public.ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_user_id ON public.ministry_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_ativo ON public.ministry_members(ativo);
CREATE INDEX IF NOT EXISTS idx_ministry_members_data_ingresso ON public.ministry_members(data_ingresso);
CREATE INDEX IF NOT EXISTS idx_ministry_members_cargo ON public.ministry_members(cargo);

-- =====================================================
-- ÍNDICES PARA TABELA DONATIONS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_data_doacao ON public.donations(data_doacao);
CREATE INDEX IF NOT EXISTS idx_donations_tipo ON public.donations(tipo);
CREATE INDEX IF NOT EXISTS idx_donations_valor ON public.donations(valor);
CREATE INDEX IF NOT EXISTS idx_donations_metodo_pagamento ON public.donations(metodo_pagamento);
CREATE INDEX IF NOT EXISTS idx_donations_referencia_mes ON public.donations(referencia_mes);
CREATE INDEX IF NOT EXISTS idx_donations_anonima ON public.donations(anonima);
CREATE INDEX IF NOT EXISTS idx_donations_data_tipo ON public.donations(data_doacao, tipo);
CREATE INDEX IF NOT EXISTS idx_donations_user_data ON public.donations(user_id, data_doacao);

-- =====================================================
-- ÍNDICES PARA TABELA CONTRIBUTIONS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON public.contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_projeto ON public.contributions(projeto);
CREATE INDEX IF NOT EXISTS idx_contributions_data_contribuicao ON public.contributions(data_contribuicao);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_data_vencimento ON public.contributions(data_vencimento);

-- =====================================================
-- ÍNDICES PARA TABELA LIVE_STREAMS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_live_streams_data_inicio ON public.live_streams(data_inicio);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_evento_id ON public.live_streams(evento_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_publico ON public.live_streams(publico);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_by ON public.live_streams(created_by);

-- =====================================================
-- ÍNDICES PARA TABELA EVENT_REGISTRATIONS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_data_inscricao ON public.event_registrations(data_inscricao);

-- =====================================================
-- ÍNDICES PARA TABELA PASTORAL_VISITS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_visitado_id ON public.pastoral_visits(visitado_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_pastor_id ON public.pastoral_visits(pastor_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_data_visita ON public.pastoral_visits(data_visita);
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_status ON public.pastoral_visits(status);
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_tipo_visita ON public.pastoral_visits(tipo_visita);
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_proxima_visita ON public.pastoral_visits(proxima_visita);

-- =====================================================
-- ÍNDICES PARA TABELA NOTIFICATIONS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lida ON public.notifications(lida);
CREATE INDEX IF NOT EXISTS idx_notifications_tipo ON public.notifications(tipo);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_data_expiracao ON public.notifications(data_expiracao);
CREATE INDEX IF NOT EXISTS idx_notifications_user_lida ON public.notifications(user_id, lida);

-- =====================================================
-- ÍNDICES COMPOSTOS PARA CONSULTAS COMPLEXAS
-- =====================================================

-- Para relatórios de doações por período e tipo
CREATE INDEX IF NOT EXISTS idx_donations_periodo_tipo ON public.donations(data_doacao DESC, tipo, valor);

-- Para busca de eventos futuros públicos
CREATE INDEX IF NOT EXISTS idx_events_futuro_publico ON public.events(data_inicio) WHERE publico = true AND status = 'agendado';

-- Para membros ativos por tipo
CREATE INDEX IF NOT EXISTS idx_members_ativo_tipo ON public.members(status, tipo_membro) WHERE status = 'ativo';

-- Para ministérios ativos com líder
CREATE INDEX IF NOT EXISTS idx_ministries_ativo_lider ON public.ministries(ativo, lider_id) WHERE ativo = true;

-- =====================================================
-- ÍNDICES DE TEXTO COMPLETO (Full Text Search)
-- =====================================================

-- Para busca em eventos por título e descrição
CREATE INDEX IF NOT EXISTS idx_events_search ON public.events 
USING gin(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '')));

-- Para busca em usuários por nome
CREATE INDEX IF NOT EXISTS idx_users_search ON public.users 
USING gin(to_tsvector('portuguese', coalesce(nome, '') || ' ' || coalesce(email, '')));

-- Para busca em ministérios
CREATE INDEX IF NOT EXISTS idx_ministries_search ON public.ministries 
USING gin(to_tsvector('portuguese', coalesce(nome, '') || ' ' || coalesce(descricao, '')));

-- =====================================================
-- ANÁLISE E ESTATÍSTICAS
-- =====================================================

-- Atualizar estatísticas das tabelas para o planejador de consultas
ANALYZE public.users;
ANALYZE public.events;
ANALYZE public.members;
ANALYZE public.ministries;
ANALYZE public.ministry_members;
ANALYZE public.donations;
ANALYZE public.contributions;
ANALYZE public.live_streams;
ANALYZE public.event_registrations;
ANALYZE public.pastoral_visits;
ANALYZE public.notifications;
ANALYZE public.organization;

-- =====================================================
-- SUCESSO
-- =====================================================
SELECT 'Índices de performance criados com sucesso!' as resultado;