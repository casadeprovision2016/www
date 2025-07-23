import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
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

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock successful API responses by default
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
  });

  describe('Login with Valid Credentials', () => {
    it('should successfully log in with pastor@casadeprovision credentials', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Check that login form is rendered
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();

      // Fill in the form with valid credentials
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Wait for the API call to be made
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

      // Check that tokens are stored in localStorage
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');
        expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
      });

      // Check that navigation to panel occurred
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/panel');
      });
    });

    it('should show loading state during login process', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed API response
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                user: { id: '1', email: 'pastor@casadeprovision.es', name: 'Pastor', role: 'admin' },
                token: 'mock-jwt-token'
              }
            })
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill form and submit
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Check loading state
      expect(screen.getByText(/iniciando sesión.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciando sesión.../i })).toBeDisabled();
    });
  });

  describe('Login with Invalid Credentials', () => {
    it('should show error message for invalid credentials', async () => {
      const user = userEvent.setup();
      
      // Mock failed API response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials'
        })
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in form with invalid credentials
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'invalid@email.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
      });

      // Check that no tokens are stored
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();

      // Check that navigation did not occur
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show network error message when API is unreachable', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/error al conectar con el servidor/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication State Updates', () => {
    it('should update authentication state correctly after successful login', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Verify initial state (login form is visible)
      expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument();

      // Login
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Wait for authentication state to update and redirect
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/panel');
      });
    });
  });

  describe('Form Validation and UI', () => {
    it('should require email and password fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByRole('textbox', { name: /usuario/i });
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();

      // Try to submit without filling fields
      await user.click(submitButton);

      // Form should not submit (HTML5 validation will prevent it)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/contraseña/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button has no accessible name

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      await user.click(toggleButton);

      // Password should now be visible
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle button again
      await user.click(toggleButton);

      // Password should be hidden again
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should disable form inputs during submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      let resolvePromise: any;
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByRole('textbox', { name: /usuario/i });
      const passwordInput = screen.getByLabelText(/contraseña/i );
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn !== submitButton);

      // Fill and submit form
      await user.type(emailInput, 'pastor@casadeprovision.es');
      await user.type(passwordInput, '2GZPkxTmfSiTY64E');
      await user.click(submitButton);

      // Check loading state appears
      expect(screen.getByText(/iniciando sesión.../i)).toBeInTheDocument();
      
      // During submission, all inputs should be disabled
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      if (toggleButton) {
        expect(toggleButton).toBeDisabled();
      }

      // Resolve the promise to complete the test
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { user: {}, token: 'token' } })
      });
    });
  });

  describe('Redirect to Panel', () => {
    it('should redirect to /panel after successful login', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Complete login flow
      await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'pastor@casadeprovision.es');
      await user.type(screen.getByLabelText(/contraseña/i), '2GZPkxTmfSiTY64E');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Verify redirect
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/panel');
      });
    });
  });
});