import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MinistriesManager from './MinistriesManager';
import { useMinistries, useCreateMinistry, useUpdateMinistry, useDeleteMinistry } from '../../hooks/useMinistries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { vi } from 'vitest';

// Mock hooks
vi.mock('../../hooks/useMinistries');

const mockUseMinistries = useMinistries as vi.Mock;
const mockUseCreateMinistry = useCreateMinistry as vi.Mock;
const mockUseUpdateMinistry = useUpdateMinistry as vi.Mock;
const mockUseDeleteMinistry = useDeleteMinistry as vi.Mock;

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MinistriesManager />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('MinistriesManager', () => {
  const mockMinistries = [
    {
      id: '1',
      name: 'Ministerio de Alabanza',
      description: 'Encargados de la música y adoración.',
      leader_id: 'leader1',
      leader: { id: 'leader1', name: 'Pastor David' },
      meetingDay: 'jueves',
      meetingTime: '19:00',
      meetingLocation: 'Salón Principal',
      active: true,
      memberCount: 15,
    },
    {
      id: '2',
      name: 'Ministerio de Niños',
      description: 'Enseñanza bíblica para niños.',
      leader_id: 'leader2',
      leader: { id: 'leader2', name: 'Hermana Ana' },
      meetingDay: 'domingo',
      meetingTime: '10:00',
      meetingLocation: 'Aulas Infantiles',
      active: true,
      memberCount: 20,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseMinistries.mockReturnValue({ data: mockMinistries, isLoading: false, error: null });
    mockUseCreateMinistry.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseUpdateMinistry.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseDeleteMinistry.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders the component correctly with existing ministries', () => {
    renderComponent();

    expect(screen.getByText('Gestión de Ministerios')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Ministerio')).toBeInTheDocument();
    expect(screen.getByText('Ministerio de Alabanza')).toBeInTheDocument();
    expect(screen.getByText('Ministerio de Niños')).toBeInTheDocument();
  });

  it('shows the form when "Nuevo Ministerio" button is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Ministerio/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nuevo Ministerio' })).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre del Ministerio')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crear Ministerio/i })).toBeInTheDocument();
    });
  });

  it('creates a new ministry', async () => {
    const createMinistryMutation = { mutate: vi.fn(), isPending: false };
    mockUseCreateMinistry.mockReturnValue(createMinistryMutation);

    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Ministerio/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre del Ministerio')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Nombre del Ministerio'), { target: { value: 'Nuevo Ministerio Test' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear Ministerio/i }));

    await waitFor(() => {
      expect(createMinistryMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nuevo Ministerio Test',
        }),
        expect.any(Object)
      );
    });
  });
});