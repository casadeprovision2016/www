import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOperationToasts } from './useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Types
export interface DonationInfo {
  id: string;
  iban: string;
  bic: string;
  titular: string;
  bizum: string;
  verse: string;
  additionalMethods: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateDonationInfoData {
  iban: string;
  bic: string;
  titular: string;
  bizum: string;
  verse: string;
  additionalMethods: string;
}

// API Functions
const fetchDonationInfo = async (): Promise<DonationInfo> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/donations/info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch donation info');
  }

  const data = await response.json();
  return data.success ? data.data : {
    id: '1',
    iban: 'ES1021001419020200597614',
    bic: 'CAIXESBBXXX',
    titular: 'Centro Cristiano Casa de Provisión',
    bizum: 'En construcción',
    verse: '"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre." — 2 Corintios 9:7a',
    additionalMethods: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const updateDonationInfo = async (infoData: UpdateDonationInfoData): Promise<DonationInfo> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/donations/info`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(infoData),
  });

  if (!response.ok) {
    throw new Error('Failed to update donation info');
  }

  const data = await response.json();
  return data.data;
};

// Custom Hooks
export const useDonationInfo = () => {
  return useQuery({
    queryKey: ['donation-info'],
    queryFn: fetchDonationInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateDonationInfo = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: updateDonationInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-info'] });
      showUpdateSuccess('Información de donaciones');
    },
    onError: (error: Error) => {
      showUpdateError('información de donaciones', error.message);
    },
  });
};