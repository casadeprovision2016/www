import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Types
export interface DashboardStats {
  events: {
    total: number;
    active: number;
    monthly: any;
  };
  members: {
    total: number;
    active: number;
    inactive: number;
    monthly: any;
  };
  visitors: {
    total: number;
    monthly: any;
  };
  donations: {
    total: number;
    total_amount: number;
    monthly: any;
  };
  streams: {
    total: number;
    active: number;
    monthly: any;
  };
}

export interface BirthdayMember {
  id: string;
  name: string;
  birthDate: string;
  ministry?: string;
  email?: string;
  phone?: string;
}

// API Functions
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  const data = await response.json();
  return data.success ? data.data : {
    events: { total: 0, active: 0, monthly: {} },
    members: { total: 0, active: 0, inactive: 0, monthly: {} },
    visitors: { total: 0, monthly: {} },
    donations: { total: 0, total_amount: 0, monthly: {} },
    streams: { total: 0, active: 0, monthly: {} },
  };
};

const fetchUpcomingBirthdays = async (): Promise<BirthdayMember[]> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}/api/members/birthdays`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch upcoming birthdays');
  }

  const data = await response.json();
  return data.success ? data.data : [];
};

// Custom Hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useUpcomingBirthdays = () => {
  return useQuery({
    queryKey: ['upcoming-birthdays'],
    queryFn: fetchUpcomingBirthdays,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};