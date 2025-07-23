import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOperationToasts } from './useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

export interface UpdateFollowUpData {
  followUpStatus: Visitor['followUpStatus'];
  followUpDate?: string;
  notes?: string;
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

const updateVisitor = async ({ id, ...visitorData }: { id: string } & Partial<CreateVisitorData>): Promise<Visitor> => {
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

const updateFollowUp = async ({ id, ...followUpData }: { id: string } & UpdateFollowUpData): Promise<Visitor> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/visitors/${id}/follow-up`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(followUpData),
  });

  if (!response.ok) {
    throw new Error('Failed to update follow-up');
  }

  const data = await response.json();
  return data.data;
};

// Stats
const fetchVisitorStats = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/visitors/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch visitor stats');
  }

  const data = await response.json();
  return data.success ? data.data : { 
    total: 0, 
    thisMonth: 0, 
    thisWeek: 0, 
    pendingFollowUp: 0,
    interestedInMembership: 0 
  };
};

// Custom Hooks
export const useVisitors = () => {
  return useQuery({
    queryKey: ['visitors'],
    queryFn: fetchVisitors,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateVisitor = () => {
  const queryClient = useQueryClient();
  const { showCreateSuccess, showCreateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: createVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
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
  
  return useMutation({
    mutationFn: updateVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
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
  
  return useMutation({
    mutationFn: deleteVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
      showDeleteSuccess('Visitante');
    },
    onError: (error: Error) => {
      showDeleteError('visitante', error.message);
    },
  });
};

export const useUpdateFollowUp = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: updateFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
      showUpdateSuccess('Seguimiento');
    },
    onError: (error: Error) => {
      showUpdateError('seguimiento', error.message);
    },
  });
};

export const useVisitorStats = () => {
  return useQuery({
    queryKey: ['visitor-stats'],
    queryFn: fetchVisitorStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};