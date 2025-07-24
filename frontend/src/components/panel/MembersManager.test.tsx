
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MembersManager from './MembersManager';
import { 
  useMembers, 
  useCreateMember, 
  useUpdateMember, 
  useDeleteMember, 
  useAttendance, 
  useCreateAttendance, 
  useUpdateAttendance 
} from '../../hooks/useMembers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { vi } from 'vitest';

// Mock hooks
vi.mock('../../hooks/useMembers');

const mockUseMembers = useMembers as vi.Mock;
const mockUseCreateMember = useCreateMember as vi.Mock;
const mockUseUpdateMember = useUpdateMember as vi.Mock;
const mockUseDeleteMember = useDeleteMember as vi.Mock;
const mockUseAttendance = useAttendance as vi.Mock;
const mockUseCreateAttendance = useCreateAttendance as vi.Mock;
const mockUseUpdateAttendance = useUpdateAttendance as vi.Mock;

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MembersManager />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('MembersManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockUseMembers.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
    mockUseAttendance.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
    mockUseCreateMember.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseUpdateMember.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseDeleteMember.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseCreateAttendance.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseUpdateAttendance.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it('should display a loading message initially', () => {
    mockUseMembers.mockReturnValue({ data: [], isLoading: true, error: null, refetch: vi.fn() });
    renderComponent();
    expect(screen.getByText(/Cargando miembros.../i)).toBeInTheDocument();
  });

  it('should display a message when no members are found', () => {
    renderComponent();
    expect(screen.getByText(/No se encontraron miembros que coincidan con la búsqueda./i)).toBeInTheDocument();
  });

  it('should display the list of members', () => {
    const members = [
      { id: '1', name: 'John Doe', email: 'john@example.com', phone: '123456789', address: '123 Main St', birth_date: '1990-01-01', membership_date: '2020-01-01', photo_url: '', ministry: 'Adoración', status: 'active' },
      { id: '2', name: 'Jane Doe', email: 'jane@example.com', phone: '987654321', address: '456 Oak Ave', birth_date: '1992-02-02', membership_date: '2021-02-02', photo_url: '', ministry: 'Jóvenes', status: 'active' },
    ];
    mockUseMembers.mockReturnValue({ data: members, isLoading: false, error: null, refetch: vi.fn() });
    renderComponent();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should allow adding a new member', async () => {
    const createMemberMutation = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };
    mockUseCreateMember.mockReturnValue(createMemberMutation);

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Miembro/i }));

    await waitFor(() => {
        expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'New Member' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '123123123' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear Miembro/i }));

    await waitFor(() => {
      expect(createMemberMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Member',
          email: 'new@example.com',
          phone: '123123123',
        })
      );
    });
  });
});
