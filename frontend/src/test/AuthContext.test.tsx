import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Test component to access auth context
const TestComponent = () => {
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button 
        onClick={() => login('pastor@casadeprovision.es', '2GZPkxTmfSiTY64E')}
        data-testid="login-button"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with loading state when no token exists', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should be loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('should verify existing token on initialization', async () => {
      // Set up existing token
      localStorage.setItem('auth_token', 'existing-token');
      
      // Mock successful token verification
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'pastor@casadeprovision.es',
              name: 'Pastor',
              role: 'admin',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          }
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should verify token
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/auth/verify',
          {
            headers: {
              'Authorization': 'Bearer existing-token',
              'Content-Type': 'application/json'
            }
          }
        );
      });

      // Should set user and authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('pastor@casadeprovision.es');
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });

    it('should clear invalid token on initialization', async () => {
      localStorage.setItem('auth_token', 'invalid-token');
      localStorage.setItem('refresh_token', 'invalid-refresh');
      
      // Mock failed token verification
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid token'
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should verify token and clear it when invalid
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
    });
  });

  describe('Login Function', () => {
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();
      
      // Mock successful login response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'pastor@casadeprovision.es',
              name: 'Pastor',
              role: 'admin',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            token: 'new-jwt-token',
            refresh_token: 'new-refresh-token'
          }
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial loading to finish
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Trigger login
      await user.click(screen.getByTestId('login-button'));

      // Should make login API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/auth/login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: 'pastor@casadeprovision.es',
              password: '2GZPkxTmfSiTY64E'
            })
          }
        );
      });

      // Should update authentication state
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('pastor@casadeprovision.es');
      });

      // Should store tokens
      expect(localStorage.getItem('auth_token')).toBe('new-jwt-token');
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
    });

    it('should handle login failure correctly', async () => {
      const user = userEvent.setup();
      
      // Mock failed login response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials'
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Trigger login
      await user.click(screen.getByTestId('login-button'));

      // Should remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      // Should not store tokens
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should handle network errors during login', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Trigger login
      await user.click(screen.getByTestId('login-button'));

      // Should remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });
  });

  describe('Logout Function', () => {
    it('should successfully logout and clear authentication state', async () => {
      const user = userEvent.setup();
      
      // Set up authenticated state
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');
      
      // Mock successful logout response
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/auth/verify')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: 'pastor@casadeprovision.es',
                  name: 'Pastor',
                  role: 'admin',
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                }
              }
            })
          });
        }
        if (url.includes('/auth/logout')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial authentication
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Trigger logout
      await user.click(screen.getByTestId('logout-button'));

      // Should make logout API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/auth/logout',
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json'
            }
          }
        );
      });

      // Should clear authentication state
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      // Should clear tokens
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should clear local state even if logout API fails', async () => {
      const user = userEvent.setup();
      
      // Set up authenticated state
      localStorage.setItem('auth_token', 'test-token');
      
      // Mock successful initial verification, failed logout
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/auth/verify')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: 'pastor@casadeprovision.es',
                  name: 'Pastor',
                  role: 'admin'
                }
              }
            })
          });
        }
        if (url.includes('/auth/logout')) {
          return Promise.reject(new Error('Logout failed'));
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial authentication
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Trigger logout
      await user.click(screen.getByTestId('logout-button'));

      // Should still clear authentication state despite API error
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      // Should clear tokens
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });
});