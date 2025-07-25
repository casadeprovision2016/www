import { createClient } from '@supabase/supabase-js';

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-tests-only';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock do console para reduzir ruído nos testes
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Aumentar timeout para operações assíncronas
jest.setTimeout(10000);

// Mock do Supabase para testes
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock do Redis/cache service
jest.mock('../src/services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(true),
    clear: jest.fn().mockResolvedValue(true),
    invalidate: jest.fn().mockResolvedValue(true),
    healthCheck: jest.fn().mockResolvedValue(true),
  },
}));

// Mock do logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  requestLogger: jest.fn((req, res, next) => next()),
}));

// Configurar mock padrão do Supabase com suporte a chains complexas
const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  upsert: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  not: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  catch: jest.fn(),
  
  // Método para resetar todos os mocks
  resetMocks: () => {
    Object.keys(mockSupabaseClient).forEach(key => {
      if (typeof mockSupabaseClient[key] === 'function' && mockSupabaseClient[key].mockRestore) {
        mockSupabaseClient[key].mockRestore(); // Use mockRestore to reset to original implementation
      }
    });
    // Re-mock the chainable methods
    mockSupabaseClient.from.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.select.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.insert.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.update.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.delete.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.upsert.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.eq.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.gte.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.lte.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.lt.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.gt.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.or.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.not.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.order.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.limit.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.range.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.single.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  }
};

(createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

// Disponibilizar o mock globalmente para os testes
global.mockSupabaseClient = mockSupabaseClient;

// Limpar mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
  mockSupabaseClient.resetMocks();
});

export { mockSupabaseClient };