import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventsManager from './EventsManager';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';

// Mock the custom hooks
vi.mock('@/hooks/useEvents', () => ({
  useEvents: vi.fn(),
  useCreateEvent: vi.fn(),
  useUpdateEvent: vi.fn(),
  useDeleteEvent: vi.fn(),
}));

// Mock the confirmation dialog
vi.mock('@/components/ui/confirmation-dialog', () => ({
  useDeleteConfirmation: vi.fn(),
}));

// Mock lucide-react icons to avoid rendering issues in tests
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Plus: vi.fn(() => <svg data-testid="plus-icon" />),
    Edit: vi.fn(() => <svg data-testid="edit-icon" />),
    Trash2: vi.fn(() => <svg data-testid="trash-icon" />),
    Calendar: vi.fn(() => <svg data-testid="calendar-icon" />),
    Star: vi.fn(() => <svg data-testid="star-icon" />),
    Phone: vi.fn(() => <svg data-testid="phone-icon" />),
    Mail: vi.fn(() => <svg data-testid="mail-icon" />),
    Users: vi.fn(() => <svg data-testid="users-icon" />),
    Loader2: vi.fn(() => <svg data-testid="loader-icon" />),
  };
});

// Mock shadcn/ui components that might cause issues or are not relevant for unit testing logic
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
}));
vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  CardContent: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  CardHeader: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  CardTitle: vi.fn(({ children, ...props }) => <h2 {...props}>{children}</h2>),
}));
vi.mock('@/components/ui/input', () => ({
  Input: vi.fn((props) => <input {...props} />),
}));
vi.mock('@/components/ui/label', () => ({
  Label: vi.fn(({ children, ...props }) => <label {...props}>{children}</label>),
}));
vi.mock('@/components/ui/textarea', () => ({
  Textarea: vi.fn((props) => <textarea {...props} />),
}));
vi.mock('@/components/ui/switch', () => ({
  Switch: vi.fn((props) => <input type="checkbox" {...props} />),
}));


describe('EventsManager', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Culto Dominical',
      description: 'Servicio de adoración semanal',
      date: '2025-07-28',
      time: '10:00',
      location: 'Iglesia Central',
      category: 'culto',
      capacity: 200,
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'Estudio Bíblico',
      description: 'Estudio sobre el libro de Juan',
      date: '2025-07-30',
      time: '19:00',
      location: 'Salón Parroquial',
      category: 'estudio',
      capacity: 50,
      status: 'scheduled',
    },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Default mock implementations
    (useEvents as vi.Mock).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    (useCreateEvent as vi.Mock).mockReturnValue({
      mutateAsync: vi.fn(() => Promise.resolve()),
      isPending: false,
    });
    (useUpdateEvent as vi.Mock).mockReturnValue({
      mutateAsync: vi.fn(() => Promise.resolve()),
      isPending: false,
    });
    (useDeleteEvent as vi.Mock).mockReturnValue({
      mutateAsync: vi.fn(() => Promise.resolve()),
      isPending: false,
    });
    (useDeleteConfirmation as vi.Mock).mockReturnValue({
      confirm: vi.fn(() => Promise.resolve(true)),
    });
  });

  it('renders the component correctly with existing events', () => {
    render(<EventsManager />);

    expect(screen.getByText('Gestión de Eventos')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Evento')).toBeInTheDocument();
    expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
    expect(screen.getByText('Estudio Bíblico')).toBeInTheDocument();
    expect(screen.getByText('Iglesia Central')).toBeInTheDocument();
    expect(screen.getByText('Salón Parroquial')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (useEvents as vi.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    render(<EventsManager />);
    expect(screen.getByText('Cargando eventos...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to fetch events';
    (useEvents as vi.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error(errorMessage),
      refetch: vi.fn(),
    });
    render(<EventsManager />);
    expect(screen.getByText(`Error al cargar eventos: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('shows the form when "Nuevo Evento" button is clicked', async () => {
    render(<EventsManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo Evento' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nuevo Evento' })).toBeInTheDocument(); // Form title
      expect(screen.getByLabelText('Título')).toBeInTheDocument();
      expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crear Evento/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });
  });

  it('hides the form when "Cancelar" button is clicked', async () => {
    render(<EventsManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo Evento' })); // Open form
    await waitFor(() => {
      expect(screen.getByLabelText('Título')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' })); // Close form
    await waitFor(() => {
      expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    });
  });

  it('creates a new event', async () => {
    const mockCreateEvent = vi.fn(() => Promise.resolve());
    (useCreateEvent as vi.Mock).mockReturnValue({
      mutateAsync: mockCreateEvent,
      isPending: false,
    });

    render(<EventsManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo Evento' }));

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo Evento Test' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Descripción del nuevo evento' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'Salón Principal' } });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'especial' } });
    fireEvent.change(screen.getByLabelText('Capacidad (Opcional)'), { target: { value: '100' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear Evento/i }));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        title: 'Nuevo Evento Test',
        description: 'Descripción del nuevo evento',
        date: '2025-08-01',
        time: '18:00',
        location: 'Salón Principal',
        category: 'especial',
        capacity: 100,
      });
    });

    // Verify form is hidden and reset
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    expect(screen.queryByText('Nuevo Evento Test')).not.toBeInTheDocument(); // Should not be on screen yet, as useEvents is mocked to return old data
  });

  it('edits an existing event', async () => {
    const mockUpdateEvent = vi.fn(() => Promise.resolve());
    (useUpdateEvent as vi.Mock).mockReturnValue({
      mutateAsync: mockUpdateEvent,
      isPending: false,
    });

    render(<EventsManager />);

    // Click edit button for the first event
    const editButtons = screen.getAllByTestId('edit-icon');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Editar Evento' })).toBeInTheDocument();
      expect(screen.getByLabelText('Título')).toHaveValue('Culto Dominical');
    });

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Culto Dominical Actualizado' } });
    fireEvent.click(screen.getByRole('button', { name: /Actualizar Evento/i }));

    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith({
        id: '1',
        title: 'Culto Dominical Actualizado',
        description: 'Servicio de adoración semanal',
        date: '2025-07-28',
        time: '10:00',
        location: 'Iglesia Central',
        category: 'culto',
        capacity: 200,
      });
    });

    // Verify form is hidden and reset
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
  });

  it('deletes an event', async () => {
    const mockDeleteEvent = vi.fn(() => Promise.resolve());
    (useDeleteEvent as vi.Mock).mockReturnValue({
      mutateAsync: mockDeleteEvent,
      isPending: false,
    });

    render(<EventsManager />);

    // Click delete button for the first event
    const deleteButtons = screen.getAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect((useDeleteConfirmation as vi.Mock).mock.results[0].value.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar este evento?');
      expect(mockDeleteEvent).toHaveBeenCalledWith('1');
    });
  });

  it('does not delete an event if confirmation is cancelled', async () => {
    const mockDeleteEvent = vi.fn(() => Promise.resolve());
    (useDeleteEvent as vi.Mock).mockReturnValue({
      mutateAsync: mockDeleteEvent,
      isPending: false,
    });

    // Override the default mock for this specific test
    (useDeleteConfirmation as vi.Mock).mockReturnValue({
      confirm: vi.fn(() => Promise.resolve(false)),
    });

    render(<EventsManager />);

    const deleteButtons = screen.getAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect((useDeleteConfirmation as vi.Mock).mock.results[0].value.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar este evento?');
      expect(mockDeleteEvent).not.toHaveBeenCalled();
    });
  });
});
