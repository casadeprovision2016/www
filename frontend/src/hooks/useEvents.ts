import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useOperationToasts } from './useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Types
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity?: number;
  category: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity?: number;
  category: string;
}

// API Functions
const fetchEvents = async (): Promise<Event[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/events`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  return data.success ? data.data.data : [];
};

const createEvent = async (eventData: CreateEventData): Promise<Event> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error('Failed to create event');
  }

  const data = await response.json();
  return data.data;
};

const updateEvent = async ({ id, ...eventData }: { id: string } & Partial<CreateEventData>): Promise<Event> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error('Failed to update event');
  }

  const data = await response.json();
  return data.data;
};

const deleteEvent = async (id: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete event');
  }
};

// Custom Hooks
export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { showCreateSuccess, showCreateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showCreateSuccess('Evento');
    },
    onError: (error: Error) => {
      showCreateError('evento', error.message);
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showUpdateSuccess('Evento');
    },
    onError: (error: Error) => {
      showUpdateError('evento', error.message);
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const { showDeleteSuccess, showDeleteError } = useOperationToasts();
  
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showDeleteSuccess('Evento');
    },
    onError: (error: Error) => {
      showDeleteError('evento', error.message);
    },
  });
};

// Event Stats
const fetchEventStats = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/events/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch event stats');
  }

  const data = await response.json();
  return data.success ?data.data.data : { total: 0, thisMonth: 0, upcoming: 0 };
};

export const useEventStats = () => {
  return useQuery({
    queryKey: ['event-stats'],
    queryFn: fetchEventStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};