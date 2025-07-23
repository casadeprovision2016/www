import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string | string[];
  requireResource?: string;
  fallbackPath?: string;
  showAlert?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRole,
  requireResource,
  fallbackPath = '/login',
  showAlert = true
}) => {
  const { isAuthenticated, hasRole, canAccess, loading } = useAuth();

  // Aguardar carregamento da autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-church-gold"></div>
      </div>
    );
  }

  // Verificar se está autenticado
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar role se especificado
  if (requireRole && !hasRole(requireRole)) {
    if (showAlert) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Você não tem permissão para acessar esta página. Role necessário: {Array.isArray(requireRole) ? requireRole.join(', ') : requireRole}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return <Navigate to="/panel" replace />;
  }

  // Verificar recurso se especificado
  if (requireResource && !canAccess(requireResource)) {
    if (showAlert) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Você não tem permissão para acessar este recurso: {requireResource}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return <Navigate to="/panel" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;