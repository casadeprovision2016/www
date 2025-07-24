-- =====================================================
-- CCCP - CASA DE PROVISIÓN
-- SCHEMA PRINCIPAL E TABELAS
-- =====================================================
-- Arquivo: 01_schema_tabelas.sql
-- Descrição: Criação de todas as tabelas principais do sistema
-- Autor: Sistema CCCP
-- Data: 2025-01-24
-- =====================================================

-- Remover tabelas existentes (cuidado em produção!)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.pastoral_visits CASCADE;
DROP TABLE IF EXISTS public.ministry_members CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.contributions CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.live_streams CASCADE;
DROP TABLE IF EXISTS public.ministries CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.organization CASCADE;

-- =====================================================
-- 1. TABELA DE ORGANIZAÇÃO (Configurações gerais)
-- =====================================================
CREATE TABLE public.organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    logo_url TEXT,
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.organization IS 'Configurações gerais da organização/igreja';
COMMENT ON COLUMN public.organization.configuracoes IS 'Configurações em JSON (horários, preferências, etc.)';

-- =====================================================
-- 2. TABELA DE USUÁRIOS (Extensão do auth.users)
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255), -- Para compatibilidade, mas usaremos auth.users
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    data_nascimento DATE,
    profissao VARCHAR(100),
    estado_civil VARCHAR(20) CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo')),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'pastor', 'leader', 'member')),
    ativo BOOLEAN DEFAULT true,
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Dados estendidos dos usuários do sistema';
COMMENT ON COLUMN public.users.role IS 'Papel do usuário: admin, pastor, leader, member';
COMMENT ON COLUMN public.users.senha IS 'DEPRECATED: Use auth.users para autenticação';

-- =====================================================
-- 3. TABELA DE EVENTOS
-- =====================================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    local VARCHAR(200),
    endereco_completo TEXT,
    tipo VARCHAR(50) DEFAULT 'culto' CHECK (tipo IN ('culto', 'estudo', 'evento', 'reuniao', 'conferencia', 'outro')),
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado')),
    max_participantes INTEGER,
    valor_inscricao DECIMAL(10,2) DEFAULT 0,
    requer_inscricao BOOLEAN DEFAULT false,
    publico BOOLEAN DEFAULT true,
    imagem_url TEXT,
    observacoes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.events IS 'Eventos da igreja (cultos, estudos, conferências, etc.)';
COMMENT ON COLUMN public.events.tipo IS 'Tipo de evento para categorização';
COMMENT ON COLUMN public.events.publico IS 'Se o evento é público ou apenas para membros';

-- =====================================================
-- 4. TABELA DE MEMBROS (Status de membership)
-- =====================================================
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo_membro VARCHAR(30) DEFAULT 'congregado' CHECK (tipo_membro IN ('efetivo', 'em_experiencia', 'congregado', 'visitante')),
    data_ingresso DATE NOT NULL,
    data_saida DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'transferido', 'disciplinado')),
    igreja_origem VARCHAR(200),
    batizado BOOLEAN DEFAULT false,
    data_batismo DATE,
    dizimista BOOLEAN DEFAULT false,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Um usuário só pode ter um registro de membro
);

COMMENT ON TABLE public.members IS 'Status de membership dos usuários na igreja';
COMMENT ON COLUMN public.members.tipo_membro IS 'Tipo de membro conforme estatuto da igreja';

-- =====================================================
-- 5. TABELA DE MINISTÉRIOS
-- =====================================================
CREATE TABLE public.ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    lider_id UUID REFERENCES public.users(id),
    vice_lider_id UUID REFERENCES public.users(id),
    reuniao_dia VARCHAR(20), -- 'segunda', 'terca', etc.
    reuniao_horario TIME,
    local_reuniao VARCHAR(200),
    ativo BOOLEAN DEFAULT true,
    cor_tema VARCHAR(7), -- Código hex para cor do ministério
    imagem_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.ministries IS 'Ministérios da igreja e suas informações';
COMMENT ON COLUMN public.ministries.cor_tema IS 'Cor em hexadecimal para identificação visual';

