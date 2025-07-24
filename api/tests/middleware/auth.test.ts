import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { 
  authenticateToken, 
  requireMemberOrAbove, 
  requireLeaderOrAdmin, 
  requireAdmin 
} from '../../src/middleware/auth';
import { 
  createAuthenticatedRequest, 
  createResponseMock,
  createSupabaseSuccess,
  createSupabaseError,
  createTestToken
} from '../helpers/testHelpers';
import { mockSupabaseClient } from '../setup';

// Mock JWT
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = createResponseMock();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const token = createTestToken('user-1', 'member');
      mockReq = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      // Mock Supabase auth.getUser
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      });

      // Mock Supabase user lookup
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({
        id: 'user-1',
        email: 'test@example.com',
        nome: 'Test User',
        role: 'member',
        status: 'active'
      }));

      // Mock supabase.auth.getUser
      global.mockSupabaseClient.auth = {
        getUser: mockGetUser
      };

      await authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(expect.objectContaining({
        id: 'user-1',
        email: 'test@example.com',
        role: 'member'
      }));
    });

    it('should reject request without authorization header', async () => {
      mockReq = { headers: {} };

      await authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token de acesso requerido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', async () => {
      mockReq = {
        headers: {
          authorization: 'InvalidFormat'
        }
      };

      await authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token de acesso requerido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockReq = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };

      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      global.mockSupabaseClient.auth = {
        getUser: mockGetUser
      };

      await authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when user not found in database', async () => {
      const token = createTestToken('user-1', 'member');
      mockReq = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      });

      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseError('User not found'));

      global.mockSupabaseClient.auth = {
        getUser: mockGetUser
      };

      await authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject inactive users', async () => {
      const token = createTestToken('user-1', 'member');
      mockReq = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      });

      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({
        id: 'user-1',
        email: 'test@example.com',
        nome: 'Test User',
        role: 'member',
        status: 'inactive' // Inactive user
      }));

      global.mockSupabaseClient.auth = {
        getUser: mockGetUser
      };

      await authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário inativo'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireMemberOrAbove', () => {
    it('should allow member access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'member');

      requireMemberOrAbove(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow leader access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'leader');

      requireMemberOrAbove(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'admin');

      requireMemberOrAbove(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject visitor access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'visitor');

      requireMemberOrAbove(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acesso negado. Nível de membro ou superior requerido.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
      mockReq = { user: undefined };

      requireMemberOrAbove(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Autenticação requerida'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireLeaderOrAdmin', () => {
    it('should allow leader access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'leader');

      requireLeaderOrAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'admin');

      requireLeaderOrAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject member access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'member');

      requireLeaderOrAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acesso negado. Nível de liderança ou superior requerido.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject visitor access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'visitor');

      requireLeaderOrAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'admin');

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject leader access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'leader');

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acesso negado. Nível de administrador requerido.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject member access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'member');

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject visitor access', () => {
      mockReq = createAuthenticatedRequest('user-1', 'visitor');

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Token expiration handling', () => {
    it('should reject expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: 'user-1', role: 'member' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      mockReq = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };

      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' }
      });

      global.mockSupabaseClient.auth = {
        getUser: mockGetUser
      };

      await authenticateToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Role hierarchy validation', () => {
    it('should correctly identify role hierarchy', () => {
      const roles = ['visitor', 'member', 'leader', 'admin'];
      
      roles.forEach((role, index) => {
        mockReq = createAuthenticatedRequest('user-1', role as any);
        
        // Test member requirement
        if (index >= 1) { // member or above
          requireMemberOrAbove(mockReq as Request, mockRes as Response, mockNext);
          expect(mockNext).toHaveBeenCalled();
        }
        
        // Test leader requirement
        if (index >= 2) { // leader or above
          requireLeaderOrAdmin(mockReq as Request, mockRes as Response, mockNext);
          expect(mockNext).toHaveBeenCalled();
        }
        
        // Test admin requirement
        if (index >= 3) { // admin only
          requireAdmin(mockReq as Request, mockRes as Response, mockNext);
          expect(mockNext).toHaveBeenCalled();
        }
        
        jest.clearAllMocks();
      });
    });
  });
});