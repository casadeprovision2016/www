import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BirthdaysList from './BirthdaysList';
import { useUpcomingBirthdays } from '@/hooks/useDashboard';

// Mock the custom hook
vi.mock('@/hooks/useDashboard', () => ({
  useUpcomingBirthdays: vi.fn(),
}));

// Mock lucide-react icons to avoid rendering issues in tests
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Calendar: vi.fn(() => <svg data-testid="calendar-icon" />),
    User: vi.fn(() => <svg data-testid="user-icon" />),
    Loader2: vi.fn(() => <svg data-testid="loader-icon" />),
  };
});

// Mock shadcn/ui components
vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>),
  CardContent: vi.fn(({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>),
  CardHeader: vi.fn(({ children, ...props }) => <div data-testid="card-header" {...props}>{children}</div>),
  CardTitle: vi.fn(({ children, ...props }) => <h2 data-testid="card-title" {...props}>{children}</h2>),
}));

describe('BirthdaysList', () => {
  const mockBirthdays = [
    {
      id: '1',
      name: 'Juan Pérez',
      birthDate: '2025-07-25',
      ministry: 'Adoración',
      phone: '123-456-7890',
    },
    {
      id: '2',
      name: 'María García',
      birthDate: '2025-07-27',
      ministry: 'Jóvenes',
      phone: null,
    },
    {
      id: '3',
      name: 'Carlos Rodríguez',
      birthDate: '2025-07-30',
      ministry: null,
      phone: '987-654-3210',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly with upcoming birthdays', () => {
    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: mockBirthdays,
      isLoading: false,
      error: null,
    });

    render(<BirthdaysList />);

    expect(screen.getByText('Cumpleaños de la Semana (3)')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Carlos Rodríguez')).toBeInTheDocument();
    expect(screen.getByText('Adoración')).toBeInTheDocument();
    expect(screen.getByText('Jóvenes')).toBeInTheDocument();
    expect(screen.getByText('📞 123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('📞 987-654-3210')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<BirthdaysList />);

    expect(screen.getByText('Cumpleaños de la Semana')).toBeInTheDocument();
    expect(screen.getByText('Cargando cumpleaños...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to fetch birthdays';
    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error(errorMessage),
    });

    render(<BirthdaysList />);

    expect(screen.getByText('Cumpleaños de la Semana')).toBeInTheDocument();
    expect(screen.getByText(`Error al cargar cumpleaños: ${errorMessage}`)).toBeInTheDocument();
  });

  it('displays message when no birthdays are found', () => {
    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<BirthdaysList />);

    expect(screen.getByText('Cumpleaños de la Semana')).toBeInTheDocument();
    expect(screen.getByText('No hay cumpleaños esta semana.')).toBeInTheDocument();
  });

  it('formats birthdays correctly', () => {
    const birthdayData = [
      {
        id: '1',
        name: 'Test Person',
        birthDate: '2025-07-25', // July 25th
        ministry: null,
        phone: null,
      },
    ];

    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: birthdayData,
      isLoading: false,
      error: null,
    });

    render(<BirthdaysList />);

    expect(screen.getByText('25 de julio')).toBeInTheDocument();
  });

  it('renders without ministry when ministry is null', () => {
    const birthdayData = [
      {
        id: '1',
        name: 'No Ministry Person',
        birthDate: '2025-07-25',
        ministry: null,
        phone: null,
      },
    ];

    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: birthdayData,
      isLoading: false,
      error: null,
    });

    render(<BirthdaysList />);

    expect(screen.getByText('No Ministry Person')).toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('renders without phone when phone is null', () => {
    const birthdayData = [
      {
        id: '1',
        name: 'No Phone Person',
        birthDate: '2025-07-25',
        ministry: 'Adoración',
        phone: null,
      },
    ];

    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: birthdayData,
      isLoading: false,
      error: null,
    });

    render(<BirthdaysList />);

    expect(screen.getByText('No Phone Person')).toBeInTheDocument();
    expect(screen.getByText('Adoración')).toBeInTheDocument();
    expect(screen.queryByText(/📞/)).not.toBeInTheDocument();
  });

  it('displays correct number of user icons', () => {
    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: mockBirthdays,
      isLoading: false,
      error: null,
    });

    render(<BirthdaysList />);

    const userIcons = screen.getAllByTestId('user-icon');
    expect(userIcons).toHaveLength(3); // One for each birthday
  });

  it('handles empty data gracefully', () => {
    (useUpcomingBirthdays as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<BirthdaysList />);

    // Should default to empty array and show no birthdays message
    expect(screen.getByText('No hay cumpleaños esta semana.')).toBeInTheDocument();
  });
});