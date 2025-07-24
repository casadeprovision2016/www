-- =====================================================
-- CCCP - CASA DE PROVISIÓN
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Arquivo: 04_row_level_security.sql
-- Descrição: Configurações de segurança a nível de linha
-- Autor: Sistema CCCP
-- Data: 2025-01-24
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastoral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA USERS
-- =====================================================

-- Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios dados (campos específicos)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Admins e pastores podem ver todos os usuários
CREATE POLICY "Admins and pastors can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- Admins podem fazer qualquer operação em usuários
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Líderes podem ver membros de seus ministérios
CREATE POLICY "Leaders can view ministry members" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ministries m
            JOIN public.ministry_members mm ON m.id = mm.ministry_id
            WHERE m.lider_id = auth.uid()
            AND mm.user_id = public.users.id
            AND mm.ativo = true
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA EVENTS
-- =====================================================

-- Todos os usuários autenticados podem ver eventos públicos
CREATE POLICY "Authenticated users can view public events" ON public.events
    FOR SELECT USING (
        auth.role() = 'authenticated' AND publico = true
    );

-- Membros podem ver todos os eventos
CREATE POLICY "Members can view all events" ON public.events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader', 'member')
        )
    );

-- Líderes e superiores podem criar eventos
CREATE POLICY "Leaders can create events" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader')
        )
    );

-- Criadores podem editar seus eventos
CREATE POLICY "Event creators can edit their events" ON public.events
    FOR UPDATE USING (created_by = auth.uid());

-- Admins e pastores podem editar qualquer evento
CREATE POLICY "Admins and pastors can edit all events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA MEMBERS
-- =====================================================

-- Usuários podem ver seus próprios dados de membro
CREATE POLICY "Users can view own membership" ON public.members
    FOR SELECT USING (user_id = auth.uid());

-- Admins, pastores e líderes podem ver todos os membros
CREATE POLICY "Leaders can view all members" ON public.members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader')
        )
    );

-- Apenas admins e pastores podem gerenciar membros
CREATE POLICY "Admins and pastors can manage members" ON public.members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA MINISTRIES
-- =====================================================

-- Todos os usuários autenticados podem ver ministérios ativos
CREATE POLICY "Authenticated users can view active ministries" ON public.ministries
    FOR SELECT USING (
        auth.role() = 'authenticated' AND ativo = true
    );

-- Líderes podem editar seus ministérios
CREATE POLICY "Leaders can edit their ministries" ON public.ministries
    FOR UPDATE USING (
        lider_id = auth.uid() OR vice_lider_id = auth.uid()
    );

-- Admins e pastores podem gerenciar todos os ministérios
CREATE POLICY "Admins and pastors can manage all ministries" ON public.ministries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA MINISTRY_MEMBERS
-- =====================================================

-- Usuários podem ver suas participações em ministérios
CREATE POLICY "Users can view own ministry memberships" ON public.ministry_members
    FOR SELECT USING (user_id = auth.uid());

-- Líderes podem ver membros de seus ministérios
CREATE POLICY "Leaders can view their ministry members" ON public.ministry_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ministries m
            WHERE m.id = ministry_id
            AND (m.lider_id = auth.uid() OR m.vice_lider_id = auth.uid())
        )
    );

-- Líderes podem gerenciar membros de seus ministérios
CREATE POLICY "Leaders can manage their ministry members" ON public.ministry_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ministries m
            WHERE m.id = ministry_id
            AND (m.lider_id = auth.uid() OR m.vice_lider_id = auth.uid())
        )
    );

-- Admins e pastores podem gerenciar todos os membros de ministérios
CREATE POLICY "Admins can manage all ministry members" ON public.ministry_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA DONATIONS
-- =====================================================

-- Usuários podem ver suas próprias doações
CREATE POLICY "Users can view own donations" ON public.donations
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem criar suas próprias doações
CREATE POLICY "Users can create own donations" ON public.donations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins e pastores podem ver todas as doações
CREATE POLICY "Admins and pastors can view all donations" ON public.donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- Apenas admins podem editar/deletar doações
CREATE POLICY "Admins can manage all donations" ON public.donations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA EVENT_REGISTRATIONS
-- =====================================================

-- Usuários podem ver suas próprias inscrições
CREATE POLICY "Users can view own registrations" ON public.event_registrations
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem se inscrever em eventos
CREATE POLICY "Users can register for events" ON public.event_registrations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem cancelar suas próprias inscrições
CREATE POLICY "Users can cancel own registrations" ON public.event_registrations
    FOR UPDATE USING (user_id = auth.uid());

-- Criadores de eventos podem ver todas as inscrições dos seus eventos
CREATE POLICY "Event creators can view their event registrations" ON public.event_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id
            AND e.created_by = auth.uid()
        )
    );

-- Admins e pastores podem ver todas as inscrições
CREATE POLICY "Admins can view all registrations" ON public.event_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA NOTIFICATIONS
-- =====================================================

-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Admins e pastores podem criar notificações para qualquer usuário
CREATE POLICY "Admins can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA PASTORAL_VISITS
-- =====================================================

-- Usuários podem ver visitas onde são o visitado
CREATE POLICY "Users can view visits to them" ON public.pastoral_visits
    FOR SELECT USING (visitado_id = auth.uid());

-- Pastores podem ver suas visitas
CREATE POLICY "Pastors can view their visits" ON public.pastoral_visits
    FOR SELECT USING (pastor_id = auth.uid());

-- Pastores podem criar visitas
CREATE POLICY "Pastors can create visits" ON public.pastoral_visits
    FOR INSERT WITH CHECK (
        pastor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- Pastores podem editar suas visitas
CREATE POLICY "Pastors can edit their visits" ON public.pastoral_visits
    FOR UPDATE USING (pastor_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA TABELA LIVE_STREAMS
-- =====================================================

-- Usuários autenticados podem ver streams públicas
CREATE POLICY "Authenticated users can view public streams" ON public.live_streams
    FOR SELECT USING (
        auth.role() = 'authenticated' AND publico = true
    );

-- Membros podem ver todas as streams
CREATE POLICY "Members can view all streams" ON public.live_streams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader', 'member')
        )
    );

-- Líderes podem criar streams
CREATE POLICY "Leaders can create streams" ON public.live_streams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA CONTRIBUTIONS
-- =====================================================

-- Usuários podem ver suas próprias contribuições
CREATE POLICY "Users can view own contributions" ON public.contributions
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem criar suas próprias contribuições
CREATE POLICY "Users can create own contributions" ON public.contributions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins podem ver todas as contribuições
CREATE POLICY "Admins can view all contributions" ON public.contributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA ORGANIZATION
-- =====================================================

-- Todos os usuários autenticados podem ver dados da organização
CREATE POLICY "Authenticated users can view organization" ON public.organization
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins podem editar dados da organização
CREATE POLICY "Admins can manage organization" ON public.organization
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =====================================================
-- FUNÇÕES HELPER: Verificação de Roles (Schema Public)
-- =====================================================
-- Nota: Movidas para public devido a restrições de permissão no schema auth

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_pastor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'pastor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_leader_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'pastor', 'leader')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCESSO
-- =====================================================
SELECT 'Row Level Security configurado com sucesso!' as resultado;