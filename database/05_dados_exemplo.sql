-- =====================================================
-- CCCP - CASA DE PROVISIÓN
-- DADOS DE EXEMPLO PARA TESTES
-- =====================================================
-- Arquivo: 05_dados_exemplo.sql
-- Descrição: Dados realistas para testes unitários
-- Data: 2025-01-24
-- =====================================================

-- Limpar dados existentes
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.pastoral_visits CASCADE;
TRUNCATE TABLE public.ministry_members CASCADE;
TRUNCATE TABLE public.event_registrations CASCADE;
TRUNCATE TABLE public.contributions CASCADE;
TRUNCATE TABLE public.donations CASCADE;
TRUNCATE TABLE public.live_streams CASCADE;
TRUNCATE TABLE public.ministries CASCADE;
TRUNCATE TABLE public.members CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.organization CASCADE;

-- =====================================================
-- 1. ORGANIZAÇÃO
-- =====================================================
INSERT INTO public.organization (id, nome, descricao, endereco, telefone, email, website) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Casa de Provisión', 'Igreja Evangélica Casa de Provisión', 'Rua da Igreja, 123 - Centro', '(11) 99999-9999', 'contato@casadeprovision.com.br', 'https://casadeprovision.com.br');

-- =====================================================
-- 2. USUÁRIOS DE EXEMPLO
-- =====================================================
INSERT INTO public.users (id, email, nome, telefone, endereco, data_nascimento, profissao, estado_civil, role, ativo) VALUES
-- Administradores
('550e8400-e29b-41d4-a716-446655440001', 'admin@test.com', 'João Silva', '(11) 91234-5678', 'Rua A, 100', '1980-05-15', 'Pastor', 'casado', 'admin', true),
('550e8400-e29b-41d4-a716-446655440002', 'pastor@test.com', 'Maria Santos', '(11) 91234-5679', 'Rua B, 200', '1975-08-20', 'Pastora', 'casada', 'pastor', true),

-- Líderes
('550e8400-e29b-41d4-a716-446655440003', 'leader1@test.com', 'Carlos Oliveira', '(11) 91234-5680', 'Rua C, 300', '1985-12-10', 'Engenheiro', 'solteiro', 'leader', true),
('550e8400-e29b-41d4-a716-446655440004', 'leader2@test.com', 'Ana Costa', '(11) 91234-5681', 'Rua D, 400', '1990-03-25', 'Professora', 'casada', 'leader', true),

-- Membros
('550e8400-e29b-41d4-a716-446655440005', 'member1@test.com', 'Pedro Almeida', '(11) 91234-5682', 'Rua E, 500', '1992-07-18', 'Contador', 'solteiro', 'member', true),
('550e8400-e29b-41d4-a716-446655440006', 'member2@test.com', 'Lucia Ferreira', '(11) 91234-5683', 'Rua F, 600', '1988-11-30', 'Médica', 'casada', 'member', true),
('550e8400-e29b-41d4-a716-446655440007', 'member3@test.com', 'Roberto Lima', '(11) 91234-5684', 'Rua G, 700', '1995-04-12', 'Advogado', 'solteiro', 'member', true),

-- Visitantes
('550e8400-e29b-41d4-a716-446655440008', 'visitor1@test.com', 'José Pereira', '(11) 91234-5685', 'Rua H, 800', '1987-09-05', 'Comerciante', 'casado', 'member', true),
('550e8400-e29b-41d4-a716-446655440009', 'visitor2@test.com', 'Isabel Rodrigues', '(11) 91234-5686', 'Rua I, 900', '1993-01-22', 'Designer', 'solteira', 'member', true);

