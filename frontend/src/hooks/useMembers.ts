import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOperationToasts } from './useToast';

const API_URL = import.meta.env.VITE_API_URL;

// Types
export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  ministry: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  serviceType: 'domingo' | 'miercoles' | 'especial';
  present: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberData {
  name: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  ministry: string;
  status: 'active' | 'inactive';
}

export interface CreateAttendanceData {
  memberId: string;
  date: string;
  serviceType: 'domingo' | 'miercoles' | 'especial';
  present: boolean;
  notes?: string;
}

// API Functions
const fetchMembers = async (): Promise<Member[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/members`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }

  const data = await response.json();
  return data.success ? data.data.data : [];
};

const createMember = async (memberData: CreateMemberData): Promise<Member> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memberData),
  });

  if (!response.ok) {
    throw new Error('Failed to create member');
  }

  const data = await response.json();
  return data.data;
};

const updateMember = async ({ id, ...memberData }: { id: string } & Partial<CreateMemberData>): Promise<Member> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/members/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memberData),
  });

  if (!response.ok) {
    throw new Error('Failed to update member');
  }

  const data = await response.json();
  return data.data;
};

const deleteMember = async (id: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/members/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete member');
  }
};

// Attendance API Functions
const fetchAttendance = async (): Promise<AttendanceRecord[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/attendance`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attendance');
  }

  const data = await response.json();
  return data.success ? data.data.data : [];
};

const createAttendance = async (attendanceData: CreateAttendanceData): Promise<AttendanceRecord> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/attendance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attendanceData),
  });

  if (!response.ok) {
    throw new Error('Failed to record attendance');
  }

  const data = await response.json();
  return data.data;
};

const updateAttendance = async ({ id, ...attendanceData }: { id: string } & Partial<CreateAttendanceData>): Promise<AttendanceRecord> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/attendance/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attendanceData),
  });

  if (!response.ok) {
    throw new Error('Failed to update attendance');
  }

  const data = await response.json();
  return data.data;
};

// Custom Hooks for Members
export const useMembers = () => {
  return useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  const { showCreateSuccess, showCreateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      showCreateSuccess('Miembro');
    },
    onError: (error: Error) => {
      showCreateError('miembro', error.message);
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { showUpdateSuccess, showUpdateError } = useOperationToasts();
  
  return useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      showUpdateSuccess('Miembro');
    },
    onError: (error: Error) => {
      showUpdateError('miembro', error.message);
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  const { showDeleteSuccess, showDeleteError } = useOperationToasts();
  
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      showDeleteSuccess('Miembro');
    },
    onError: (error: Error) => {
      showDeleteError('miembro', error.message);
    },
  });
};

// Custom Hooks for Attendance
export const useAttendance = () => {
  return useQuery({
    queryKey: ['attendance'],
    queryFn: fetchAttendance,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Member Stats
const fetchMemberStats = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/members/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch member stats');
  }

  const data = await response.json();
  return data.success ?data.data.data : { total: 0, active: 0, inactive: 0 };
};

export const useMemberStats = () => {
  return useQuery({
    queryKey: ['member-stats'],
    queryFn: fetchMemberStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};