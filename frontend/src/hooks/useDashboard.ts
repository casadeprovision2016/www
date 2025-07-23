import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Types
export interface DashboardStats {
  events: {
    total: number;
    thisMonth: number;
    upcoming: number;
  };
  members: {
    total: number;
    active: number;
    inactive: number;
  };
  visitors: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  donations: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
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
    events: { total: 0, thisMonth: 0, upcoming: 0 },
    members: { total: 0, active: 0, inactive: 0 },
    visitors: { total: 0, thisMonth: 0, thisWeek: 0 },
    donations: { thisMonth: 0, lastMonth: 0, currency: 'EUR' },
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