-- =====================================================
-- 3. MEMBROS
-- =====================================================
INSERT INTO public.members (id, user_id, tipo_membro, data_ingresso, status, batizado, data_batismo, dizimista) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'efetivo', '2020-01-15', 'ativo', true, '2020-02-15', true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'efetivo', '2020-01-15', 'ativo', true, '2020-02-15', true),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'efetivo', '2021-06-10', 'ativo', true, '2021-07-10', true),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'efetivo', '2022-03-20', 'ativo', true, '2022-04-20', true),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'em_experiencia', '2024-08-15', 'ativo', false, null, false),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'congregado', '2024-10-01', 'ativo', false, null, true),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'congregado', '2024-11-15', 'ativo', false, null, false),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'visitante', '2024-12-01', 'ativo', false, null, false),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', 'visitante', '2024-12-15', 'ativo', false, null, false);

-- =====================================================
-- 4. EVENTOS
-- =====================================================
INSERT INTO public.events (id, titulo, descricao, data_inicio, data_fim, local, endereco_completo, tipo, status, max_participantes, valor_inscricao, requer_inscricao, publico, created_by) VALUES
-- Eventos futuros
('750e8400-e29b-41d4-a716-446655440001', 'Culto Dominical', 'Culto de adoração e palavra', '2025-02-02 10:00:00+00', '2025-02-02 12:00:00+00', 'Templo Principal', 'Rua da Igreja, 123 - Centro', 'culto', 'agendado', 200, 0, false, true, '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440002', 'Estudo Bíblico', 'Estudo do livro de João', '2025-02-05 19:30:00+00', '2025-02-05 21:00:00+00', 'Sala de Estudos', 'Rua da Igreja, 123 - Centro', 'estudo', 'agendado', 50, 0, false, true, '550e8400-e29b-41d4-a716-446655440002'),
('750e8400-e29b-41d4-a716-446655440003', 'Conferência de Jovens', 'Conferência especial para jovens', '2025-03-15 19:00:00+00', '2025-03-16 22:00:00+00', 'Auditório', 'Av. Principal, 456', 'conferencia', 'agendado', 300, 50.00, true, true, '550e8400-e29b-41d4-a716-446655440003'),
('750e8400-e29b-41d4-a716-446655440004', 'Reunião de Oração', 'Reunião semanal de oração', '2025-02-07 20:00:00+00', '2025-02-07 21:30:00+00', 'Templo Principal', 'Rua da Igreja, 123 - Centro', 'reuniao', 'agendado', 100, 0, false, true, '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440005', 'Evento Privado Liderança', 'Reunião privada da liderança', '2025-02-10 14:00:00+00', '2025-02-10 18:00:00+00', 'Sala de Reuniões', 'Rua da Igreja, 123 - Centro', 'reuniao', 'agendado', 20, 0, true, false, '550e8400-e29b-41d4-a716-446655440001'),

-- Eventos passados
('750e8400-e29b-41d4-a716-446655440006', 'Culto de Ano Novo', 'Culto especial de Ano Novo', '2025-01-01 23:00:00+00', '2025-01-02 01:00:00+00', 'Templo Principal', 'Rua da Igreja, 123 - Centro', 'culto', 'concluido', 250, 0, false, true, '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440007', 'Seminário de Liderança', 'Seminário para formação de líderes', '2025-01-20 08:00:00+00', '2025-01-20 17:00:00+00', 'Auditório', 'Av. Principal, 456', 'evento', 'concluido', 80, 30.00, true, false, '550e8400-e29b-41d4-a716-446655440002'),

-- Evento cancelado
('750e8400-e29b-41d4-a716-446655440008', 'Piquenique da Igreja', 'Piquenique familiar (cancelado por chuva)', '2025-01-25 15:00:00+00', '2025-01-25 20:00:00+00', 'Parque Municipal', 'Parque Municipal, s/n', 'evento', 'cancelado', 150, 20.00, true, true, '550e8400-e29b-41d4-a716-446655440003');

