
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Video, ExternalLink } from 'lucide-react';

interface Stream {
  id: string;
  title: string;
  description: string;
  url: string;
  isLive: boolean;
  thumbnail?: string;
  date: string;
}

const StreamsManager = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    isLive: false,
    thumbnail: '',
    date: ''
  });

  useEffect(() => {
    const storedStreams = localStorage.getItem('streams');
    if (storedStreams) {
      setStreams(JSON.parse(storedStreams));
    } else {
      const exampleStreams: Stream[] = [
        {
          id: '1',
          title: 'Culto Dominical en Vivo',
          description: 'Transmisión en vivo del culto dominical',
          url: 'https://www.youtube.com/channel/UCiZGj9wHkU6X4XBjZZ5VoFg',
          isLive: true,
          date: new Date().toISOString().split('T')[0]
        }
      ];
      setStreams(exampleStreams);
      localStorage.setItem('streams', JSON.stringify(exampleStreams));
    }
  }, []);

  const saveStreams = (newStreams: Stream[]) => {
    setStreams(newStreams);
    localStorage.setItem('streams', JSON.stringify(newStreams));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStream) {
      const updatedStreams = streams.map(stream => 
        stream.id === editingStream.id 
          ? { ...editingStream, ...formData }
          : stream
      );
      saveStreams(updatedStreams);
      setEditingStream(null);
    } else {
      const newStream: Stream = {
        id: Date.now().toString(),
        ...formData
      };
      saveStreams([...streams, newStream]);
    }

    setFormData({
      title: '',
      description: '',
      url: '',
      isLive: false,
      thumbnail: '',
      date: ''
    });
    setShowForm(false);
  };

  const handleEdit = (stream: Stream) => {
    setEditingStream(stream);
    setFormData({
      title: stream.title,
      description: stream.description,
      url: stream.url,
      isLive: stream.isLive,
      thumbnail: stream.thumbnail || '',
      date: stream.date
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transmisión?')) {
      const updatedStreams = streams.filter(stream => stream.id !== id);
      saveStreams(updatedStreams);
    }
  };

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
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
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

              <div className="space-y-2">
                <Label htmlFor="url">URL de Transmisión</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://youtube.com/..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">URL de Miniatura (opcional)</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isLive"
                  checked={formData.isLive}
                  onChange={(e) => setFormData({...formData, isLive: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="isLive">Transmisión en vivo</Label>
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
                    setFormData({
                      title: '',
                      description: '',
                      url: '',
                      isLive: false,
                      thumbnail: '',
                      date: ''
                    });
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5 text-church-gold" />
                    {stream.title}
                  </CardTitle>
                  {stream.isLive && (
                    <div className="inline-block px-2 py-1 rounded text-xs text-white mt-2 bg-red-600">
                      EN VIVO
                    </div>
                  )}
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
            <CardContent className="space-y-2">
              <p className="text-gray-600 text-sm">{stream.description}</p>
              <div className="text-sm text-gray-600">{stream.date}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(stream.url, '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Transmisión
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StreamsManager;
