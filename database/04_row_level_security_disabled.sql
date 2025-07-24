-- =====================================================
-- CCCP - CASA DE PROVISIÓN
-- ROW LEVEL SECURITY (DESABILITADO PARA DESENVOLVIMENTO)
-- =====================================================
-- Arquivo: 04_row_level_security_disabled.sql
-- Descrição: Versão simplificada SEM RLS para desenvolvimento
-- Autor: Sistema CCCP
-- Data: 2025-01-24
-- =====================================================

-- =====================================================
-- DESABILITAR RLS EM TODAS AS TABELAS (DESENVOLVIMENTO)
-- =====================================================
-- AVISO: Esta configuração é apenas para desenvolvimento!
-- Em produção, use o arquivo 04_row_level_security.sql

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastoral_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVER POLÍTICAS EXISTENTES (se houver)
-- =====================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Buscar e remover todas as políticas das tabelas do sistema
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN (
            'users', 'events', 'members', 'ministries', 'ministry_members',
            'donations', 'contributions', 'live_streams', 'event_registrations',
            'pastoral_visits', 'notifications', 'organization'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
    
    RAISE NOTICE 'Políticas RLS removidas com sucesso para desenvolvimento';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: Algumas políticas podem não ter sido removidas';
END $$;

-- =====================================================
-- FUNÇÕES HELPER: Verificação de Roles (Para uso futuro)
-- =====================================================
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
-- CONFIGURAÇÃO DE ACESSO PARA API
-- =====================================================
-- Garantir que a role anon e authenticated tenham acesso

-- Permitir SELECT para usuário anônimo em tabelas públicas
GRANT SELECT ON public.organization TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.ministries TO anon;

-- Permitir acesso completo para usuários autenticados
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Permitir execução das funções helper
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pastor_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_leader_or_above() TO authenticated;

-- =====================================================
-- MENSAGEM DE AVISO IMPORTANTE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ATENÇÃO: RLS DESABILITADO PARA DESENVOLVIMENTO';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Esta configuração remove toda a segurança a nível de linha!';
    RAISE NOTICE 'Use apenas para desenvolvimento e testes.';
    RAISE NOTICE 'Para produção, execute 04_row_level_security.sql';
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- VERIFICAÇÃO DE ACESSO
-- =====================================================
-- Testar se as permissões estão corretas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Contar tabelas acessíveis
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Total de tabelas públicas: %', table_count;
    RAISE NOTICE 'RLS Status: DESABILITADO (modo desenvolvimento)';
    RAISE NOTICE 'Acesso: IRRESTRITO para usuários autenticados';
END $$;

-- =====================================================
-- SUCESSO
-- =====================================================
SELECT 'RLS desabilitado para desenvolvimento - ATENÇÃO: Use apenas para dev/test!' as resultado;