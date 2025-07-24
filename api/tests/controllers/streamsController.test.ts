import { Response } from 'express';
import { 
  getStreams, 
  getStreamById, 
  createStream, 
  updateStream, 
  deleteStream,
  getStreamStats 
} from '../../src/controllers/streamsController';
import { 
  createAuthenticatedRequest, 
  createResponseMock, 
  createMockStream,
  createSupabaseSuccess,
  createSupabaseError
} from '../helpers/testHelpers';
import { mockSupabaseClient } from '../setup';

describe('Streams Controller', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = createResponseMock();
    jest.clearAllMocks();
  });

  describe('getStreams', () => {
    it('should return paginated streams successfully', async () => {
      const mockStreams = [createMockStream(), createMockStream({ id: 'stream-2' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStreams, 2));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { page: 1, limit: 10 });

      await getStreams(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('live_streams');
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

    it('should filter by status', async () => {
      const mockStreams = [createMockStream({ status: 'live' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStreams, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { status: 'live' });

      await getStreams(req as any, mockRes as Response);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'live');
    });

    it('should filter by date range', async () => {
      const mockStreams = [createMockStream()];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStreams, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { 
        startDate: '2025-07-01',
        endDate: '2025-07-31'
      });

      await getStreams(req as any, mockRes as Response);

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('data_inicio', '2025-07-01');
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('data_inicio', '2025-07-31');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseError('Database error'));

      const req = createAuthenticatedRequest('user-1', 'member');

      await expect(getStreams(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('getStreamById', () => {
    it('should return stream by id successfully', async () => {
      const mockStream = createMockStream();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStream));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'stream-1' });

      await getStreamById(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('live_streams');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'stream-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'stream-1',
          title: 'Culto Dominical en Vivo'
        })
      });
    });

    it('should return 404 when stream not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(null));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'nonexistent' });

      await expect(getStreamById(req as any, mockRes as Response)).rejects.toThrow('Stream não encontrado');
    });
  });

  describe('createStream', () => {
    it('should create stream successfully as leader', async () => {
      const mockStream = createMockStream();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStream));

      const streamData = {
        title: 'Nueva Transmisión',
        description: 'Descripción de la transmisión',
        streamUrl: 'https://youtube.com/live/new-stream',
        scheduledDate: '2025-08-01',
        scheduledTime: '18:00',
        platform: 'youtube'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', streamData);

      await createStream(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('live_streams');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        titulo: 'Nueva Transmisión',
        descricao: 'Descripción de la transmisión',
        url_stream: 'https://youtube.com/live/new-stream',
        created_by: 'leader-1'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors', async () => {
      const req = createAuthenticatedRequest('leader-1', 'leader', {
        title: '', // Invalid empty title
      });

      await expect(createStream(req as any, mockRes as Response)).rejects.toThrow();
    });

    it('should validate stream URL format', async () => {
      const req = createAuthenticatedRequest('leader-1', 'leader', {
        title: 'Test Stream',
        streamUrl: 'invalid-url'
      });

      await expect(createStream(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('updateStream', () => {
    it('should update stream successfully', async () => {
      const updatedStream = createMockStream({ titulo: 'Stream Actualizado' });
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(updatedStream));

      const updateData = {
        title: 'Stream Actualizado',
        description: 'Nueva descripción',
        status: 'live'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData, { id: 'stream-1' });

      await updateStream(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('live_streams');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        titulo: 'Stream Actualizado',
        descricao: 'Nueva descripción',
        status: 'live'
      }));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'stream-1');
    });

    it('should return 404 when updating nonexistent stream', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(null));

      const req = createAuthenticatedRequest('leader-1', 'leader', { title: 'Test' }, { id: 'nonexistent' });

      await expect(updateStream(req as any, mockRes as Response)).rejects.toThrow('Stream não encontrado');
    });

    it('should prevent updating stream status to invalid value', async () => {
      const req = createAuthenticatedRequest('leader-1', 'leader', {
        status: 'invalid-status'
      }, { id: 'stream-1' });

      await expect(updateStream(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('deleteStream', () => {
    it('should delete stream successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 1 }));

      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'stream-1' });

      await deleteStream(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('live_streams');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'stream-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Stream deletado com sucesso'
      });
    });

    it('should return 404 when deleting nonexistent stream', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 0 }));

      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'nonexistent' });

      await expect(deleteStream(req as any, mockRes as Response)).rejects.toThrow('Stream não encontrado');
    });

    it('should prevent deletion of live streams', async () => {
      const liveStream = createMockStream({ status: 'live' });
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess(liveStream)) // Check stream exists and is live
        .mockResolvedValueOnce(createSupabaseSuccess({ count: 0 })); // Prevent deletion

      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'stream-1' });

      await expect(deleteStream(req as any, mockRes as Response)).rejects.toThrow('Não é possível deletar uma transmissão em andamento');
    });
  });

  describe('getStreamStats', () => {
    it('should return stream statistics', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 15 }])) // total
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 2 }]))  // live
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 8 }]))  // scheduled
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 5 }]))  // completed
        .mockResolvedValueOnce(createSupabaseSuccess([{ total_views: 1250 }])); // total views

      const req = createAuthenticatedRequest();

      await getStreamStats(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          total: 15,
          live: 2,
          scheduled: 8,
          completed: 5,
          totalViews: 1250
        })
      });
    });

    it('should handle missing view statistics gracefully', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 10 }]))
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 1 }]))
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 5 }]))
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 4 }]))
        .mockResolvedValueOnce(createSupabaseSuccess([{ total_views: null }])); // No views

      const req = createAuthenticatedRequest();

      await getStreamStats(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalViews: 0 // Should default to 0
        })
      });
    });
  });

  describe('Stream URL validation', () => {
    it('should accept valid YouTube URLs', async () => {
      const mockStream = createMockStream();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStream));

      const streamData = {
        title: 'Test Stream',
        streamUrl: 'https://youtube.com/live/abc123',
        platform: 'youtube'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', streamData);

      await createStream(req as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should accept valid Facebook URLs', async () => {
      const mockStream = createMockStream();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStream));

      const streamData = {
        title: 'Test Stream',
        streamUrl: 'https://facebook.com/live/xyz789',
        platform: 'facebook'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', streamData);

      await createStream(req as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should reject invalid URLs', async () => {
      const streamData = {
        title: 'Test Stream',
        streamUrl: 'not-a-valid-url',
        platform: 'youtube'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', streamData);

      await expect(createStream(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('Stream scheduling', () => {
    it('should schedule stream for future date', async () => {
      const mockStream = createMockStream({ status: 'scheduled' });
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockStream));

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const streamData = {
        title: 'Future Stream',
        scheduledDate: futureDate.toISOString().split('T')[0],
        scheduledTime: '10:00',
        status: 'scheduled'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', streamData);

      await createStream(req as any, mockRes as Response);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'scheduled'
      }));
    });

    it('should prevent scheduling stream for past date', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const streamData = {
        title: 'Past Stream',
        scheduledDate: pastDate.toISOString().split('T')[0],
        scheduledTime: '10:00'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', streamData);

      await expect(createStream(req as any, mockRes as Response)).rejects.toThrow('Não é possível agendar transmissão para data passada');
    });
  });
});