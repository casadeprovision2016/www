import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, UserPlus, Phone, Mail, Loader2 } from 'lucide-react';
import { useVisitors, useCreateVisitor, useUpdateVisitor, useDeleteVisitor } from '@/hooks/useVisitors';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';

const VisitorsManager = () => {
  const { data: visitors, isLoading, error, refetch } = useVisitors();
  const createVisitorMutation = useCreateVisitor();
  const updateVisitorMutation = useUpdateVisitor();
  const deleteVisitorMutation = useDeleteVisitor();

  const [showForm, setShowForm] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    visitDate: '',
    source: 'walk_in',
    notes: '',
    followUpDate: '',
    interestedInMembership: false,
  });

  const { confirm } = useDeleteConfirmation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVisitor) {
        await updateVisitorMutation.mutateAsync({ id: editingVisitor.id, ...formData });
      } else {
        await createVisitorMutation.mutateAsync(formData);
      }
      setShowForm(false);
      setEditingVisitor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        visitDate: '',
        source: 'walk_in',
        notes: '',
        followUpDate: '',
        interestedInMembership: false,
      });
      refetch();
    } catch (err) {
      console.error('Error saving visitor:', err);
    }
  };

  const handleEdit = (visitor: any) => {
    setEditingVisitor(visitor);
    setFormData({
      name: visitor.name,
      email: visitor.email || '',
      phone: visitor.phone || '',
      visitDate: visitor.visitDate,
      source: visitor.source,
      notes: visitor.notes || '',
      followUpDate: visitor.followUpDate || '',
      interestedInMembership: visitor.interestedInMembership,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm('¿Estás seguro de que quieres eliminar este visitante?');
    if (confirmed) {
      try {
        await deleteVisitorMutation.mutateAsync(id);
        refetch();
      } catch (err) {
        console.error('Error deleting visitor:', err);
      }
    }
  };

  const filteredVisitors = visitors?.filter(visitor =>
    visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-church-gold" />
        <span className="ml-2 text-gray-600">Cargando visitantes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Visitantes</h2>
          <Button onClick={() => refetch()} variant="outline">
            Reintentar
          </Button>
        </div>
        <div className="text-center py-8 text-red-600">
          Error al cargar visitantes: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Visitantes</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar visitantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button
            onClick={() => setShowForm(true)}
            className="bg-church-gold hover:bg-church-gold-dark text-white whitespace-nowrap"
            disabled={createVisitorMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Visitante
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingVisitor ? 'Editar Visitante' : 'Nuevo Visitante'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Fecha de Visita</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Fuente</Label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="invitation">Invitación</option>
                  <option value="social_media">Redes Sociales</option>
                  <option value="walk_in">Visita Espontánea</option>
                  <option value="website">Sitio Web</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Información adicional sobre el visitante..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Fecha de Seguimiento</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="interestedInMembership"
                    checked={formData.interestedInMembership}
                    onChange={(e) => setFormData({...formData, interestedInMembership: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="interestedInMembership">Interesado en Membresía</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-church-gold hover:bg-church-gold-dark text-white"
                  disabled={createVisitorMutation.isPending || updateVisitorMutation.isPending}
                >
                  {(createVisitorMutation.isPending || updateVisitorMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingVisitor ? 'Actualizar' : 'Registrar'} Visitante
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingVisitor(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      visitDate: '',
                      source: 'walk_in',
                      notes: '',
                      followUpDate: '',
                      interestedInMembership: false,
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
        {filteredVisitors.map((visitor) => (
          <Card key={visitor.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-church-gold" />
                    {visitor.name}
                  </CardTitle>
                  <div className={`inline-block px-2 py-1 rounded text-xs text-white mt-2 ${
                    visitor.followUpStatus === 'contacted' ? 'bg-green-600' : 'bg-yellow-600'
                  }`}>
                    {visitor.followUpStatus === 'contacted' ? 'Contactado' : 'Pendiente contacto'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(visitor)}
                    disabled={deleteVisitorMutation.isPending}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(visitor.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={deleteVisitorMutation.isPending}
                  >
                    {deleteVisitorMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Fecha de visita:</strong> {visitor.visitDate}
              </div>
              <div className="text-sm">
                <strong>Fuente:</strong> {visitor.source}
              </div>
              {visitor.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-church-gold" />
                  <span className="truncate">{visitor.email}</span>
                </div>
              )}
              {visitor.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-church-gold" />
                  <span>{visitor.phone}</span>
                </div>
              )}
              {visitor.followUpDate && (
                <div className="text-sm text-gray-600">
                  <strong>Seguimiento:</strong> {visitor.followUpDate}
                </div>
              )}
              {visitor.notes && (
                <div className="text-sm text-gray-600">
                  <strong>Notas:</strong> {visitor.notes}
                </div>
              )}
              {visitor.interestedInMembership && (
                <div className="text-sm text-church-blue-dark">
                  <strong>Interesado en Membresía:</strong> Sí
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVisitors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron visitantes que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
};

export default VisitorsManager;