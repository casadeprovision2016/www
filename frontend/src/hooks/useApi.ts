import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async <T = any>(
    endpoint: string,
    options: UseApiOptions = {}
  ): Promise<ApiResponse<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      const config: RequestInit = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        }
      };

      if (options.body && options.method !== 'GET') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Se o token expirou, tentar renovar
        if (response.status === 401 && token) {
          const refreshToken = localStorage.getItem('refresh_token');
          
          if (refreshToken) {
            try {
              const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('auth_token', refreshData.data.token);
                
                if (refreshData.data.refresh_token) {
                  localStorage.setItem('refresh_token', refreshData.data.refresh_token);
                }

                // Repetir a requisição original com novo token
                config.headers = {
                  ...config.headers,
                  'Authorization': `Bearer ${refreshData.data.token}`
                };

                const retryResponse = await fetch(`${API_URL}${endpoint}`, config);
                const retryData = await retryResponse.json();

                setLoading(false);
                return retryData;
              } else {
                // Refresh token também expirou, redirecionar para login
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return null;
              }
            } catch (refreshError) {
              console.error('Erro ao renovar token:', refreshError);
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
              return null;
            }
          }
        }

        setError(data.error || `Erro HTTP: ${response.status}`);
        setLoading(false);
        return data;
      }

      setLoading(false);
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  // Métodos de conveniência
  const get = useCallback(<T = any>(endpoint: string, headers?: Record<string, string>) =>
    makeRequest<T>(endpoint, { method: 'GET', headers }), [makeRequest]);

  const post = useCallback(<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    makeRequest<T>(endpoint, { method: 'POST', body, headers }), [makeRequest]);

  const put = useCallback(<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    makeRequest<T>(endpoint, { method: 'PUT', body, headers }), [makeRequest]);

  const del = useCallback(<T = any>(endpoint: string, headers?: Record<string, string>) =>
    makeRequest<T>(endpoint, { method: 'DELETE', headers }), [makeRequest]);

  return {
    loading,
    error,
    makeRequest,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null)
  };
};

export default useApi;