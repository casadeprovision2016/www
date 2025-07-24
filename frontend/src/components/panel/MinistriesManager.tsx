import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Users, Calendar, Loader2 } from 'lucide-react';
import { useMinistries, useCreateMinistry, useUpdateMinistry, useDeleteMinistry } from '@/hooks/useMinistries';

const MinistriesManager = () => {
  const { data: ministries, isLoading, error } = useMinistries();
  const createMinistryMutation = useCreateMinistry();
  const updateMinistryMutation = useUpdateMinistry();
  const deleteMinistryMutation = useDeleteMinistry();
  
  const [showForm, setShowForm] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: '',
    meetingDay: '',
    meetingTime: '',
    meetingLocation: '',
    status: 'active' as 'active' | 'inactive'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMinistry) {
      updateMinistryMutation.mutate({
        id: editingMinistry.id,
        ...formData
      }, {
        onSuccess: () => {
          setEditingMinistry(null);
          setShowForm(false);
          resetForm();
        }
      });
    } else {
      createMinistryMutation.mutate(formData, {
        onSuccess: () => {
          setShowForm(false);
          resetForm();
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      leaderId: '',
      meetingDay: '',
      meetingTime: '',
      meetingLocation: '',
      status: 'active'
    });
  };

  const handleEdit = (ministry: any) => {
    setEditingMinistry(ministry);
    setFormData({
      name: ministry.name,
      description: ministry.description,
      leaderId: ministry.leader_id || '',
      meetingDay: ministry.meetingDay || '',
      meetingTime: ministry.meetingTime || '',
      meetingLocation: ministry.meetingLocation || '',
      status: ministry.active ? 'active' : 'inactive'
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este ministerio?')) {
      deleteMinistryMutation.mutate(id);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando ministerios...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <p>Error al cargar ministerios: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Ministerios</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-church-gold hover:bg-church-gold-dark text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ministerio
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMinistry ? 'Editar Ministerio' : 'Nuevo Ministerio'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Ministerio</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingLocation">Lugar de Reunión</Label>
                  <Input
                    id="meetingLocation"
                    value={formData.meetingLocation}
                    onChange={(e) => setFormData({...formData, meetingLocation: e.target.value})}
                    placeholder="ej: Sala Principal"
                  />
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
                  <Label htmlFor="meetingDay">Día de Reunión</Label>
                  <select
                    id="meetingDay"
                    value={formData.meetingDay}
                    onChange={(e) => setFormData({...formData, meetingDay: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Seleccionar día</option>
                    <option value="lunes">Lunes</option>
                    <option value="martes">Martes</option>
                    <option value="miércoles">Miércoles</option>
                    <option value="jueves">Jueves</option>
                    <option value="viernes">Viernes</option>
                    <option value="sábado">Sábado</option>
                    <option value="domingo">Domingo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingTime">Hora</Label>
                  <Input
                    id="meetingTime"
                    type="time"
                    value={formData.meetingTime}
                    onChange={(e) => setFormData({...formData, meetingTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-church-gold hover:bg-church-gold-dark text-white">
                  {editingMinistry ? 'Actualizar' : 'Crear'} Ministerio
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingMinistry(null);
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
        {ministries.map((ministry) => (
          <Card key={ministry.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{ministry.name}</CardTitle>
                  <div className={`inline-block px-2 py-1 rounded text-xs text-white mt-2 ${
                    ministry.active ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {ministry.active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(ministry)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(ministry.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">{ministry.description}</p>
              
              <div className="space-y-2">
                {ministry.leader && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-church-gold" />
                    <span><strong>Líder:</strong> {ministry.leader.name}</span>
                  </div>
                )}
                
                {(ministry.meetingDay || ministry.meetingTime || ministry.meetingLocation) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-church-gold" />
                    <span>
                      {ministry.meetingDay && ministry.meetingTime 
                        ? `${ministry.meetingDay}s ${ministry.meetingTime}`
                        : ministry.meetingDay || ministry.meetingTime || ''}
                      {ministry.meetingLocation && ` - ${ministry.meetingLocation}`}
                    </span>
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  <strong>Miembros:</strong> {ministry.memberCount || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MinistriesManager;