-- =====================================================
-- 5. MINISTÉRIOS
-- =====================================================
INSERT INTO public.ministries (id, nome, descricao, lider_id, vice_lider_id, reuniao_dia, reuniao_horario, local_reuniao, ativo, cor_tema) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'Louvor e Adoração', 'Ministério responsável pela música nos cultos', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'quarta', '19:30:00', 'Sala de Ensaio', true, '#FF6B35'),
('850e8400-e29b-41d4-a716-446655440002', 'Jovens', 'Ministério voltado para a juventude', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'sexta', '19:00:00', 'Sala da Juventude', true, '#4ECDC4'),
('850e8400-e29b-41d4-a716-446655440003', 'Crianças', 'Ministério infantil', '550e8400-e29b-41d4-a716-446655440006', null, 'domingo', '09:00:00', 'Sala Infantil', true, '#45B7D1'),
('850e8400-e29b-41d4-a716-446655440004', 'Intercessão', 'Ministério de oração e intercessão', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 'terça', '18:00:00', 'Sala de Oração', true, '#96CEB4'),
('850e8400-e29b-41d4-a716-446655440005', 'Ação Social', 'Ministério de assistência social', '550e8400-e29b-41d4-a716-446655440007', null, 'sabado', '08:00:00', 'Depósito', false, '#FECA57');

