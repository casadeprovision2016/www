
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Mostrar loading enquanto verifica autenticação inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-church-blue-light via-church-cream to-church-gold-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-church-blue-dark" />
          <p className="text-church-blue-dark">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/panel" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/panel');
      } else {
        setError('Usuario o contraseña incorrectos. Verifica tus credenciales.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-blue-light via-church-cream to-church-gold-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/e0c5fe70-273d-4e8b-9066-e25340499af4.png" 
                alt="Centro Cristiano Casa de Provisión" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-church-blue-dark">
              Panel Administrativo
            </CardTitle>
            <p className="text-gray-600">Ingresa a tu cuenta para continuar</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Usuario</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-church-gold hover:bg-church-gold-dark text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Sistema integrado con API backend</p>
              <p className="text-xs text-gray-500">
                Conectando con Supabase + Node.js
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
