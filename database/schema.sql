-- =====================================
-- CCCP - Casa de Provisão
-- Schema Completo do Banco de Dados
-- =====================================

-- Limpar tabelas existentes (cuidado em produção!)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS ministry_members CASCADE;
-- DROP TABLE IF EXISTS ministries CASCADE;
-- DROP TABLE IF EXISTS pastoral_visits CASCADE;
-- DROP TABLE IF EXISTS live_streams CASCADE;
-- DROP TABLE IF EXISTS contributions CASCADE;
-- DROP TABLE IF EXISTS donations CASCADE;
-- DROP TABLE IF EXISTS event_registrations CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS members CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS organization CASCADE;

-- =====================================
-- 1. TABELA ORGANIZATION
-- =====================================
CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    descricao TEXT,
    logo TEXT,
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 2. TABELA USERS (Principal)
-- =====================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Mesmo ID do auth.users
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255), -- Opcional, auth é pelo Supabase
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'leader', 'member', 'visitor')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 3. TABELA EVENTS
-- =====================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    local VARCHAR(200),
    categoria VARCHAR(50) DEFAULT 'culto' CHECK (categoria IN ('culto', 'estudio', 'jovenes', 'oracion', 'especial')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    max_participantes INTEGER,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 4. TABELA EVENT_REGISTRATIONS
-- =====================================
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT,
    UNIQUE(event_id, user_id)
);

-- =====================================
-- 5. TABELA MEMBERS
-- =====================================
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    membership_type VARCHAR(30) DEFAULT 'efetivo' CHECK (membership_type IN ('efetivo', 'em_experiencia', 'congregado')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 6. TABELA DONATIONS
-- =====================================
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    tipo VARCHAR(20) DEFAULT 'dizimo' CHECK (tipo IN ('dizimo', 'oferta', 'missoes', 'outros')),
    descricao TEXT,
    data_doacao TIMESTAMP WITH TIME ZONE NOT NULL,
    comprovante TEXT, -- URL do comprovante
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 7. TABELA CONTRIBUTIONS
-- =====================================
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    tipo VARCHAR(30) DEFAULT 'mensal',
    descricao TEXT,
    data_contribuicao TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 8. TABELA LIVE_STREAMS
-- =====================================
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    url_stream TEXT NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    ativa BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 9. TABELA MINISTRIES
-- =====================================
CREATE TABLE IF NOT EXISTS ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    descricao TEXT,
    lider_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 10. TABELA MINISTRY_MEMBERS
-- =====================================
CREATE TABLE IF NOT EXISTS ministry_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cargo VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ministry_id, user_id)
);

-- =====================================
-- 11. TABELA PASTORAL_VISITS
-- =====================================
CREATE TABLE IF NOT EXISTS pastoral_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitado_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pastor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data_visita TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo TEXT,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'concluida', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 12. TABELA NOTIFICATIONS
-- =====================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(30) DEFAULT 'aviso' CHECK (tipo IN ('aviso', 'lembrete', 'urgente')),
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_data_inicio ON events(data_inicio);
CREATE INDEX IF NOT EXISTS idx_events_categoria ON events(categoria);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Event Registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);

-- Members
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- Donations
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_data_doacao ON donations(data_doacao);
CREATE INDEX IF NOT EXISTS idx_donations_tipo ON donations(tipo);

-- Contributions
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_data ON contributions(data_contribuicao);

-- Live Streams
CREATE INDEX IF NOT EXISTS idx_live_streams_data_inicio ON live_streams(data_inicio);
CREATE INDEX IF NOT EXISTS idx_live_streams_ativa ON live_streams(ativa);

-- Ministries
CREATE INDEX IF NOT EXISTS idx_ministries_lider_id ON ministries(lider_id);
CREATE INDEX IF NOT EXISTS idx_ministries_ativo ON ministries(ativo);

-- Ministry Members
CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry_id ON ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_user_id ON ministry_members(user_id);

-- Pastoral Visits
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_visitado_id ON pastoral_visits(visitado_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_pastor_id ON pastoral_visits(pastor_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_visits_data ON pastoral_visits(data_visita);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lida ON notifications(lida);

-- =====================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabela
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_donations_updated_at ON donations;
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_contributions_updated_at ON contributions;
CREATE TRIGGER update_contributions_updated_at
    BEFORE UPDATE ON contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_live_streams_updated_at ON live_streams;
CREATE TRIGGER update_live_streams_updated_at
    BEFORE UPDATE ON live_streams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_ministries_updated_at ON ministries;
CREATE TRIGGER update_ministries_updated_at
    BEFORE UPDATE ON ministries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_pastoral_visits_updated_at ON pastoral_visits;
CREATE TRIGGER update_pastoral_visits_updated_at
    BEFORE UPDATE ON pastoral_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_organization_updated_at ON organization;
CREATE TRIGGER update_organization_updated_at
    BEFORE UPDATE ON organization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================
-- INSERIR DADOS INICIAIS
-- =====================================

-- Organização padrão
INSERT INTO organization (name, descricao) 
VALUES (
    'Centro Cristiano Casa de Provisión',
    'Igreja evangélica dedicada ao crescimento espiritual e social da comunidade.'
) ON CONFLICT DO NOTHING;

-- =====================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================

COMMENT ON TABLE organization IS 'Informações da organização/igreja';
COMMENT ON TABLE users IS 'Usuários do sistema (conectado ao auth.users)';
COMMENT ON TABLE events IS 'Eventos da igreja (cultos, estudos, etc.)';
COMMENT ON TABLE event_registrations IS 'Inscrições dos usuários em eventos';
COMMENT ON TABLE members IS 'Membros oficiais da igreja';
COMMENT ON TABLE donations IS 'Doações e ofertas recebidas';
COMMENT ON TABLE contributions IS 'Contribuições regulares dos membros';
COMMENT ON TABLE live_streams IS 'Transmissões ao vivo de cultos';
COMMENT ON TABLE ministries IS 'Ministérios da igreja';
COMMENT ON TABLE ministry_members IS 'Participantes dos ministérios';
COMMENT ON TABLE pastoral_visits IS 'Visitas pastorais agendadas/realizadas';
COMMENT ON TABLE notifications IS 'Notificações para os usuários';

-- =====================================
-- FIM DO SCHEMA
-- =====================================