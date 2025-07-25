import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOperationToasts } from './useToast';

const API_URL = import.meta.env.VITE_API_URL;

// Types
export interface Visitor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  visitDate: string;
  source: 'invitation' | 'social_media' | 'walk_in' | 'website' | 'other';
  notes?: string;
  followUpStatus: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'no_interest';
  followUpDate?: string;
  interestedInMembership: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitorData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  visitDate: string;
  source: 'invitation' | 'social_media' | 'walk_in' | 'website' | 'other';
  notes?: string;
  interestedInMembership: boolean;
}

export interface UpdateVisitorData {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  visitDate?: string;
  source?: 'invitation' | 'social_media' | 'walk_in' | 'website' | 'other';
  notes?: string;
  followUpStatus?: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'no_interest';
  followUpDate?: string;
  interestedInMembership?: boolean;
}

// API Functions
const fetchVisitors = async (): Promise<Visitor[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/visitors`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch visitors');
  }

  const data = await response.json();
  return data.success ? data.data : [];
};

const createVisitor = async (visitorData: CreateVisitorData): Promise<Visitor> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/visitors`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(visitorData),
  });

  if (!response.ok) {
    throw new Error('Failed to create visitor');
  }

  const data = await response.json();
  return data.data;
};

const updateVisitor = async ({ id, ...visitorData }: UpdateVisitorData): Promise<Visitor> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/visitors/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(visitorData),
  });

  if (!response.ok) {
    throw new Error('Failed to update visitor');
  }

  const data = await response.json();
  return data.data;
};

const deleteVisitor = async (id: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/visitors/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete visitor');
  }
};

// Custom Hooks
export const useVisitors = () => {
  return useQuery<Visitor[], Error>({
    queryKey: ['visitors'],
    queryFn: fetchVisitors,
  });
};

export const useCreateVisitor = () => {
  const queryClient = useQueryClient();
  const { showCreateSuccess, showCreateError } = useOperationToasts();
  
  return useMutation<Visitor, Error, CreateVisitorData>({
    mutationFn: createVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      showCreateSuccess('Visitante');
    },
    onError: (error: Error) => {
      showCreateError('visitante', error.message);
    },
  });
};

export const useUpdateVisitor = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation<Visitor, Error, UpdateVisitorData>({
    mutationFn: updateVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      showUpdateSuccess('Visitante');
    },
    onError: (error: Error) => {
      showUpdateError('visitante', error.message);
    },
  });
};

export const useDeleteVisitor = () => {
  const queryClient = useQueryClient();
  const { showDeleteSuccess, showDeleteError } = useOperationToasts();
  
  return useMutation<void, Error, string>({
    mutationFn: deleteVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      showDeleteSuccess('Visitante');
    },
    onError: (error: Error) => {
      showDeleteError('visitante', error.message);
    },
  });
};
