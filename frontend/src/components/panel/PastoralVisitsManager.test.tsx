import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PastoralVisitsManager from './PastoralVisitsManager';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
vi.spyOn(window, 'confirm').mockReturnValue(true);

describe('PastoralVisitsManager', () => {
  const mockVisits = [
    {
      id: '1',
      date: '2025-07-20',
      visitedPerson: 'Familia Pérez',
      visitType: 'domicilio',
      reason: 'Consejería',
      notes: 'Se oró por la salud de Juan.',
      followUpNeeded: true,
      followUpDate: '2025-07-27',
    },
  ];

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the component with existing pastoral visits', () => {
    window.localStorage.setItem('pastoralVisits', JSON.stringify(mockVisits));
    render(<PastoralVisitsManager />);
    expect(screen.getByText('Familia Pérez')).toBeInTheDocument();
  });

  it('shows the form when "Nueva Visita" button is clicked', async () => {
    render(<PastoralVisitsManager />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva Visita/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nueva Visita Pastoral' })).toBeInTheDocument();
    });
  });

  it('creates a new pastoral visit', async () => {
    render(<PastoralVisitsManager />);
    fireEvent.click(screen.getByRole('button', { name: /Nueva Visita/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Persona o Familia Visitada')).toBeInTheDocument();
    });

    // Fill all required fields
    fireEvent.change(screen.getByLabelText('Persona o Familia Visitada'), { target: { value: 'Nueva Familia' } });
    fireEvent.change(screen.getByLabelText('Fecha de la Visita'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByLabelText('Motivo de la Visita'), { target: { value: 'Test Reason' } });
    fireEvent.change(screen.getByLabelText('Notas Pastorales'), { target: { value: 'Test notes' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar Visita/i }));

    await waitFor(() => {
      const storedVisits = JSON.parse(window.localStorage.getItem('pastoralVisits') || '[]');
      expect(storedVisits).toHaveLength(1);
      expect(storedVisits[0].visitedPerson).toBe('Nueva Familia');
    });
  });
});