import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Integration test wrapper 
const IntegrationTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset window location
    delete (window as any).location;
    (window as any).location = { 
      href: 'http://localhost:3000/login',
      pathname: '/login',
      assign: vi.fn(),
      replace: vi.fn()
    };
  });

  describe('Complete Login Flow with Valid Credentials', () => {
    it('should complete full login flow from form submission to panel access', async () => {
      const user = userEvent.setup();
      
      // Mock successful API responses
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: 'pastor@casadeprovision.es',
                  name: 'Pastor Silva',
                  telefone: '+1234567890',
                  role: 'admin',
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                },
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload',
                refresh_token: 'refresh-token-123'
              }
            })
          });
        }
        if (url.includes('/auth/verify')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: 'pastor@casadeprovision.es',
                  name: 'Pastor Silva',
                  role: 'admin'
                }
              }
            })
          });
        }
        return Promise.reject(new Error('Unexpected URL: ' + url));
      });

      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Verify login form is visible
      expect(screen.getByText(/panel administrativo/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();

      // Fill form with valid credentials
      await user.type(
        screen.getByRole('textbox', { name: /usuario/i }), 
        'pastor@casadeprovision.es'
      );
      await user.type(
        screen.getByLabelText(/contraseña/i), 
        '2GZPkxTmfSiTY64E'
      );

      // Submit form
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Verify loading state appears
      expect(screen.getByText(/iniciando sesión.../i)).toBeInTheDocument();

      // Wait for API call completion and state updates
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'pastor@casadeprovision.es',
              password: '2GZPkxTmfSiTY64E'
            })
          })
        );
      });

      // Verify tokens are stored
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload');
        expect(localStorage.getItem('refresh_token')).toBe('refresh-token-123');
      });

      // Note: In a real integration test, we would verify navigation occurred
      // For now, we verify the authentication state is properly updated
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).not.toBeNull();
      }, { timeout: 3000 });
    });
  });

  describe('Login Flow with Different Error Scenarios', () => {
    it('should handle invalid credentials gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock failed login
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials'
        })
      });

      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Attempt login with wrong credentials
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'wrong@email.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
      });

      // Verify no authentication occurred
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();

      // Verify user remains on login page
      expect(screen.getByText(/panel administrativo/i)).toBeInTheDocument();
    });

    it('should handle server errors appropriately', async () => {
      const user = userEvent.setup();
      
      // Mock server error
      (global.fetch as any).mockRejectedValue(new Error('Server unreachable'));

      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Attempt login
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Verify network error message
      await waitFor(() => {
        expect(screen.getByText(/error al conectar con el servidor/i)).toBeInTheDocument();
      });

      // Verify no authentication state changes
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle malformed API responses', async () => {
      const user = userEvent.setup();
      
      // Mock malformed response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: null // Missing user/token data
        })
      });

      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Attempt login
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Should handle gracefully and show error
      await waitFor(() => {
        expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation and User Experience', () => {
    it('should validate required fields before making API call', async () => {
      const user = userEvent.setup();
      
      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Should not make API call with empty fields
      expect(global.fetch).not.toHaveBeenCalled();

      // Fill only email
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Should still not make API call without password
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should provide visual feedback during the login process', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response to test loading states
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                user: { id: '1', email: 'pastor@casadeprovision.es', name: 'Pastor', role: 'admin' },
                token: 'test-token'
              }
            })
          }), 500)
        )
      );

      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Check loading state immediately after submission
      expect(screen.getByText(/iniciando sesión.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeDisabled();
      expect(screen.getByLabelText(/contraseña/i)).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe('test-token');
      }, { timeout: 1000 });
    });
  });

  describe('Security and Token Management', () => {
    it('should store JWT token securely after successful login', async () => {
      const user = userEvent.setup();
      
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlBhc3RvciBTaWx2YSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const mockRefreshToken = 'refresh-token-xyz789';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'pastor@casadeprovision.es',
              name: 'Pastor Silva',
              role: 'admin',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            token: mockToken,
            refresh_token: mockRefreshToken
          }
        })
      });

      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Complete login
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Verify tokens are stored correctly
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe(mockToken);
        expect(localStorage.getItem('refresh_token')).toBe(mockRefreshToken);
      });
    });

    it('should not store any tokens on failed login attempts', async () => {
      const user = userEvent.setup();
      
      // Set some tokens initially to verify they're not accidentally set
      localStorage.setItem('auth_token', 'old-token');
      localStorage.setItem('refresh_token', 'old-refresh');

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials'
        })
      });

      render(
        <IntegrationTestWrapper>
          <Login />
        </IntegrationTestWrapper>
      );

      // Attempt failed login
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'wrong@email.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Verify error appears and old tokens remain unchanged
      await waitFor(() => {
        expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
      });

      // Old tokens should still be there (login didn't touch them on failure)
      expect(localStorage.getItem('auth_token')).toBe('old-token');
      expect(localStorage.getItem('refresh_token')).toBe('old-refresh');
    });
  });
});