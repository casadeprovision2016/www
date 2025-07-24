-- =====================================================
-- CCCP - CASA DE PROVISIÓN
-- FUNÇÕES E GATILHOS
-- =====================================================
-- Arquivo: 03_funcoes_gatilhos.sql
-- Descrição: Funções utilitárias e gatilhos automáticos
-- Autor: Sistema CCCP
-- Data: 2025-01-24
-- =====================================================

-- =====================================================
-- FUNÇÃO: Atualizar campo updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente o campo updated_at';

-- =====================================================
-- FUNÇÃO: Criar usuário no public.users após registro no auth.users
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nome, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), 
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Cria registro na tabela users quando novo usuário se registra';

-- =====================================================
-- FUNÇÃO: Validar conflitos de horário em eventos
-- =====================================================
CREATE OR REPLACE FUNCTION validate_event_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se há conflito de horário no mesmo local
    IF EXISTS (
        SELECT 1 FROM public.events 
        WHERE local = NEW.local 
        AND status = 'agendado'
        AND id != COALESCE(NEW.id, gen_random_uuid())
        AND (
            (NEW.data_inicio BETWEEN data_inicio AND COALESCE(data_fim, data_inicio + INTERVAL '2 hours'))
            OR
            (COALESCE(NEW.data_fim, NEW.data_inicio + INTERVAL '2 hours') BETWEEN data_inicio AND COALESCE(data_fim, data_inicio + INTERVAL '2 hours'))
            OR
            (data_inicio BETWEEN NEW.data_inicio AND COALESCE(NEW.data_fim, NEW.data_inicio + INTERVAL '2 hours'))
        )
    ) THEN
        RAISE EXCEPTION 'Conflito de horário: já existe um evento agendado no mesmo local e horário';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_event_schedule() IS 'Valida conflitos de horário entre eventos no mesmo local';

-- =====================================================
-- FUNÇÃO: Calcular estatísticas de doações
-- =====================================================
CREATE OR REPLACE FUNCTION get_donation_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_geral DECIMAL(10,2),
    total_dizimos DECIMAL(10,2),
    total_ofertas DECIMAL(10,2),
    total_missoes DECIMAL(10,2),
    quantidade_doacoes BIGINT,
    media_doacao DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(valor), 0) as total_geral,
        COALESCE(SUM(CASE WHEN tipo = 'dizimo' THEN valor ELSE 0 END), 0) as total_dizimos,
        COALESCE(SUM(CASE WHEN tipo = 'oferta' THEN valor ELSE 0 END), 0) as total_ofertas,
        COALESCE(SUM(CASE WHEN tipo = 'missoes' THEN valor ELSE 0 END), 0) as total_missoes,
        COUNT(*) as quantidade_doacoes,
        COALESCE(AVG(valor), 0) as media_doacao
    FROM public.donations 
    WHERE data_doacao BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_donation_stats(DATE, DATE) IS 'Calcula estatísticas de doações em um período';

