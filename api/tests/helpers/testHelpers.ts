import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@shared/types';

// Helper para criar token JWT de teste
export const createTestToken = (userId: string, role: 'visitor' | 'member' | 'leader' | 'admin' = 'member') => {
  return jwt.sign(
    { 
      userId, 
      role,
      email: `test-${userId}@example.com`,
      name: `Test User ${userId}`
    },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
};

// Helper para criar request mock autenticado
export const createAuthenticatedRequest = (
  userId: string = 'test-user-id',
  role: 'visitor' | 'member' | 'leader' | 'admin' = 'member',
  body: any = {},
  params: any = {},
  query: any = {}
): Partial<AuthenticatedRequest> => {
  const token = createTestToken(userId, role);
  
  return {
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: {
      id: userId,
      role,
      email: `test-${userId}@example.com`,
      name: `Test User ${userId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    body,
    params,
    query,
  };
};

// Helper para criar response mock
export const createResponseMock = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

// Helper para mock de dados de eventos
export const createMockEvent = (overrides: any = {}) => ({
  id: 'event-1',
  titulo: 'Culto Dominical',
  descricao: 'Servicio de adoración semanal',
  data_inicio: new Date('2025-07-28T10:00:00Z').toISOString(),
  data_fim: new Date('2025-07-28T12:00:00Z').toISOString(),
  local: 'Iglesia Central',
  endereco_completo: 'Rua da Igreja, 123 - Centro',
  tipo: 'culto',
  status: 'agendado',
  max_participantes: 200,
  valor_inscricao: 0,
  requer_inscricao: false,
  publico: true,
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper para mock de dados de streams
export const createMockStream = (overrides: any = {}) => ({
  id: 'stream-1',
  title: 'Culto Dominical en Vivo',
  description: 'Transmisión en vivo del servicio dominical',
  stream_url: 'https://youtube.com/live/stream1',
  scheduled_date: '2025-07-28',
  scheduled_time: '10:00',
  platform: 'youtube',
  status: 'scheduled',
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper para mock de dados de membros
export const createMockMember = (overrides: any = {}) => ({
  id: 'member-1',
  user_id: 'mock-user-id',
  tipo_membro: 'efetivo',
  data_ingresso: '2020-01-01',
  status: 'ativo',
  observacoes: 'Mock member observations',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper para mock de dados de visitantes
export const createMockVisitor = (overrides: any = {}) => ({
  id: 'visitor-1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '987654321',
  address: '456 Oak Ave',
  visit_date: '2025-07-24',
  source: 'walk_in',
  notes: 'First visit',
  follow_up_status: 'pending',
  interested_in_membership: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper para mock de dados de ministérios
export const createMockMinistry = (overrides: any = {}) => ({
  id: 'ministry-1',
  nome: 'Ministerio de Alabanza',
  descricao: 'Encargados de la música y adoración',
  lider_id: 'leader-1',
  ativo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper para simular erros do Supabase
export const createSupabaseError = (message: string, code?: string) => ({
  error: {
    message,
    code: code || 'GENERIC_ERROR',
    details: null,
    hint: null,
  },
  data: null,
});

// Helper para simular sucesso do Supabase
export const createSupabaseSuccess = (data: any, count?: number) => ({
  data,
  error: null,
  count: count || (Array.isArray(data) ? data.length : 1),
});