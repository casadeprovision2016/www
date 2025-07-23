
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Calendar, Users, Settings, Home, Video, DollarSign, UserPlus, User } from 'lucide-react';
import EventsManager from '@/components/panel/EventsManager';
import MembersManager from '@/components/panel/MembersManager';
import MinistriesManager from '@/components/panel/MinistriesManager';
import StreamsManager from '@/components/panel/StreamsManager';
import DonationsManager from '@/components/panel/DonationsManager';
import VisitorsManager from '@/components/panel/VisitorsManager';
import PastoralVisitsManager from '@/components/panel/PastoralVisitsManager';
import BirthdaysList from '@/components/panel/BirthdaysList';

const Panel = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const sections = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'events', name: 'Eventos', icon: Calendar },
    { id: 'streams', name: 'Transmisiones', icon: Video },
    { id: 'donations', name: 'Donaciones', icon: DollarSign },
    { id: 'members', name: 'Miembros', icon: Users },
    { id: 'visitors', name: 'Visitantes', icon: UserPlus },
    { id: 'pastoral-visits', name: 'Visitas Pastorales', icon: User },
    { id: 'ministries', name: 'Ministerios', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'events':
        return <EventsManager />;
      case 'streams':
        return <StreamsManager />;
      case 'donations':
        return <DonationsManager />;
      case 'members':
        return <MembersManager />;
      case 'visitors':
        return <VisitorsManager />;
      case 'pastoral-visits':
        return <PastoralVisitsManager />;
      case 'ministries':
        return <MinistriesManager />;
      default:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-church-blue-dark">Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-church-gold">12</p>
                  <p className="text-gray-600">Eventos este mes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-church-blue-dark">Miembros</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-church-gold">158</p>
                  <p className="text-gray-600">Miembros registrados</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-church-blue-dark">Visitantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-church-gold">24</p>
                  <p className="text-gray-600">Visitantes este mes</p>
                </CardContent>
              </Card>
            </div>
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
              <span className="text-gray-700">
                Bienvenido, {user?.name} ({user?.role})
              </span>
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
