import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StreamsManager from './StreamsManager';
import { useStreams, useCreateStream, useUpdateStream, useDeleteStream } from '@/hooks/useStreams';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';

// Mock the custom hooks
vi.mock('@/hooks/useStreams', () => ({
  useStreams: vi.fn(),
  useCreateStream: vi.fn(),
  useUpdateStream: vi.fn(),
  useDeleteStream: vi.fn(),
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
    Video: vi.fn(() => <svg data-testid="video-icon" />),
    ExternalLink: vi.fn(() => <svg data-testid="external-link-icon" />),
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

describe('StreamsManager', () => {
  const mockStreams = [
    {
      id: '1',
      title: 'Culto Dominical en Vivo',
      description: 'Transmisión en vivo del servicio dominical',
      streamUrl: 'https://youtube.com/live/stream1',
      scheduledDate: '2025-07-28',
      scheduledTime: '10:00',
      platform: 'youtube',
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'Estudio Bíblico Online',
      description: 'Estudio interactivo de la Biblia',
      streamUrl: 'https://facebook.com/live/stream2',
      scheduledDate: '2025-07-30',
      scheduledTime: '19:00',
      platform: 'facebook',
      status: 'live',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useStreams as vi.Mock).mockReturnValue({
      data: mockStreams,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    (useCreateStream as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useUpdateStream as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useDeleteStream as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useDeleteConfirmation as vi.Mock).mockReturnValue({
      confirm: vi.fn(() => Promise.resolve(true)),
    });
  });

  it('renders the component correctly with existing streams', () => {
    render(<StreamsManager />);

    expect(screen.getByText('Gestión de Transmisiones')).toBeInTheDocument();
    expect(screen.getByText('Nueva Transmisión')).toBeInTheDocument();
    expect(screen.getByText('Culto Dominical en Vivo')).toBeInTheDocument();
    expect(screen.getByText('Estudio Bíblico Online')).toBeInTheDocument();
    expect(screen.getByText('Transmisión en vivo del servicio dominical')).toBeInTheDocument();
    expect(screen.getByText('Estudio interactivo de la Biblia')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (useStreams as vi.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    render(<StreamsManager />);
    expect(screen.getByText('Cargando transmisiones...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to fetch streams';
    (useStreams as vi.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error(errorMessage),
      refetch: vi.fn(),
    });
    render(<StreamsManager />);
    expect(screen.getByText(`Error al cargar transmisiones: ${errorMessage}`)).toBeInTheDocument();
  });

  it('shows the form when "Nueva Transmisión" button is clicked', async () => {
    render(<StreamsManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva Transmisión' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nueva Transmisión' })).toBeInTheDocument();
      expect(screen.getByLabelText('Título')).toBeInTheDocument();
      expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
      expect(screen.getByLabelText('URL de la Transmisión')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
      expect(screen.getByLabelText('Hora')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crear Transmisión/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });
  });

  it('hides the form when "Cancelar" button is clicked', async () => {
    render(<StreamsManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva Transmisión' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Título')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    });
  });

  it('creates a new stream', async () => {
    const mockCreateStream = vi.fn((_data, { onSuccess }) => onSuccess());
    (useCreateStream as vi.Mock).mockReturnValue({
      mutate: mockCreateStream,
      isPending: false,
    });

    render(<StreamsManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva Transmisión' }));

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo Stream Test' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Descripción del nuevo stream' } });
    fireEvent.change(screen.getByLabelText('URL de la Transmisión'), { target: { value: 'https://test.com/new-stream' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText('Plataforma'), { target: { value: 'custom' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear Transmisión/i }));

    await waitFor(() => {
      expect(mockCreateStream).toHaveBeenCalledWith(
        {
          title: 'Nuevo Stream Test',
          description: 'Descripción del nuevo stream',
          streamUrl: 'https://test.com/new-stream',
          scheduledDate: '2025-08-01',
          scheduledTime: '18:00',
          platform: 'custom',
        },
        expect.any(Object)
      );
    });

    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
  });

  it('edits an existing stream', async () => {
    const mockUpdateStream = vi.fn((_data, { onSuccess }) => onSuccess());
    (useUpdateStream as vi.Mock).mockReturnValue({
      mutate: mockUpdateStream,
      isPending: false,
    });

    render(<StreamsManager />);

    const editButtons = screen.getAllByTestId('edit-icon');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Editar Transmisión' })).toBeInTheDocument();
      expect(screen.getByLabelText('Título')).toHaveValue('Culto Dominical en Vivo');
    });

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Culto Dominical Actualizado' } });
    fireEvent.click(screen.getByRole('button', { name: /Actualizar Transmisión/i }));

    await waitFor(() => {
      expect(mockUpdateStream).toHaveBeenCalledWith(
        {
          id: '1',
          title: 'Culto Dominical Actualizado',
          description: 'Transmisión en vivo del servicio dominical',
          streamUrl: 'https://youtube.com/live/stream1',
          scheduledDate: '2025-07-28',
          scheduledTime: '10:00',
          platform: 'youtube',
        },
        expect.any(Object)
      );
    });

    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
  });

  it('deletes a stream', async () => {
    const mockDeleteStream = vi.fn();
    (useDeleteStream as vi.Mock).mockReturnValue({
      mutate: mockDeleteStream,
      isPending: false,
    });

    const mockConfirm = vi.fn(() => Promise.resolve(true));
    (useDeleteConfirmation as vi.Mock).mockReturnValue({ confirm: mockConfirm });

    render(<StreamsManager />);

    const deleteButtons = screen.getAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar esta transmisión?');
      expect(mockDeleteStream).toHaveBeenCalledWith('1');
    });
  });

  it('does not delete a stream if confirmation is cancelled', async () => {
    const mockDeleteStream = vi.fn();
    (useDeleteStream as vi.Mock).mockReturnValue({
      mutate: mockDeleteStream,
      isPending: false,
    });

    const mockConfirm = vi.fn(() => Promise.resolve(false));
    (useDeleteConfirmation as vi.Mock).mockReturnValue({ confirm: mockConfirm });

    render(<StreamsManager />);

    const deleteButtons = screen.getAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar esta transmisión?');
      expect(mockDeleteStream).not.toHaveBeenCalled();
    });
  });
});