import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Calendar, Star, Phone, Mail, Users } from 'lucide-react';

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

const EventsManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'culto',
    isHighlighted: false,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    registrationLink: ''
  });

  useEffect(() => {
    // Cargar eventos del localStorage
    const storedEvents = localStorage.getItem('events');
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      // Eventos de ejemplo
      const exampleEvents: Event[] = [
        {
          id: '1',
          title: 'Culto Dominical',
          description: 'Servicio dominical de adoración',
          date: '2024-01-07',
          time: '09:00',
          location: 'Santuario Principal',
          type: 'culto',
          isHighlighted: true,
          contact: {
            name: 'Pastor Juan',
            phone: '+593 99 123 4567',
            email: 'pastor@casadeprovision.org'
          }
        },
        {
          id: '2',
          title: 'Estudio Bíblico',
          description: 'Estudio de la Palabra',
          date: '2024-01-10',
          time: '19:30',
          location: 'Sala de Conferencias',
          type: 'estudio'
        }
      ];
      setEvents(exampleEvents);
      localStorage.setItem('events', JSON.stringify(exampleEvents));
    }
  }, []);

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem('events', JSON.stringify(newEvents));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: Event = {
      id: editingEvent?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      type: formData.type,
      isHighlighted: formData.isHighlighted,
      ...(formData.contactName && {
        contact: {
          name: formData.contactName,
          ...(formData.contactPhone && { phone: formData.contactPhone }),
          ...(formData.contactEmail && { email: formData.contactEmail })
        }
      }),
      ...(formData.registrationLink && { registrationLink: formData.registrationLink })
    };
    
    if (editingEvent) {
      // Editar evento existente
      const updatedEvents = events.map(event => 
        event.id === editingEvent.id ? eventData : event
      );
      saveEvents(updatedEvents);
      setEditingEvent(null);
    } else {
      // Crear nuevo evento
      saveEvents([...events, eventData]);
    }

    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      type: 'culto',
      isHighlighted: false,
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      registrationLink: ''
    });
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      type: event.type,
      isHighlighted: event.isHighlighted || false,
      contactName: event.contact?.name || '',
      contactPhone: event.contact?.phone || '',
      contactEmail: event.contact?.email || '',
      registrationLink: event.registrationLink || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      const updatedEvents = events.filter(event => event.id !== id);
      saveEvents(updatedEvents);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'culto': return 'bg-church-gold';
      case 'estudio': return 'bg-church-blue';
      case 'jovenes': return 'bg-green-600';
      case 'oracion': return 'bg-purple-600';
      case 'especial': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Eventos</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-church-gold hover:bg-church-gold-dark text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="culto">Culto</option>
                    <option value="estudio">Estudio Bíblico</option>
                    <option value="jovenes">Reunión de Jóvenes</option>
                    <option value="oracion">Oración</option>
                    <option value="especial">Evento Especial</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="highlighted"
                  checked={formData.isHighlighted}
                  onCheckedChange={(checked) => setFormData({...formData, isHighlighted: checked})}
                />
                <Label htmlFor="highlighted" className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-church-gold" />
                  Evento Destacado
                </Label>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Información de Contacto (Opcional)
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nombre del Contacto</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      placeholder="Ej: Pastor Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Teléfono</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      placeholder="Ej: +593 99 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      placeholder="Ej: pastor@iglesia.org"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationLink">Enlace de Registro (Opcional)</Label>
                <Input
                  id="registrationLink"
                  type="url"
                  value={formData.registrationLink}
                  onChange={(e) => setFormData({...formData, registrationLink: e.target.value})}
                  placeholder="https://ejemplo.com/registro"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-church-gold hover:bg-church-gold-dark text-white">
                  {editingEvent ? 'Actualizar' : 'Crear'} Evento
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card key={event.id} className={event.isHighlighted ? 'ring-2 ring-church-gold' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`inline-block px-2 py-1 rounded text-xs text-white ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </div>
                    {event.isHighlighted && (
                      <Star className="h-4 w-4 text-church-gold fill-current" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">{event.description}</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-church-gold" />
                  <span>{event.date} - {event.time}</span>
                </div>
                <div className="text-gray-600">{event.location}</div>
                {event.contact && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{event.contact.name}</span>
                    </div>
                  </div>
                )}
                {event.registrationLink && (
                  <div className="text-xs text-church-gold">
                    📝 Registro disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventsManager;
