
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  telefone?: string;
  role: 'admin' | 'leader' | 'member' | 'visitor';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasRole: (role: string | string[]) => boolean;
  canAccess: (resource: string) => boolean;
  isAdmin: boolean;
  isLeader: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user) {
              setUser(data.data.user);
            } else {
              // Token inválido, limpar storage
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
            }
          } else {
            // Token expirado ou inválido
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
          }
        } catch (error) {
          console.error('Erro ao verificar token:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { user: userData, token, refresh_token } = data.data;
        
        setUser(userData);
        localStorage.setItem('auth_token', token);
        
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
        
        return true;
      } else {
        console.error('Erro no login:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Tentar fazer logout no servidor
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // Sempre limpar dados locais
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  };

  // Função para verificar se o usuário tem um ou mais roles específicos
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  // Função para verificar se o usuário pode acessar um recurso específico
  const canAccess = (resource: string): boolean => {
    if (!user) return false;

    // Definir permissões por role
    const permissions = {
      admin: ['dashboard', 'events', 'members', 'donations', 'streams', 'ministries', 'visitors', 'pastoral-visits', 'settings'],
      leader: ['dashboard', 'events', 'members', 'streams', 'ministries', 'visitors', 'pastoral-visits'],
      member: ['dashboard', 'events'],
      visitor: ['dashboard']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(resource);
  };

  // Computar propriedades derivadas
  const isAdmin = user?.role === 'admin';
  const isLeader = user?.role === 'leader' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading,
      hasRole,
      canAccess,
      isAdmin,
      isLeader
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
