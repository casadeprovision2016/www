-- ==============================================
-- CCCP - Casa de Provisión
-- Script COMPLETO para criar tabela VISITORS
-- Inclui: Tabela + Índices + Gatilhos + RLS + Políticas
-- ==============================================

-- 1. CRIAR TABELA VISITORS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  "visitDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(50) NOT NULL DEFAULT 'walk_in' 
    CHECK (source IN ('invitation', 'social_media', 'walk_in', 'website', 'other')),
  notes TEXT,
  "followUpStatus" VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK ("followUpStatus" IN ('pending', 'contacted', 'scheduled', 'completed', 'no_interest')),
  "followUpDate" DATE,
  "interestedInMembership" BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES DE PERFORMANCE
-- ==============================================
-- Índice para consultas por data de visita (muito comum)
CREATE INDEX IF NOT EXISTS idx_visitors_visit_date ON public.visitors("visitDate");

-- Índice para consultas por status de follow-up
CREATE INDEX IF NOT EXISTS idx_visitors_follow_up_status ON public.visitors("followUpStatus");

-- Índice para consultas por fonte do visitante
CREATE INDEX IF NOT EXISTS idx_visitors_source ON public.visitors(source);

-- Índice para ordenação por data de criação
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON public.visitors(created_at);

-- Índice para busca por email (para evitar duplicatas)
CREATE INDEX IF NOT EXISTS idx_visitors_email ON public.visitors(email) WHERE email IS NOT NULL;

-- Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON public.visitors(phone) WHERE phone IS NOT NULL;

-- Índice composto para relatórios de follow-up
CREATE INDEX IF NOT EXISTS idx_visitors_followup_date_status ON public.visitors("followUpDate", "followUpStatus");

-- Índice para visitantes interessados em membership
CREATE INDEX IF NOT EXISTS idx_visitors_interested_membership ON public.visitors("interestedInMembership") WHERE "interestedInMembership" = true;

-- Índice para busca de texto completo no nome
CREATE INDEX IF NOT EXISTS idx_visitors_name_trgm ON public.visitors USING gin(name gin_trgm_ops);

-- 3. FUNÇÕES E GATILHOS (TRIGGERS)
-- ==============================================

-- Função para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_visitors_updated_at ON public.visitors;
CREATE TRIGGER update_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para validar data de follow-up
CREATE OR REPLACE FUNCTION validate_followup_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status é 'scheduled', deve ter data de follow-up
  IF NEW."followUpStatus" = 'scheduled' AND NEW."followUpDate" IS NULL THEN
    RAISE EXCEPTION 'Follow-up date is required when status is scheduled';
  END IF;
  
  -- Data de follow-up não pode ser anterior à data de visita
  IF NEW."followUpDate" IS NOT NULL AND NEW."followUpDate" < NEW."visitDate" THEN
    RAISE EXCEPTION 'Follow-up date cannot be before visit date';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validação de data de follow-up
DROP TRIGGER IF EXISTS validate_visitors_followup_date ON public.visitors;
CREATE TRIGGER validate_visitors_followup_date
  BEFORE INSERT OR UPDATE ON public.visitors
  FOR EACH ROW
  EXECUTE FUNCTION validate_followup_date();

-- Função para log de atividades
CREATE OR REPLACE FUNCTION log_visitor_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Em uma implementação completa, isso logaria mudanças em uma tabela de auditoria
  -- Por enquanto, apenas registra no log do PostgreSQL
  
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'New visitor created: % (ID: %)', NEW.name, NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD."followUpStatus" != NEW."followUpStatus" THEN
      RAISE NOTICE 'Visitor % follow-up status changed from % to %', NEW.name, OLD."followUpStatus", NEW."followUpStatus";
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE NOTICE 'Visitor deleted: % (ID: %)', OLD.name, OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para log de atividades
DROP TRIGGER IF EXISTS log_visitors_changes ON public.visitors;
CREATE TRIGGER log_visitors_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.visitors
  FOR EACH ROW
  EXECUTE FUNCTION log_visitor_changes();

-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Habilitar RLS na tabela
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Política 1: Administradores podem fazer tudo
DROP POLICY IF EXISTS "Admin full access" ON public.visitors;
CREATE POLICY "Admin full access" ON public.visitors
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política 2a: Líderes podem ler
DROP POLICY IF EXISTS "Leaders read" ON public.visitors;
CREATE POLICY "Leaders read" ON public.visitors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('leader', 'admin')
    )
  );

-- Política 2b: Líderes podem atualizar
DROP POLICY IF EXISTS "Leaders update" ON public.visitors;
CREATE POLICY "Leaders update" ON public.visitors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('leader', 'admin')
    )
  );

-- Política 3: Membros podem apenas ler
DROP POLICY IF EXISTS "Members read only" ON public.visitors;
CREATE POLICY "Members read only" ON public.visitors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('member', 'leader', 'admin')
    )
  );

-- Política 4: Permitir inserção para membros e acima
DROP POLICY IF EXISTS "Members can insert" ON public.visitors;
CREATE POLICY "Members can insert" ON public.visitors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('member', 'leader', 'admin')
    )
  );

-- 5. FUNÇÕES AUXILIARES
-- ==============================================

-- Função para estatísticas de visitantes
CREATE OR REPLACE FUNCTION get_visitor_stats(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE(
  total_visitors BIGINT,
  new_this_month BIGINT,
  pending_followup BIGINT,
  interested_in_membership BIGINT,
  by_source JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_visitors,
    COUNT(*) FILTER (WHERE "visitDate" >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT as new_this_month,
    COUNT(*) FILTER (WHERE "followUpStatus" = 'pending')::BIGINT as pending_followup,
    COUNT(*) FILTER (WHERE "interestedInMembership" = true)::BIGINT as interested_in_membership,
    json_object_agg(source, count_by_source) as by_source
  FROM (
    SELECT 
      source,
      COUNT(*) as count_by_source
    FROM public.visitors
    WHERE 
      (start_date IS NULL OR "visitDate" >= start_date) AND
      (end_date IS NULL OR "visitDate" <= end_date)
    GROUP BY source
  ) source_stats;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION get_visitor_stats TO authenticated;

-- Inserir alguns dados de exemplo
INSERT INTO public.visitors (name, email, phone, address, source, notes, "interestedInMembership") VALUES
('María García', 'maria.garcia@email.com', '+34 600 123 456', 'Madrid, España', 'invitation', 'Invitada por un miembro de la iglesia', true),
('Carlos Rodríguez', 'carlos.rodriguez@email.com', '+34 600 789 012', 'Barcelona, España', 'website', 'Encontró la iglesia a través del sitio web', false),
('Ana López', NULL, '+34 600 345 678', 'Valencia, España', 'walk_in', 'Visitó durante el culto dominical', true),
('Pedro Martínez', 'pedro.martinez@email.com', NULL, 'Sevilla, España', 'social_media', 'Vino después de ver publicación en redes sociales', false),
('Laura Fernández', 'laura.fernandez@email.com', '+34 600 901 234', 'Bilbao, España', 'other', 'Recomendación de un amigo', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar se a tabela foi criada corretamente
SELECT 
  'Tabela visitors criada com sucesso!' as status,
  COUNT(*) as total_registros
FROM public.visitors;