import { Response } from 'express';
import { 
  getEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getEventStats,
  registerForEvent,
  unregisterFromEvent 
} from '../../src/controllers/eventsController';
import { 
  createAuthenticatedRequest, 
  createResponseMock, 
  createMockEvent,
  createSupabaseSuccess,
  createSupabaseError
} from '../helpers/testHelpers';
import { mockSupabaseClient } from '../setup';

describe('Events Controller', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = createResponseMock();
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should return paginated events successfully', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-2' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockEvents, 2));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { page: 1, limit: 10 });

      await getEvents(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 10
        })
      });
    });

    it('should filter upcoming events', async () => {
      const mockEvents = [createMockEvent()];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockEvents, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { upcoming: 'true' });

      await getEvents(req as any, mockRes as Response);

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('data_inicio', expect.any(String));
    });

    it('should filter past events', async () => {
      const mockEvents = [createMockEvent()];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockEvents, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { past: 'true' });

      await getEvents(req as any, mockRes as Response);

      expect(mockSupabaseClient.lt).toHaveBeenCalledWith('data_inicio', expect.any(String));
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseError('Database error'));

      const req = createAuthenticatedRequest('user-1', 'member');

      await expect(getEvents(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('getEventById', () => {
    it('should return event by id successfully', async () => {
      const mockEvent = createMockEvent();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockEvent));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'event-1' });

      await getEventById(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'event-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'event-1',
          title: 'Culto Dominical'
        })
      });
    });

    it('should return 404 when event not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(null));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'nonexistent' });

      await expect(getEventById(req as any, mockRes as Response)).rejects.toThrow('Evento não encontrado');
    });
  });

  describe('createEvent', () => {
    it('should create event successfully as leader', async () => {
      const mockEvent = createMockEvent();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockEvent));

      const eventData = {
        title: 'Nuevo Evento',
        description: 'Descripción del evento',
        date: '2025-08-01',
        time: '18:00',
        location: 'Iglesia Central',
        capacity: 100
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', eventData);

      await createEvent(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        titulo: 'Nuevo Evento',
        descricao: 'Descripción del evento',
        local: 'Iglesia Central',
        max_participantes: 100,
        created_by: 'leader-1'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors', async () => {
      const req = createAuthenticatedRequest('leader-1', 'leader', {
        title: '', // Invalid empty title
      });

      await expect(createEvent(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const updatedEvent = createMockEvent({ titulo: 'Evento Actualizado' });
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(updatedEvent));

      const updateData = {
        title: 'Evento Actualizado',
        description: 'Nueva descripción'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData, { id: 'event-1' });

      await updateEvent(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        titulo: 'Evento Actualizado',
        descricao: 'Nueva descripción'
      }));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'event-1');
    });

    it('should return 404 when updating nonexistent event', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(null));

      const req = createAuthenticatedRequest('leader-1', 'leader', { title: 'Test' }, { id: 'nonexistent' });

      await expect(updateEvent(req as any, mockRes as Response)).rejects.toThrow('Evento não encontrado');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 1 }));

      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'event-1' });

      await deleteEvent(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'event-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Evento deletado com sucesso'
      });
    });

    it('should return 404 when deleting nonexistent event', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 0 }));

      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'nonexistent' });

      await expect(deleteEvent(req as any, mockRes as Response)).rejects.toThrow('Evento não encontrado');
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics', async () => {
      const mockStats = {
        total_events: 10,
        upcoming_events: 5,
        past_events: 5,
        this_month_events: 3
      };

      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 10 }])) // total
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 5 }]))  // upcoming
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 5 }]))  // past
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 3 }])); // this month

      const req = createAuthenticatedRequest();

      await getEventStats(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          total: expect.any(Number),
          upcoming: expect.any(Number),
          past: expect.any(Number),
          thisMonth: expect.any(Number)
        })
      });
    });
  });

  describe('registerForEvent', () => {
    it('should register user for event successfully', async () => {
      // Mock event exists
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess(createMockEvent()))
        .mockResolvedValueOnce(createSupabaseSuccess(null)) // Not already registered
        .mockResolvedValueOnce(createSupabaseSuccess({ id: 'registration-1' })); // Registration created

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'event-1' });

      await registerForEvent(req as any, mockRes as Response);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        event_id: 'event-1',
        user_id: 'user-1',
        registered_at: expect.any(String)
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should prevent duplicate registration', async () => {
      // Mock event exists and user already registered
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess(createMockEvent()))
        .mockResolvedValueOnce(createSupabaseSuccess({ id: 'existing-registration' }));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'event-1' });

      await expect(registerForEvent(req as any, mockRes as Response)).rejects.toThrow('Usuário já está inscrito neste evento');
    });
  });

  describe('unregisterFromEvent', () => {
    it('should unregister user from event successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 1 }));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'event-1' });

      await unregisterFromEvent(req as any, mockRes as Response);

      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Inscrição cancelada com sucesso'
      });
    });

    it('should return 404 when registration not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 0 }));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'event-1' });

      await expect(unregisterFromEvent(req as any, mockRes as Response)).rejects.toThrow('Inscrição não encontrada');
    });
  });
});