
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Star, Phone, Mail, Users } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  isHighlighted?: boolean;
  contact?: {
    name: string;
    phone?: string;
    email?: string;
  };
  registrationLink?: string;
}

interface WeeklyService {
  day: string;
  time: string;
  title: string;
  description: string;
  type: string;
}

const CalendarSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const weeklyServices: WeeklyService[] = [
    {
      day: 'Martes',
      time: '19:00',
      title: 'Culto de Oración y Enseñanza',
      description: 'Tiempo de oración comunitaria y estudio de la Palabra',
      type: 'oracion'
    },
    {
      day: 'Viernes',
      time: '19:30',
      title: 'Culto de Adoración',
      description: 'Servicio de adoración y alabanza',
      type: 'culto'
    },
    {
      day: 'Sábado',
      time: '18:00',
      title: 'Culto de Jóvenes',
      description: 'Reunión especial para jóvenes y adolescentes',
      type: 'jovenes'
    },
    {
      day: 'Domingo',
      time: '11:00',
      title: 'Escuela Bíblica Dominical y Culto Principal',
      description: 'Escuela dominical seguida del culto principal',
      type: 'culto'
    }
  ];

  useEffect(() => {
    // Cargar eventos del localStorage
    const storedEvents = localStorage.getItem('events');
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }
  }, []);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'culto': return 'bg-church-gold text-white';
      case 'estudio': return 'bg-church-blue text-white';
      case 'jovenes': return 'bg-green-600 text-white';
      case 'oracion': return 'bg-purple-600 text-white';
      case 'especial': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'culto': return 'Culto';
      case 'estudio': return 'Estudio Bíblico';
      case 'jovenes': return 'Jóvenes';
      case 'oracion': return 'Oración';
      case 'especial': return 'Evento Especial';
      default: return 'Evento';
    }
  };

  // Filtrar eventos del mes actual y futuro
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const highlightedEvents = upcomingEvents.filter(event => event.isHighlighted);

  // Obtener eventos de una fecha específica
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <section id="calendario" className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-church-blue-dark mb-3">
            Calendario de Actividades
          </h2>
          <p className="text-lg text-gray-600">
            Mantente al día con nuestras actividades y eventos programados
          </p>
        </div>

        {/* Servicios Semanales Fijos */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-church-blue-dark mb-4 text-center">
            Horarios de Servicios Regulares
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {weeklyServices.map((service, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getEventTypeColor(service.type)}`}>
                    {service.day}
                  </div>
                  <h4 className="font-semibold text-church-blue-dark mb-2 text-sm">
                    {service.title}
                  </h4>
                  <div className="flex items-center gap-2 text-church-gold mb-2">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium text-sm">{service.time}</span>
                  </div>
                  <p className="text-xs text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Eventos Destacados */}
        {highlightedEvents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-church-blue-dark mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-church-gold" />
              Eventos Destacados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlightedEvents.slice(0, 3).map((event) => (
                <Card key={event.id} className="bg-gradient-to-br from-church-gold/10 to-church-blue/10 hover:shadow-xl transition-all cursor-pointer border-2 border-church-gold/20" onClick={() => handleEventClick(event)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      <Star className="h-4 w-4 text-church-gold fill-current" />
                    </div>
                    <h4 className="text-sm font-semibold text-church-blue-dark mb-2">
                      {event.title}
                    </h4>
                    <p className="text-gray-600 mb-2 text-xs">{event.description}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-church-gold">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(new Date(event.date), 'EEEE, d MMMM yyyy', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-church-gold">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar View - Google Calendar Style */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-church-blue-dark text-2xl">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      className="hover:bg-church-gold hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      className="hover:bg-church-gold hover:text-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Calendar Grid */}
                <div className="border-t border-gray-200">
                  {/* Header with weekdays */}
                  <div className="grid grid-cols-7 border-b border-gray-200">
                    {weekDays.map((day) => (
                      <div key={day} className="p-4 text-center font-semibold text-church-blue-dark bg-gray-50">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar body */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, dayIndex) => {
                      const dayEvents = getEventsForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`
                            min-h-[120px] p-2 border-b border-r border-gray-200 
                            ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'}
                            ${isToday ? 'bg-church-gold/10' : ''}
                          `}
                        >
                          <div className={`
                            text-sm font-medium mb-2 
                            ${isToday ? 'bg-church-gold text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                          `}>
                            {format(day, 'd')}
                          </div>
                          
                          {/* Event bands */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className={`
                                  text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity
                                  ${getEventTypeColor(event.type)}
                                  ${event.isHighlighted ? 'ring-2 ring-church-gold ring-opacity-50' : ''}
                                `}
                              >
                                <div className="font-medium truncate">
                                  {event.time} - {event.title}
                                </div>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-500 font-medium">
                                +{dayEvents.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events List Sidebar */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-church-blue-dark">
              Próximos Eventos
            </h3>
            
            {upcomingEvents.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No hay eventos programados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingEvents.slice(0, 8).map((event) => (
                  <Card key={event.id} className="bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleEventClick(event)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                            {getEventTypeLabel(event.type)}
                          </Badge>
                          {event.isHighlighted && (
                            <Star className="h-3 w-3 text-church-gold fill-current" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-church-blue-dark mb-1">
                            {event.title}
                          </h4>
                          <p className="text-gray-600 mb-2 text-xs">{event.description}</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-3 w-3 text-church-gold" />
                              <span>{format(new Date(event.date), 'EEEE, d MMMM yyyy', { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-church-gold" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-church-gold" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Información de Contacto */}
            <Card className="bg-church-blue-dark text-white">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-church-gold" />
                  Contacto para Eventos
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-church-gold" />
                    <span>+593 (04) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-church-gold" />
                    <span>eventos@casadeprovision.org</span>
                  </div>
                </div>
                <p className="text-church-gold/80 text-xs mt-2">
                  ¿Tienes preguntas sobre algún evento? ¡Contáctanos!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Detail Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="max-w-md">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getEventTypeColor(selectedEvent.type)}>
                      {getEventTypeLabel(selectedEvent.type)}
                    </Badge>
                    {selectedEvent.isHighlighted && (
                      <Star className="h-4 w-4 text-church-gold fill-current" />
                    )}
                  </div>
                  <DialogTitle className="text-church-blue-dark">
                    {selectedEvent.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-600">{selectedEvent.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-church-gold" />
                      <span>{format(new Date(selectedEvent.date), 'EEEE, d MMMM yyyy', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-church-gold" />
                      <span>{selectedEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-church-gold" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  </div>

                  {selectedEvent.contact && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold text-church-blue-dark mb-2">Contacto</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-church-gold" />
                          <span>{selectedEvent.contact.name}</span>
                        </div>
                        {selectedEvent.contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-church-gold" />
                            <span>{selectedEvent.contact.phone}</span>
                          </div>
                        )}
                        {selectedEvent.contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-church-gold" />
                            <span>{selectedEvent.contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.registrationLink && (
                    <div className="border-t pt-4">
                      <Button 
                        className="w-full bg-church-gold hover:bg-church-gold-dark text-white"
                        onClick={() => window.open(selectedEvent.registrationLink, '_blank')}
                      >
                        Registrarse para el Evento
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default CalendarSection;
