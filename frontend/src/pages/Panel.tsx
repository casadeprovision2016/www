
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Calendar, Users, Settings, Home, Video, DollarSign, UserPlus, User, Loader2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboard';
import EventsManager from '@/components/panel/EventsManager';
import MembersManager from '@/components/panel/MembersManager';
import MinistriesManager from '@/components/panel/MinistriesManager';
import StreamsManager from '@/components/panel/StreamsManager';
import DonationsManager from '@/components/panel/DonationsManager';
import VisitorsManager from '@/components/panel/VisitorsManager';
import PastoralVisitsManager from '@/components/panel/PastoralVisitsManager';
import BirthdaysList from '@/components/panel/BirthdaysList';

const Panel = () => {
  const { user, logout, isAuthenticated, canAccess, isAdmin, isLeader } = useAuth();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Filtrar seções baseado nas permissões do usuário
  const allSections = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, resource: 'dashboard' },
    { id: 'events', name: 'Eventos', icon: Calendar, resource: 'events' },
    { id: 'streams', name: 'Transmisiones', icon: Video, resource: 'streams' },
    { id: 'donations', name: 'Donaciones', icon: DollarSign, resource: 'donations' },
    { id: 'members', name: 'Miembros', icon: Users, resource: 'members' },
    { id: 'visitors', name: 'Visitantes', icon: UserPlus, resource: 'visitors' },
    { id: 'pastoral-visits', name: 'Visitas Pastorales', icon: User, resource: 'pastoral-visits' },
    { id: 'ministries', name: 'Ministerios', icon: Settings, resource: 'ministries' },
  ];

  const sections = allSections.filter(section => canAccess(section.resource));

  const renderContent = () => {
    // Verificar permissão antes de renderizar o componente
    if (!canAccess(activeSection)) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Acesso Negado</h3>
            <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'events':
        return canAccess('events') ? <EventsManager /> : null;
      case 'streams':
        return canAccess('streams') ? <StreamsManager /> : null;
      case 'donations':
        return canAccess('donations') ? <DonationsManager /> : null;
      case 'members':
        return canAccess('members') ? <MembersManager /> : null;
      case 'visitors':
        return canAccess('visitors') ? <VisitorsManager /> : null;
      case 'pastoral-visits':
        return canAccess('pastoral-visits') ? <PastoralVisitsManager /> : null;
      case 'ministries':
        return canAccess('ministries') ? <MinistriesManager /> : null;
      default:
        return (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-church-gold" />
                <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-church-blue-dark">Eventos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-church-gold">
                      {dashboardStats?.events.thisMonth || 0}
                    </p>
                    <p className="text-gray-600">Eventos este mes</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboardStats?.events.upcoming || 0} próximos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-church-blue-dark">Miembros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-church-gold">
                      {dashboardStats?.members.total || 0}
                    </p>
                    <p className="text-gray-600">Miembros registrados</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboardStats?.members.active || 0} activos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-church-blue-dark">Visitantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-church-gold">
                      {dashboardStats?.visitors.thisMonth || 0}
                    </p>
                    <p className="text-gray-600">Visitantes este mes</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboardStats?.visitors.thisWeek || 0} esta semana
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            <BirthdaysList />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/e0c5fe70-273d-4e8b-9066-e25340499af4.png" 
                alt="Centro Cristiano Casa de Provisión" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-semibold text-church-blue-dark">
                Panel Administrativo
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-gray-700 block">
                  Bienvenido, {user?.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  isAdmin ? 'bg-red-100 text-red-800' :
                  isLeader ? 'bg-blue-100 text-blue-800' :
                  user?.role === 'member' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user?.role === 'admin' ? 'Administrador' :
                   user?.role === 'leader' ? 'Líder' :
                   user?.role === 'member' ? 'Miembro' :
                   'Visitante'}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    activeSection === section.id 
                      ? 'bg-church-gold text-white hover:bg-church-gold-dark' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <section.icon className="h-4 w-4 mr-2" />
                  {section.name}
                </Button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panel;