-- =====================================================
-- 6. MEMBROS DE MINISTÉRIOS
-- =====================================================
INSERT INTO public.ministry_members (id, ministry_id, user_id, cargo, data_ingresso, ativo) VALUES
-- Louvor e Adoração
('950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Líder', '2021-06-10', true),
('950e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Vice-líder', '2022-03-20', true),
('950e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'Músico', '2024-08-15', true),
('950e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 'Vocalista', '2024-10-01', true),

-- Jovens
('950e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'Líder', '2022-03-20', true),
('950e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Vice-líder', '2024-08-15', true),
('950e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 'Membro', '2024-11-15', true),

-- Crianças
('950e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 'Líder', '2024-10-01', true),
('950e8400-e29b-41d4-a716-446655440009', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'Auxiliar', '2024-12-01', true);

-- =====================================================
-- 7. DOAÇÕES
-- =====================================================
INSERT INTO public.donations (id, user_id, valor, tipo, metodo_pagamento, data_doacao, referencia_mes, anonima, recibo_emitido, numero_recibo, created_by) VALUES
-- Dízimos
('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 500.00, 'dizimo', 'pix', '2025-01-15', '2025-01-01', false, true, 'REC-2025-001', '550e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 800.00, 'dizimo', 'transferencia', '2025-01-20', '2025-01-01', false, true, 'REC-2025-002', '550e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 1200.00, 'dizimo', 'cartao', '2025-01-22', '2025-01-01', false, true, 'REC-2025-003', '550e8400-e29b-41d4-a716-446655440001'),

-- Ofertas
('a50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 100.00, 'oferta', 'dinheiro', '2025-01-21', null, false, false, null, '550e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440005', null, 50.00, 'oferta', 'dinheiro', '2025-01-21', null, true, false, null, '550e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 200.00, 'oferta', 'pix', '2025-01-22', null, false, false, null, '550e8400-e29b-41d4-a716-446655440001'),

-- Missões e projetos
('a50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 300.00, 'missoes', 'pix', '2025-01-18', null, false, true, 'REC-2025-004', '550e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 1000.00, 'construcao', 'transferencia', '2025-01-19', null, false, true, 'REC-2025-005', '550e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', 150.00, 'social', 'dinheiro', '2025-01-23', null, false, false, null, '550e8400-e29b-41d4-a716-446655440001');

-- =====================================================
-- 8. TRANSMISSÕES
-- =====================================================
INSERT INTO public.live_streams (id, titulo, descricao, url_stream, data_inicio, data_fim, status, evento_id, visualizacoes, publico, created_by) VALUES
-- Transmissões futuras
('b50e8400-e29b-41d4-a716-446655440001', 'Culto Dominical - Ao Vivo', 'Transmissão do culto dominical', 'https://youtube.com/live/abc123', '2025-02-02 10:00:00+00', '2025-02-02 12:00:00+00', 'agendado', '750e8400-e29b-41d4-a716-446655440001', 0, true, '550e8400-e29b-41d4-a716-446655440001'),
('b50e8400-e29b-41d4-a716-446655440002', 'Estudo Bíblico - Online', 'Transmissão do estudo bíblico', 'https://youtube.com/live/def456', '2025-02-05 19:30:00+00', '2025-02-05 21:00:00+00', 'agendado', '750e8400-e29b-41d4-a716-446655440002', 0, true, '550e8400-e29b-41d4-a716-446655440002'),

-- Transmissões passadas
('b50e8400-e29b-41d4-a716-446655440003', 'Culto de Ano Novo - Gravado', 'Gravação do culto de ano novo', 'https://youtube.com/watch/ghi789', '2025-01-01 23:00:00+00', '2025-01-02 01:00:00+00', 'finalizado', '750e8400-e29b-41d4-a716-446655440006', 1250, true, '550e8400-e29b-41d4-a716-446655440001'),
('b50e8400-e29b-41d4-a716-446655440004', 'Seminário Liderança', 'Transmissão do seminário (privada)', 'https://youtube.com/live/jkl012', '2025-01-20 08:00:00+00', '2025-01-20 17:00:00+00', 'finalizado', '750e8400-e29b-41d4-a716-446655440007', 45, false, '550e8400-e29b-41d4-a716-446655440002');

-- =====================================================
-- 9. INSCRIÇÕES EM EVENTOS
-- =====================================================
INSERT INTO public.event_registrations (id, event_id, user_id, status, valor_pago, metodo_pagamento) VALUES
-- Conferência de Jovens
('c50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'inscrito', 50.00, 'pix'),
('c50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', 'inscrito', 50.00, 'cartao'),
('c50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'inscrito', 0.00, 'isento'),

-- Evento Privado Liderança
('c50e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'confirmado', 0.00, 'isento'),
('c50e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'confirmado', 0.00, 'isento'),

-- Seminário de Liderança (passado)
('c50e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'presente', 30.00, 'dinheiro'),
('c50e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'presente', 30.00, 'pix'),
('c50e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', 'ausente', 30.00, 'cartao');

-- =====================================================
-- 10. VISITAS PASTORAIS
-- =====================================================
INSERT INTO public.pastoral_visits (id, visitado_id, pastor_id, data_visita, horario, local, motivo, tipo_visita, status, resumo, proxima_visita, created_by) VALUES
-- Visitas realizadas
('d50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '2025-01-20', '14:00:00', 'Residência', 'Acompanhamento espiritual', 'pastoral', 'realizada', 'Conversa edificante sobre crescimento na fé. Oração pela família.', '2025-03-20', '550e8400-e29b-41d4-a716-446655440001'),
('d50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', '2025-01-22', '16:30:00', 'Hospital Santa Maria', 'Visita hospitalar', 'hospitalar', 'realizada', 'Oração e conforto durante internação. Família muito grata.', null, '550e8400-e29b-41d4-a716-446655440002'),

-- Visitas agendadas
('d50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '2025-02-05', '15:00:00', 'Residência', 'Aconselhamento familiar', 'aconselhamento', 'agendada', null, null, '550e8400-e29b-41d4-a716-446655440001'),
('d50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '2025-02-08', '10:00:00', 'Escritório', 'Conversa sobre liderança', 'pastoral', 'agendada', null, null, '550e8400-e29b-41d4-a716-446655440002'),

-- Visita cancelada
('d50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', '2025-01-25', '19:00:00', 'Residência', 'Primeira visita', 'evangelistica', 'cancelada', null, null, '550e8400-e29b-41d4-a716-446655440001');

-- =====================================================
-- SUCESSO
-- =====================================================
SELECT 'Dados de exemplo inseridos com sucesso!' as resultado;
