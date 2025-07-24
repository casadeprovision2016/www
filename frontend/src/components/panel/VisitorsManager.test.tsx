import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VisitorsManager from './VisitorsManager';
import { useVisitors, useCreateVisitor, useUpdateVisitor, useDeleteVisitor } from '../../hooks/useVisitors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Plus: (props: any) => <svg data-testid="plus-icon" {...props} />,
    Edit: (props: any) => <svg data-testid="edit-icon" {...props} />,
    Trash2: (props: any) => <svg data-testid="trash-icon" {...props} />,
    UserPlus: (props: any) => <svg data-testid="user-plus-icon" {...props} />,
    Phone: (props: any) => <svg data-testid="phone-icon" {...props} />,
    Mail: (props: any) => <svg data-testid="mail-icon" {...props} />,
    Loader2: (props: any) => <svg data-testid="loader-icon" {...props} />,
  };
});

// Mock hooks
vi.mock('../../hooks/useVisitors');

// Mock the confirmation dialog
vi.mock('@/components/ui/confirmation-dialog', () => ({
  useDeleteConfirmation: vi.fn(),
}));

const mockUseVisitors = useVisitors as vi.Mock;
const mockUseCreateVisitor = useCreateVisitor as vi.Mock;
const mockUseUpdateVisitor = useUpdateVisitor as vi.Mock;
const mockUseDeleteVisitor = useDeleteVisitor as vi.Mock;

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VisitorsManager />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('VisitorsManager', () => {
  const mockVisitors = [
    { id: '1', name: 'Visitor One', email: 'visitor1@example.com', phone: '111222333', address: '123 Main St', visitDate: '2025-07-24', source: 'walk_in', notes: 'First visit', followUpStatus: 'pending', followUpDate: '', interestedInMembership: false, created_at: '', updated_at: '' },
    { id: '2', name: 'Visitor Two', email: 'visitor2@example.com', phone: '444555666', address: '456 Oak Ave', visitDate: '2025-07-23', source: 'website', notes: 'Second visit', followUpStatus: 'contacted', followUpDate: '2025-07-25', interestedInMembership: true, created_at: '', updated_at: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseVisitors.mockReturnValue({ data: mockVisitors, isLoading: false, error: null, refetch: vi.fn() });
    mockUseCreateVisitor.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });
    mockUseUpdateVisitor.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });
    mockUseDeleteVisitor.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false });

    // Mock the confirmation dialog
    (useDeleteConfirmation as vi.Mock).mockReturnValue({
      confirm: vi.fn(() => Promise.resolve(true)),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display a loading message initially', () => {
    mockUseVisitors.mockReturnValue({ data: [], isLoading: true, error: null, refetch: vi.fn() });
    renderComponent();
    expect(screen.getByText(/Cargando visitantes.../i)).toBeInTheDocument();
  });

  it('should display an error message', () => {
    const errorMessage = 'Failed to fetch visitors';
    mockUseVisitors.mockReturnValue({ data: [], isLoading: false, error: new Error(errorMessage), refetch: vi.fn() });
    renderComponent();
    expect(screen.getByText(`Error al cargar visitantes: ${errorMessage}`)).toBeInTheDocument();
  });

  it('should display a message when no visitors are found', () => {
    mockUseVisitors.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
    renderComponent();
    expect(screen.getByText(/No se encontraron visitantes que coincidan con la búsqueda./i)).toBeInTheDocument();
  });

  it('should display the list of visitors', () => {
    renderComponent();
    expect(screen.getByText('Visitor One')).toBeInTheDocument();
    expect(screen.getByText('visitor2@example.com')).toBeInTheDocument();
  });

  it('should allow adding a new visitor', async () => {
    const createMutation = mockUseCreateVisitor().mutateAsync;
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Visitante/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'New Visitor' } });
    fireEvent.change(screen.getByLabelText(/Email \(opcional\)/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Teléfono \(opcional\)/i), { target: { value: '777888999' } });
    fireEvent.change(screen.getByLabelText(/Fecha de Visita/i), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByLabelText(/Fuente/i), { target: { value: 'website' } });
    fireEvent.change(screen.getByLabelText(/Notas/i), { target: { value: 'Some notes' } });
    fireEvent.click(screen.getByLabelText(/Interesado en Membresía/i));

    fireEvent.click(screen.getByRole('button', { name: /Registrar Visitante/i }));

    await waitFor(() => {
      expect(createMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Visitor',
          email: 'new@example.com',
          phone: '777888999',
          visitDate: '2025-08-01',
          source: 'website',
          notes: 'Some notes',
          interestedInMembership: true,
        })
      );
    });
    expect(screen.queryByLabelText(/Nombre Completo/i)).not.toBeInTheDocument();
  });

  it('should allow editing an existing visitor', async () => {
    const updateMutation = mockUseUpdateVisitor().mutateAsync;
    renderComponent();

    fireEvent.click(screen.getAllByTestId('edit-icon')[0]); // Click edit for Visitor One

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Editar Visitante' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre Completo/i)).toHaveValue('Visitor One');
    });

    fireEvent.change(screen.getByLabelText(/Email \(opcional\)/i), { target: { value: 'updated@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Actualizar Visitante/i }));

    await waitFor(() => {
      expect(updateMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          email: 'updated@example.com',
        })
      );
    });
    expect(screen.queryByLabelText(/Nombre Completo/i)).not.toBeInTheDocument();
  });

  it('should allow deleting a visitor', async () => {
    const deleteMutation = mockUseDeleteVisitor().mutateAsync;
    const confirmMock = vi.fn(() => Promise.resolve(true));
    (useDeleteConfirmation as vi.Mock).mockReturnValue({
      confirm: confirmMock,
    });
    
    renderComponent();

    fireEvent.click(screen.getAllByTestId('trash-icon')[0]); // Click delete for Visitor One

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar este visitante?');
      expect(deleteMutation).toHaveBeenCalledWith('1');
    });
  });

  it('should filter visitors based on search term', () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Buscar visitantes...'), { target: { value: 'One' } });
    expect(screen.getByText('Visitor One')).toBeInTheDocument();
    expect(screen.queryByText('Visitor Two')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Buscar visitantes...'), { target: { value: 'Two' } });
    expect(screen.queryByText('Visitor One')).not.toBeInTheDocument();
    expect(screen.getByText('Visitor Two')).toBeInTheDocument();
  });
});