-- =====================================================
-- FUNÇÃO: Buscar eventos próximos
-- =====================================================
CREATE OR REPLACE FUNCTION get_upcoming_events(
    days_ahead INTEGER DEFAULT 30,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    titulo VARCHAR(200),
    descricao TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE,
    local VARCHAR(200),
    tipo VARCHAR(50),
    max_participantes INTEGER,
    inscricoes_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.titulo,
        e.descricao,
        e.data_inicio,
        e.local,
        e.tipo,
        e.max_participantes,
        COUNT(er.id) as inscricoes_count
    FROM public.events e
    LEFT JOIN public.event_registrations er ON e.id = er.event_id AND er.status = 'inscrito'
    WHERE e.data_inicio >= NOW()
    AND e.data_inicio <= NOW() + (days_ahead || ' days')::INTERVAL
    AND e.status = 'agendado'
    AND e.publico = true
    GROUP BY e.id, e.titulo, e.descricao, e.data_inicio, e.local, e.tipo, e.max_participantes
    ORDER BY e.data_inicio ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_upcoming_events(INTEGER, INTEGER) IS 'Retorna eventos próximos com contagem de inscrições';

-- =====================================================
-- FUNÇÃO: Validar capacidade de eventos
-- =====================================================
CREATE OR REPLACE FUNCTION validate_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_registrations INTEGER;
    event_capacity INTEGER;
BEGIN
    -- Buscar capacidade do evento
    SELECT max_participantes INTO event_capacity
    FROM public.events 
    WHERE id = NEW.event_id;
    
    -- Se não há limite de capacidade, permitir inscrição
    IF event_capacity IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Contar inscrições atuais
    SELECT COUNT(*)
    INTO current_registrations
    FROM public.event_registrations 
    WHERE event_id = NEW.event_id 
    AND status IN ('inscrito', 'confirmado');
    
    -- Verificar se há vagas
    IF current_registrations >= event_capacity THEN
        RAISE EXCEPTION 'Evento lotado: capacidade máxima de % participantes atingida', event_capacity;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_event_capacity() IS 'Valida se há vagas disponíveis para inscrição em eventos';

-- =====================================================
-- FUNÇÃO: Gerar relatório de membros por ministério
-- =====================================================
CREATE OR REPLACE FUNCTION get_ministry_members_report()
RETURNS TABLE (
    ministry_name VARCHAR(100),
    leader_name VARCHAR(200),
    total_members BIGINT,
    active_members BIGINT,
    inactive_members BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.nome as ministry_name,
        ul.nome as leader_name,
        COUNT(mm.id) as total_members,
        COUNT(CASE WHEN mm.ativo = true THEN 1 END) as active_members,
        COUNT(CASE WHEN mm.ativo = false THEN 1 END) as inactive_members
    FROM public.ministries m
    LEFT JOIN public.users ul ON m.lider_id = ul.id
    LEFT JOIN public.ministry_members mm ON m.id = mm.ministry_id
    WHERE m.ativo = true
    GROUP BY m.id, m.nome, ul.nome
    ORDER BY m.nome;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_ministry_members_report() IS 'Gera relatório de membros por ministério';

-- =====================================================
-- FUNÇÃO: Criar notificação automática
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_title VARCHAR(200),
    notification_message TEXT,
    notification_type VARCHAR(30) DEFAULT 'info',
    action_url TEXT DEFAULT NULL,
    created_by_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, 
        titulo, 
        mensagem, 
        tipo, 
        url_acao, 
        created_by
    )
    VALUES (
        target_user_id,
        notification_title,
        notification_message,
        notification_type,
        action_url,
        created_by_id
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notification(UUID, VARCHAR, TEXT, VARCHAR, TEXT, UUID) IS 'Cria uma nova notificação para um usuário';

-- =====================================================
-- FUNÇÃO: Limpar notificações expiradas
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE data_expiracao IS NOT NULL 
    AND data_expiracao < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_notifications() IS 'Remove notificações expiradas do sistema';

-- =====================================================
-- GATILHOS: updated_at automático (com verificação de existência)
-- =====================================================

-- Remover gatilhos existentes se houver conflito
DO $$
BEGIN
    -- Remover gatilhos de updated_at se existirem
    DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
    DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
    DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
    DROP TRIGGER IF EXISTS update_ministries_updated_at ON public.ministries;
    DROP TRIGGER IF EXISTS update_ministry_members_updated_at ON public.ministry_members;
    DROP TRIGGER IF EXISTS update_donations_updated_at ON public.donations;
    DROP TRIGGER IF EXISTS update_contributions_updated_at ON public.contributions;
    DROP TRIGGER IF EXISTS update_live_streams_updated_at ON public.live_streams;
    DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON public.event_registrations;
    DROP TRIGGER IF EXISTS update_pastoral_visits_updated_at ON public.pastoral_visits;
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
    DROP TRIGGER IF EXISTS update_organization_updated_at ON public.organization;
    
    -- Remover outros gatilhos se existirem
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS validate_event_schedule_trigger ON public.events;
    DROP TRIGGER IF EXISTS validate_event_capacity_trigger ON public.event_registrations;
    
    RAISE NOTICE 'Gatilhos existentes removidos com sucesso';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: Alguns gatilhos podem não ter sido removidos';
END $$;

-- Criar gatilhos updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON public.members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ministries_updated_at 
    BEFORE UPDATE ON public.ministries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ministry_members_updated_at 
    BEFORE UPDATE ON public.ministry_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at 
    BEFORE UPDATE ON public.donations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at 
    BEFORE UPDATE ON public.contributions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_streams_updated_at 
    BEFORE UPDATE ON public.live_streams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at 
    BEFORE UPDATE ON public.event_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pastoral_visits_updated_at 
    BEFORE UPDATE ON public.pastoral_visits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_updated_at 
    BEFORE UPDATE ON public.organization 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GATILHO: Criar usuário após registro no auth
-- =====================================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- GATILHO: Validar horários de eventos
-- =====================================================
CREATE TRIGGER validate_event_schedule_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION validate_event_schedule();

-- =====================================================
-- GATILHO: Validar capacidade de eventos
-- =====================================================
CREATE TRIGGER validate_event_capacity_trigger
    BEFORE INSERT ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION validate_event_capacity();

-- =====================================================
-- SUCESSO
-- =====================================================
SELECT 'Funções e gatilhos criados com sucesso!' as resultado;