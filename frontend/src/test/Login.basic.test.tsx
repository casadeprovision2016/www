import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should successfully login with valid credentials pastor@casadeprovision / 2GZPkxTmfSiTY64E', async () => {
    // Mock successful API response
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
          token: 'mock-jwt-token',
          refresh_token: 'mock-refresh-token'
        }
      })
    });

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Wait for loading to finish and form to appear
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();
    });

    // Fill the form with valid credentials
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
    await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verify API call was made with correct credentials
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

    // Verify tokens are stored
    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
    });

    // Verify navigation to panel
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/panel');
    });
  });

  it('should show error message for invalid credentials', async () => {
    // Mock failed API response
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: 'Invalid credentials'
      })
    });

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();
    });

    // Fill with invalid credentials
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'invalid@email.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
    });

    // Verify no tokens stored
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();

    // Verify no navigation occurred
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();
    });

    // Fill and submit form
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
    await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verify network error message appears
    await waitFor(() => {
      expect(screen.getByText(/error al conectar con el servidor/i)).toBeInTheDocument();
    });
  });

  it('should update authentication state after successful login', async () => {
    // Mock successful API response
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
          token: 'mock-jwt-token'
        }
      })
    });

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Wait for form to appear (initial state)
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();
    });

    // Complete login
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
    await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verify authentication state updated (navigation occurs)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/panel');
    });
  });

  it('should redirect to panel after successful login', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'pastor@casadeprovision.es',
            name: 'Pastor',
            role: 'admin'
          },
          token: 'mock-jwt-token'
        }
      })
    });

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Wait for form
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();
    });

    // Complete login flow
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
    await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verify redirect to /panel
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/panel');
    });
  });
});