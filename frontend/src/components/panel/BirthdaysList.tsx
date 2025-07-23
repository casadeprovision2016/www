
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Loader2 } from 'lucide-react';
import { useUpcomingBirthdays } from '@/hooks/useDashboard';

const BirthdaysList = () => {
  const { data: upcomingBirthdays = [], isLoading, error } = useUpcomingBirthdays();

  const formatBirthday = (birthDate: string) => {
    const date = new Date(birthDate);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'long' });
    return `${day} de ${month}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-church-gold" />
            Cumpleaños de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-church-gold" />
            <span className="ml-2 text-gray-600">Cargando cumpleaños...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-church-gold" />
            Cumpleaños de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error al cargar cumpleaños: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (upcomingBirthdays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-church-gold" />
            Cumpleaños de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No hay cumpleaños esta semana.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-church-gold" />
          Cumpleaños de la Semana ({upcomingBirthdays.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingBirthdays.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-8 w-8 text-church-gold" />
              <div className="flex-1">
                <h4 className="font-medium text-church-blue-dark">{member.name}</h4>
                <p className="text-sm text-gray-600">{formatBirthday(member.birthDate)}</p>
                {member.ministry && (
                  <p className="text-xs text-gray-500">{member.ministry}</p>
                )}
              </div>
              {member.phone && (
                <div className="text-sm text-gray-600">
                  📞 {member.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BirthdaysList;
