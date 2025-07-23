
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Edit, Save, X, Loader2 } from 'lucide-react';
import { useDonationInfo, useUpdateDonationInfo } from '@/hooks/useDonations';

const DonationsManager = () => {
  // React Query hooks
  const { data: donationInfo, isLoading, error, refetch } = useDonationInfo();
  const updateDonationInfoMutation = useUpdateDonationInfo();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    iban: '',
    bic: '',
    titular: '',
    bizum: '',
    verse: '',
    additionalMethods: ''
  });

  // Update form data when donationInfo changes
  React.useEffect(() => {
    if (donationInfo) {
      setFormData({
        iban: donationInfo.iban,
        bic: donationInfo.bic,
        titular: donationInfo.titular,
        bizum: donationInfo.bizum,
        verse: donationInfo.verse,
        additionalMethods: donationInfo.additionalMethods,
      });
    }
  }, [donationInfo]);

  const handleSave = async () => {
    try {
      await updateDonationInfoMutation.mutateAsync(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating donation info:', error);
    }
  };

  const handleCancel = () => {
    if (donationInfo) {
      setFormData({
        iban: donationInfo.iban,
        bic: donationInfo.bic,
        titular: donationInfo.titular,
        bizum: donationInfo.bizum,
        verse: donationInfo.verse,
        additionalMethods: donationInfo.additionalMethods,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-church-gold" />
        <span className="ml-2 text-gray-600">Cargando información de donaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Donaciones</h2>
          <Button onClick={() => refetch()} variant="outline">
            Reintentar
          </Button>
        </div>
        <div className="text-center py-8 text-red-600">
          Error al cargar información de donaciones: {error.message}
        </div>
      </div>
    );
  }

  if (!donationInfo) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontró información de donaciones.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-church-blue-dark">Gestión de Donaciones</h2>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-church-gold hover:bg-church-gold-dark text-white"
            disabled={updateDonationInfoMutation.isPending}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Información
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="bg-church-gold hover:bg-church-gold-dark text-white"
              disabled={updateDonationInfoMutation.isPending}
            >
              {updateDonationInfoMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={updateDonationInfoMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-church-gold" />
            Información de Donaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({...formData, iban: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bic">BIC/SWIFT</Label>
              <Input
                id="bic"
                value={formData.bic}
                onChange={(e) => setFormData({...formData, bic: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titular">Titular</Label>
            <Input
              id="titular"
              value={formData.titular}
              onChange={(e) => setFormData({...formData, titular: e.target.value})}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bizum">Bizum</Label>
            <Input
              id="bizum"
              value={formData.bizum}
              onChange={(e) => setFormData({...formData, bizum: e.target.value})}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verse">Versículo Bíblico</Label>
            <Textarea
              id="verse"
              value={formData.verse}
              onChange={(e) => setFormData({...formData, verse: e.target.value})}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalMethods">Métodos Adicionales de Donación</Label>
            <Textarea
              id="additionalMethods"
              value={formData.additionalMethods}
              onChange={(e) => setFormData({...formData, additionalMethods: e.target.value})}
              disabled={!isEditing}
              rows={3}
              placeholder="Agregar información sobre otros métodos de donación..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa Pública</CardTitle>
        </CardHeader>
        <CardContent className="bg-gray-50 p-6 rounded-lg">
          <div className="space-y-4">
            <div>
              <strong>IBAN:</strong> {donationInfo.iban}
            </div>
            <div>
              <strong>BIC/SWIFT:</strong> {donationInfo.bic}
            </div>
            <div>
              <strong>Titular:</strong> {donationInfo.titular}
            </div>
            <div>
              <strong>Bizum:</strong> {donationInfo.bizum}
            </div>
            {donationInfo.additionalMethods && (
              <div>
                <strong>Métodos Adicionales:</strong>
                <div className="mt-2 whitespace-pre-line">{donationInfo.additionalMethods}</div>
              </div>
            )}
            <div className="border-t pt-4 mt-4">
              <em className="text-church-blue-dark">{donationInfo.verse}</em>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonationsManager;
