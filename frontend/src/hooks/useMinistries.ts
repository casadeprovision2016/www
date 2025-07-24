import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOperationToasts } from './useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Types
export interface Ministry {
  id: string;
  name: string;
  description: string;
  leader?: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  meetingDay?: string;
  meetingTime?: string;
  meetingLocation?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateMinistryData {
  name: string;
  description: string;
  leaderId?: string;
  meetingDay?: string;
  meetingTime?: string;
  meetingLocation?: string;
  status: 'active' | 'inactive';
}

export interface MinistryMember {
  id: string;
  ministryId: string;
  memberId: string;
  member: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  role: 'member' | 'assistant' | 'coordinator';
  joinedDate: string;
  created_at: string;
  updated_at: string;
}

// API Functions
const fetchMinistries = async (): Promise<Ministry[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/ministries`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ministries');
  }

  const data = await response.json();
  return data.success ? data.data.data : [];
};

const fetchMinistryMembers = async (ministryId: string): Promise<MinistryMember[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/ministries/${ministryId}/members`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ministry members');
  }

  const data = await response.json();
  return data.success ? data.data.data : [];
};

const createMinistry = async (ministryData: CreateMinistryData): Promise<Ministry> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/ministries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ministryData),
  });

  if (!response.ok) {
    throw new Error('Failed to create ministry');
  }

  const data = await response.json();
  return data.data;
};

const updateMinistry = async ({ id, ...ministryData }: { id: string } & Partial<CreateMinistryData>): Promise<Ministry> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/ministries/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ministryData),
  });

  if (!response.ok) {
    throw new Error('Failed to update ministry');
  }

  const data = await response.json();
  return data.data;
};

const deleteMinistry = async (id: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/ministries/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete ministry');
  }
};

const addMinistryMember = async (ministryId: string, memberId: string, role: MinistryMember['role'] = 'member'): Promise<MinistryMember> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/ministries/${ministryId}/members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ memberId, role }),
  });

  if (!response.ok) {
    throw new Error('Failed to add ministry member');
  }

  const data = await response.json();
  return data.data;
};

const removeMinistryMember = async (ministryId: string, memberId: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/ministries/${ministryId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove ministry member');
  }
};

// Custom Hooks
export const useMinistries = () => {
  return useQuery({
    queryKey: ['ministries'],
    queryFn: fetchMinistries,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMinistryMembers = (ministryId: string) => {
  return useQuery({
    queryKey: ['ministry-members', ministryId],
    queryFn: () => fetchMinistryMembers(ministryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!ministryId,
  });
};

export const useCreateMinistry = () => {
  const queryClient = useQueryClient();
  const { showCreateSuccess, showCreateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: createMinistry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      showCreateSuccess('Ministerio');
    },
    onError: (error: Error) => {
      showCreateError('ministerio', error.message);
    },
  });
};

export const useUpdateMinistry = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: updateMinistry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      showUpdateSuccess('Ministerio');
    },
    onError: (error: Error) => {
      showUpdateError('ministerio', error.message);
    },
  });
};

export const useDeleteMinistry = () => {
  const queryClient = useQueryClient();
  const { showDeleteSuccess, showDeleteError } = useOperationToasts();
  
  return useMutation({
    mutationFn: deleteMinistry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      showDeleteSuccess('Ministerio');
    },
    onError: (error: Error) => {
      showDeleteError('ministerio', error.message);
    },
  });
};

export const useAddMinistryMember = () => {
  const queryClient = useQueryClient();
  const { showCreateSuccess, showCreateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: ({ ministryId, memberId, role }: { ministryId: string; memberId: string; role?: MinistryMember['role'] }) =>
      addMinistryMember(ministryId, memberId, role),
    onSuccess: (_, { ministryId }) => {
      queryClient.invalidateQueries({ queryKey: ['ministry-members', ministryId] });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      showCreateSuccess('Miembro del ministerio');
    },
    onError: (error: Error) => {
      showCreateError('miembro del ministerio', error.message);
    },
  });
};

export const useRemoveMinistryMember = () => {
  const queryClient = useQueryClient();
  const { showDeleteSuccess, showDeleteError } = useOperationToasts();
  
  return useMutation({
    mutationFn: ({ ministryId, memberId }: { ministryId: string; memberId: string }) =>
      removeMinistryMember(ministryId, memberId),
    onSuccess: (_, { ministryId }) => {
      queryClient.invalidateQueries({ queryKey: ['ministry-members', ministryId] });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      showDeleteSuccess('Miembro del ministerio');
    },
    onError: (error: Error) => {
      showDeleteError('miembro del ministerio', error.message);
    },
  });
};