-- =====================================================
-- 6. TABELA DE MEMBROS DE MINISTÉRIOS
-- =====================================================
CREATE TABLE public.ministry_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cargo VARCHAR(50) DEFAULT 'Membro',
    data_ingresso DATE DEFAULT CURRENT_DATE,
    data_saida DATE,
    ativo BOOLEAN DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ministry_id, user_id) -- Evita duplicatas
);

COMMENT ON TABLE public.ministry_members IS 'Relacionamento entre ministérios e seus membros';

-- =====================================================
-- 7. TABELA DE DOAÇÕES
-- =====================================================
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('dizimo', 'oferta', 'missoes', 'construcao', 'social', 'outros')),
    metodo_pagamento VARCHAR(30) DEFAULT 'dinheiro' CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'cheque')),
    data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
    referencia_mes DATE, -- Para dízimos, o mês de referência
    descricao TEXT,
    anonima BOOLEAN DEFAULT false,
    recibo_emitido BOOLEAN DEFAULT false,
    numero_recibo VARCHAR(50),
    observacoes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.donations IS 'Registro de doações e ofertas';
COMMENT ON COLUMN public.donations.referencia_mes IS 'Mês de referência para dízimos';
COMMENT ON COLUMN public.donations.anonima IS 'Se a doação deve ser tratada como anônima nos relatórios';

-- =====================================================
-- 8. TABELA DE CONTRIBUIÇÕES (Para projetos específicos)
-- =====================================================
CREATE TABLE public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    projeto VARCHAR(200) NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    meta_valor DECIMAL(10,2),
    data_contribuicao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    descricao TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.contributions IS 'Contribuições para projetos específicos da igreja';

-- =====================================================
-- 9. TABELA DE TRANSMISSÕES AO VIVO
-- =====================================================
CREATE TABLE public.live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    url_stream TEXT NOT NULL,
    url_chat TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'ao_vivo', 'finalizado', 'cancelado')),
    evento_id UUID REFERENCES public.events(id),
    visualizacoes INTEGER DEFAULT 0,
    gravacao_url TEXT,
    publico BOOLEAN DEFAULT true,
    senha VARCHAR(50), -- Para streams privadas
    observacoes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.live_streams IS 'Transmissões ao vivo da igreja';
COMMENT ON COLUMN public.live_streams.senha IS 'Senha para streams privadas';

-- =====================================================
-- 10. TABELA DE INSCRIÇÕES EM EVENTOS
-- =====================================================
CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'inscrito' CHECK (status IN ('inscrito', 'confirmado', 'presente', 'ausente', 'cancelado')),
    valor_pago DECIMAL(10,2) DEFAULT 0,
    metodo_pagamento VARCHAR(30) CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'isento')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Evita inscrições duplicadas
);

COMMENT ON TABLE public.event_registrations IS 'Inscrições de usuários em eventos';

-- =====================================================
-- 11. TABELA DE VISITAS PASTORAIS
-- =====================================================
CREATE TABLE public.pastoral_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitado_id UUID NOT NULL REFERENCES public.users(id),
    pastor_id UUID NOT NULL REFERENCES public.users(id),
    data_visita DATE NOT NULL,
    horario TIME,
    local VARCHAR(200),
    motivo VARCHAR(100),
    tipo_visita VARCHAR(30) DEFAULT 'pastoral' CHECK (tipo_visita IN ('pastoral', 'hospitalar', 'emergencial', 'aconselhamento', 'evangelistica')),
    status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada', 'reagendada')),
    resumo TEXT,
    observacoes TEXT,
    proxima_visita DATE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.pastoral_visits IS 'Registro de visitas pastorais';

-- =====================================================
-- 12. TABELA DE NOTIFICAÇÕES
-- =====================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(30) DEFAULT 'info' CHECK (tipo IN ('info', 'aviso', 'urgente', 'evento', 'financeiro')),
    lida BOOLEAN DEFAULT false,
    url_acao TEXT, -- URL para ação relacionada à notificação
    data_expiracao TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'Sistema de notificações para usuários';
COMMENT ON COLUMN public.notifications.url_acao IS 'URL para redirecionar quando notificação for clicada';

-- =====================================================
-- SUCESSO
-- =====================================================
SELECT 'Schema e tabelas criados com sucesso!' as resultado;