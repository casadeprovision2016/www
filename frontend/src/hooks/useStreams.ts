import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOperationToasts } from './useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Types
export interface Stream {
  id: string;
  title: string;
  description: string;
  streamUrl: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  platform: 'youtube' | 'facebook' | 'instagram' | 'zoom' | 'custom';
  isRecorded: boolean;
  recordingUrl?: string;
  viewerCount?: number;
  maxViewers?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStreamData {
  title: string;
  description: string;
  streamUrl: string;
  scheduledDate: string;
  scheduledTime: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'zoom' | 'custom';
  isRecorded: boolean;
}

// API Functions
const fetchStreams = async (): Promise<Stream[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/streams`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch streams');
  }

  const data = await response.json();
  return data.success ? data.data.data : [];
};

const createStream = async (streamData: CreateStreamData): Promise<Stream> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/streams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(streamData),
  });

  if (!response.ok) {
    throw new Error('Failed to create stream');
  }

  const data = await response.json();
  return data.data;
};

const updateStream = async ({ id, ...streamData }: { id: string } & Partial<CreateStreamData>): Promise<Stream> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/streams/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(streamData),
  });

  if (!response.ok) {
    throw new Error('Failed to update stream');
  }

  const data = await response.json();
  return data.data;
};

const deleteStream = async (id: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/streams/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete stream');
  }
};

const updateStreamStatus = async (id: string, status: Stream['status']): Promise<Stream> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/streams/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update stream status');
  }

  const data = await response.json();
  return data.data;
};

// Custom Hooks
export const useStreams = () => {
  return useQuery({
    queryKey: ['streams'],
    queryFn: fetchStreams,
    staleTime: 2 * 60 * 1000, // 2 minutes (streams change more frequently)
  });
};

export const useCreateStream = () => {
  const queryClient = useQueryClient();
  const { showCreateSuccess, showCreateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: createStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      showCreateSuccess('Transmisión');
    },
    onError: (error: Error) => {
      showCreateError('transmisión', error.message);
    },
  });
};

export const useUpdateStream = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: updateStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      showUpdateSuccess('Transmisión');
    },
    onError: (error: Error) => {
      showUpdateError('transmisión', error.message);
    },
  });
};

export const useDeleteStream = () => {
  const queryClient = useQueryClient();
  const { showDeleteSuccess, showDeleteError } = useOperationToasts();
  
  return useMutation({
    mutationFn: deleteStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      showDeleteSuccess('Transmisión');
    },
    onError: (error: Error) => {
      showDeleteError('transmisión', error.message);
    },
  });
};

export const useUpdateStreamStatus = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Stream['status'] }) => 
      updateStreamStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      showUpdateSuccess('Estado de transmisión');
    },
    onError: (error: Error) => {
      showUpdateError('estado de transmisión', error.message);
    },
  });
};