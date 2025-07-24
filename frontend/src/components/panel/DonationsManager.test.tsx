import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DonationsManager from './DonationsManager';
import { useDonationInfo, useUpdateDonationInfo } from '../../hooks/useDonations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  DollarSign: vi.fn(() => <svg data-testid="dollar-sign-icon" />),
  Loader2: vi.fn(() => <svg data-testid="loader-icon" />),
  Save: vi.fn(() => <svg data-testid="save-icon" />),
  X: vi.fn(() => <svg data-testid="x-icon" />),
  Edit: vi.fn(() => <svg data-testid="edit-icon" />),
  RefreshCw: vi.fn(() => <svg data-testid="refresh-icon" />),
}));

// Mock hooks
vi.mock('../../hooks/useDonations');

const mockUseDonationInfo = useDonationInfo as vi.Mock;
const mockUseUpdateDonationInfo = useUpdateDonationInfo as vi.Mock;

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DonationsManager />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('DonationsManager', () => {
  const mockDonationInfo = {
    id: '1',
    iban: 'ES1021001419020200597614',
    bic: 'BANKESBBXXX',
    titular: 'Iglesia Ejemplo',
    bizum: '612345678',
    verse: 'Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre. - 2 Corintios 9:7a',
    additionalMethods: 'Transferencia bancaria, PayPal, Efectivo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseDonationInfo.mockReturnValue({
      data: mockDonationInfo,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseUpdateDonationInfo.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the component correctly with existing donation info', () => {
    renderComponent();

    expect(screen.getByLabelText('IBAN')).toHaveValue(mockDonationInfo.iban);
    expect(screen.getByLabelText('BIC/SWIFT')).toHaveValue(mockDonationInfo.bic);
    expect(screen.getByLabelText('Titular')).toHaveValue(mockDonationInfo.titular);
    expect(screen.getByLabelText('Bizum')).toHaveValue(mockDonationInfo.bizum);
    expect(screen.getByLabelText('Versículo Bíblico')).toHaveValue(mockDonationInfo.verse);
    expect(screen.getByLabelText('Métodos Adicionales de Donación')).toHaveValue(mockDonationInfo.additionalMethods);

    // Check public preview
    expect(screen.getByText(`IBAN:`).parentNode).toHaveTextContent(mockDonationInfo.iban);
    expect(screen.getByText(`BIC/SWIFT:`).parentNode).toHaveTextContent(mockDonationInfo.bic);
    expect(screen.getByText(`Titular:`).parentNode).toHaveTextContent(mockDonationInfo.titular);
    expect(screen.getByText(`Bizum:`).parentNode).toHaveTextContent(mockDonationInfo.bizum);
    expect(screen.getByText(`Métodos Adicionales:`).parentNode).toHaveTextContent(mockDonationInfo.additionalMethods);
    expect(screen.getByText(mockDonationInfo.verse, { selector: 'em' })).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseDonationInfo.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText(/Cargando información de donaciones.../i)).toBeInTheDocument();
  });

  it('displays error state and retry button', () => {
    const errorMessage = 'Failed to fetch donation info';
    mockUseDonationInfo.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage),
      refetch: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText(`Error al cargar información de donaciones: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('displays "No se encontró información" when no data is returned', () => {
    mockUseDonationInfo.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText(/No se encontró información de donaciones./i)).toBeInTheDocument();
  });

  it('enables editing when "Editar Información" button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Editar Información/i }));
    expect(screen.getByLabelText('IBAN')).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('disables editing and resets form when "Cancelar" button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Editar Información/i }));
    fireEvent.change(screen.getByLabelText('IBAN'), { target: { value: 'NEWIBAN' } });
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.getByLabelText('IBAN')).toBeDisabled();
    expect(screen.getByLabelText('IBAN')).toHaveValue(mockDonationInfo.iban);
  });

  it('saves updated donation information', async () => {
    const updateMutation = mockUseUpdateDonationInfo().mutateAsync;
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Editar Información/i }));
    fireEvent.change(screen.getByLabelText('IBAN'), { target: { value: 'UPDATEDIBAN' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(updateMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          iban: 'UPDATEDIBAN',
        })
      );
    });
    expect(screen.getByLabelText('IBAN')).toBeDisabled();
  });

  it('disables edit button when update is pending', () => {
    const updateMutation = vi.fn();
    mockUseUpdateDonationInfo.mockReturnValue({
      mutateAsync: updateMutation,
      isPending: true, // Set to true to test loading state
    });
    renderComponent();

    const editButton = screen.getByRole('button', { name: /Editar Información/i });
    expect(editButton).toBeDisabled();
  });
});
