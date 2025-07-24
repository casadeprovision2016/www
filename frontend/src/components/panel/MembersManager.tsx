import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, User, Phone, Mail, Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { 
  useMembers, 
  useCreateMember, 
  useUpdateMember, 
  useDeleteMember, 
  useAttendance, 
  useCreateAttendance, 
  useUpdateAttendance,
  CreateMemberData 
} from '@/hooks/useMembers';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';

// Using Member and AttendanceRecord interfaces from the hooks

const MembersManager = () => {
  // React Query hooks
  const { data: members = [], isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useMembers();
  const { data: attendance = [], isLoading: attendanceLoading, error: attendanceError, refetch: refetchAttendance } = useAttendance();
  const createMemberMutation = useCreateMember();
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();
  const createAttendanceMutation = useCreateAttendance();
  const updateAttendanceMutation = useUpdateAttendance();
  
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('members');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServiceType, setSelectedServiceType] = useState<'domingo' | 'miercoles' | 'especial'>('domingo');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    ministry: '',
    status: 'active' as 'active' | 'inactive'
  });

  const { confirm } = useDeleteConfirmation();

  // Handle form submission for members
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const memberData: CreateMemberData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      birthDate: formData.birthDate,
      ministry: formData.ministry,
      status: formData.status,
    };
    
    try {
      if (editingMember) {
        await updateMemberMutation.mutateAsync({ id: editingMember.id, ...memberData });
        setEditingMember(null);
      } else {
        await createMemberMutation.mutateAsync(memberData);
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
        ministry: '',
        status: 'active'
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving member:', error);
    }
  };


  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      birthDate: member.birthDate,
      ministry: member.ministry,
      status: member.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm('¿Estás seguro de que quieres eliminar este miembro?');
    if (confirmed) {
      try {
        await deleteMemberMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
  };

  const handleAttendanceToggle = async (memberId: string, present: boolean) => {
    const existingRecord = attendance.find(
      record => record.memberId === memberId && 
                record.date === selectedDate && 
                record.serviceType === selectedServiceType
    );

    try {
      if (existingRecord) {
        await updateAttendanceMutation.mutateAsync({
          id: existingRecord.id,
          present
        });
      } else {
        await createAttendanceMutation.mutateAsync({
          memberId,
          date: selectedDate,
          serviceType: selectedServiceType,
          present
        });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const getAttendanceForMember = (memberId: string, date: string, serviceType: string) => {
    return attendance.find(
      record => record.memberId === memberId && 
                record.date === date && 
                record.serviceType === serviceType
    );
  };

  const getAttendanceStats = (memberId: string) => {
    const memberAttendance = attendance.filter(record => record.memberId === memberId);
    const totalServices = memberAttendance.length;
    const attendedServices = memberAttendance.filter(record => record.present).length;
    const attendanceRate = totalServices > 0 ? Math.round((attendedServices / totalServices) * 100) : 0;
    
    return { totalServices, attendedServices, attendanceRate };
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.ministry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-church-gold" />
        <span className="ml-2 text-gray-600">Cargando miembros...</span>
      </div>
    );
  }

  if (membersError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Miembros</h2>
          <Button onClick={() => refetchMembers()} variant="outline">
            Reintentar
          </Button>
        </div>
        <div className="text-center py-8 text-red-600">
          Error al cargar miembros: {membersError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Miembros</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar miembros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button
            onClick={() => setShowForm(true)}
            className="bg-church-gold hover:bg-church-gold-dark text-white whitespace-nowrap"
            disabled={createMemberMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Miembro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="attendance">Control de Asistencia</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6" data-testid="members-tab-content">
          {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMember ? 'Editar Miembro' : 'Nuevo Miembro'}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ministry">Ministerio</Label>
                  <select
                    id="ministry"
                    value={formData.ministry}
                    onChange={(e) => setFormData({...formData, ministry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Seleccionar ministerio</option>
                    <option value="Adoración">Adoración</option>
                    <option value="Jóvenes">Jóvenes</option>
                    <option value="Niños">Niños</option>
                    <option value="Intercesión">Intercesión</option>
                    <option value="Evangelismo">Evangelismo</option>
                    <option value="Técnico">Técnico</option>
                  </select>
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
                <Button 
                  type="submit" 
                  className="bg-church-gold hover:bg-church-gold-dark text-white"
                  disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
                >
                  {(createMemberMutation.isPending || updateMemberMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingMember ? 'Actualizar' : 'Crear'} Miembro
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingMember(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      birthDate: '',
                      ministry: '',
                      status: 'active'
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
            {filteredMembers.map((member) => {
              const stats = getAttendanceStats(member.id);
              return (
                <Card key={member.id} data-testid="member-card">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-church-gold" />
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                      </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(member)}
                    disabled={deleteMemberMutation.isPending}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={deleteMemberMutation.isPending}
                  >
                    {deleteMemberMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`inline-block px-2 py-1 rounded text-xs text-white ${
                      member.status === 'active' ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {member.status === 'active' ? 'Activo' : 'Inactivo'}
                    </div>
                    <div className="text-xs text-church-gold font-medium">
                      Asistencia: {stats.attendanceRate}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-church-gold" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-church-gold" />
                <span>{member.phone}</span>
              </div>
              {member.ministry && (
                <div className="text-sm text-gray-600">
                  <strong>Ministerio:</strong> {member.ministry}
                </div>
              )}
                  {member.address && (
                    <div className="text-sm text-gray-600 truncate">
                      <strong>Dirección:</strong> {member.address}
                    </div>
                  )}
                  <div className="text-sm text-church-blue-dark">
                    <strong>Servicios:</strong> {stats.attendedServices}/{stats.totalServices}
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron miembros que coincidan con la búsqueda.
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-church-gold" />
                Control de Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="attendance-date">Fecha del Servicio</Label>
                  <Input
                    id="attendance-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-type">Tipo de Servicio</Label>
                  <select
                    id="service-type"
                    value={selectedServiceType}
                    onChange={(e) => setSelectedServiceType(e.target.value as 'domingo' | 'miercoles' | 'especial')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="domingo">Domingo</option>
                    <option value="miercoles">Miércoles</option>
                    <option value="especial">Servicio Especial</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-church-blue-dark">Lista de Asistencia</h3>
                <div className="grid gap-3">
                  {members.filter(member => member.status === 'active').map((member) => {
                    const attendanceRecord = getAttendanceForMember(member.id, selectedDate, selectedServiceType);
                    const isPresent = attendanceRecord?.present || false;
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50" data-testid={`attendance-row-${member.id}`}>
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-church-gold" />
                          <div>
                            <span className="font-medium">{member.name}</span>
                            <div className="text-sm text-gray-600">{member.ministry}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={isPresent ? "default" : "outline"}
                            onClick={() => handleAttendanceToggle(member.id, true)}
                            className={isPresent ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Presente
                          </Button>
                          <Button
                            size="sm"
                            variant={!isPresent && attendanceRecord ? "default" : "outline"}
                            onClick={() => handleAttendanceToggle(member.id, false)}
                            className={!isPresent && attendanceRecord ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Ausente
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MembersManager;
