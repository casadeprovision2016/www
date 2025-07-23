import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Calendar, Star, Phone, Mail, Users, Loader2 } from 'lucide-react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, CreateEventData } from '@/hooks/useEvents';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';

// Using the Event interface from the hooks

const EventsManager = () => {
  // React Query hooks
  const { data: events = [], isLoading, error, refetch } = useEvents();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'culto',
    capacity: undefined as number | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: CreateEventData = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      category: formData.category,
      capacity: formData.capacity,
    };
    
    try {
      if (editingEvent) {
        await updateEventMutation.mutateAsync({ id: editingEvent.id, ...eventData });
        setEditingEvent(null);
      } else {
        await createEventMutation.mutateAsync(eventData);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: 'culto',
      capacity: undefined,
    });
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      capacity: event.capacity,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await deleteEventMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const getEventTypeColor = (category: string) => {
    switch (category) {
      case 'culto': return 'bg-church-gold';
      case 'estudio': return 'bg-church-blue';
      case 'jovenes': return 'bg-green-600';
      case 'oracion': return 'bg-purple-600';
      case 'especial': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-church-gold" />
        <span className="ml-2 text-gray-600">Cargando eventos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Eventos</h2>
          <Button onClick={() => refetch()} variant="outline">
            Reintentar
          </Button>
        </div>
        <div className="text-center py-8 text-red-600">
          Error al cargar eventos: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Eventos</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-church-gold hover:bg-church-gold-dark text-white"
          disabled={createEventMutation.isPending}
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
                  <Label htmlFor="category">Categoría</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
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

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidad (Opcional)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Ej: 50"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-church-gold hover:bg-church-gold-dark text-white"
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                >
                  {(createEventMutation.isPending || updateEventMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
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
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
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
          <Card key={event.id} className={event.status === 'scheduled' ? 'ring-2 ring-church-gold' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`inline-block px-2 py-1 rounded text-xs text-white ${getEventTypeColor(event.category)}`}>
                      {event.category}
                    </div>
                    <div className={`inline-block px-2 py-1 rounded text-xs ${
                      event.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                      event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.status === 'scheduled' ? 'Programado' : 
                       event.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(event)}
                    disabled={deleteEventMutation.isPending}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={deleteEventMutation.isPending}
                  >
                    {deleteEventMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
                {event.capacity && (
                  <div className="text-xs text-church-blue-dark">
                    <Users className="h-3 w-3 inline mr-1" />
                    Capacidad: {event.capacity} personas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay eventos registrados.
        </div>
      )}
    </div>
  );
};

export default EventsManager;
