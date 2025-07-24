import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Video, ExternalLink, Loader2 } from 'lucide-react';
import { useStreams, useCreateStream, useUpdateStream, useDeleteStream } from '@/hooks/useStreams';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';

const StreamsManager = () => {
  const { data: streams = [], isLoading, error, refetch } = useStreams();
  const createStreamMutation = useCreateStream();
  const updateStreamMutation = useUpdateStream();
  const deleteStreamMutation = useDeleteStream();
  
  const [showForm, setShowForm] = useState(false);
  const [editingStream, setEditingStream] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    streamUrl: '',
    scheduledDate: '',
    scheduledTime: '',
    platform: 'youtube' as 'youtube' | 'facebook' | 'instagram' | 'zoom' | 'custom'
  });

  const { confirm } = useDeleteConfirmation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStream) {
      updateStreamMutation.mutate({
        id: editingStream.id,
        ...formData
      }, {
        onSuccess: () => {
          setEditingStream(null);
          setShowForm(false);
          resetForm();
          refetch(); // Adicionado para atualizar a lista
        }
      });
    } else {
      createStreamMutation.mutate(formData, {
        onSuccess: () => {
          setShowForm(false);
          resetForm();
          refetch(); // Adicionado para atualizar a lista
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      streamUrl: '',
      scheduledDate: '',
      scheduledTime: '',
      platform: 'youtube'
    });
  };

  const handleEdit = (stream: any) => {
    setEditingStream(stream);
    setFormData({
      title: stream.title,
      description: stream.description,
      streamUrl: stream.streamUrl,
      scheduledDate: stream.scheduledDate || '',
      scheduledTime: stream.scheduledTime || '',
      platform: stream.platform || 'youtube'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm('¿Estás seguro de que quieres eliminar esta transmisión?');
    if (confirmed) {
      deleteStreamMutation.mutate(id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando transmisiones...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <p>Error al cargar transmisiones: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Transmisiones</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-church-gold hover:bg-church-gold-dark text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Transmisión
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingStream ? 'Editar Transmisión' : 'Nueva Transmisión'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="platform">Plataforma</Label>
                  <select
                    id="platform"
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="zoom">Zoom</option>
                    <option value="custom">Personalizado</option>
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

              <div className="space-y-2">
                <Label htmlFor="streamUrl">URL de la Transmisión</Label>
                <Input
                  id="streamUrl"
                  type="url"
                  value={formData.streamUrl}
                  onChange={(e) => setFormData({...formData, streamUrl: e.target.value})}
                  placeholder="https://youtube.com/live/..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Fecha</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Hora</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-church-gold hover:bg-church-gold-dark text-white">
                  {editingStream ? 'Actualizar' : 'Crear'} Transmisión
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingStream(null);
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
        {streams.map((stream) => (
          <Card key={stream.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{stream.title}</CardTitle>
                  <div className={`inline-block px-2 py-1 rounded text-xs text-white mt-2 ${
                    stream.status === 'live' ? 'bg-red-600' : 
                    stream.status === 'scheduled' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {stream.status === 'live' ? 'En Vivo' : 
                     stream.status === 'scheduled' ? 'Programado' : 'Finalizado'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(stream)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(stream.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">{stream.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-church-gold" />
                  <span>Plataforma: {stream.platform || 'YouTube'}</span>
                </div>
                
                {stream.startDate && (
                  <div className="text-sm">
                    <strong>Fecha:</strong> {new Date(stream.startDate).toLocaleDateString('es-ES')}
                  </div>
                )}
                
                {stream.views !== undefined && (
                  <div className="text-sm text-gray-600">
                    <strong>Visualizaciones:</strong> {stream.views}
                  </div>
                )}
              </div>

              {stream.streamUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(stream.streamUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Transmisión
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StreamsManager;