import { Response } from 'express';
import { 
  getAllVisitors, 
  createVisitor, 
  updateVisitor, 
  deleteVisitor
} from '../../src/controllers/visitorsController';
import { 
  createResponseMock,
  createSupabaseSuccess
} from '../helpers/testHelpers';
import { mockSupabaseClient } from '../setup';

describe('Visitors Controller', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = createResponseMock();
    jest.clearAllMocks();
  });

  describe('getAllVisitors', () => {
    it('should return all visitors successfully', async () => {
      const mockVisitors = [
        { id: 'visitor-1', name: 'Visitor 1' },
        { id: 'visitor-2', name: 'Visitor 2' }
      ];
      mockSupabaseClient.select.mockResolvedValueOnce(createSupabaseSuccess(mockVisitors));

      const req = {} as any;

      await getAllVisitors(req, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('visitors');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockVisitors
      });
    });

    it('should handle database error', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const req = {} as any;

      await getAllVisitors(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createVisitor', () => {
    it('should create visitor successfully', async () => {
      const newVisitor = { id: 'visitor-new', name: 'New Visitor' };
      mockSupabaseClient.select.mockResolvedValueOnce(createSupabaseSuccess([newVisitor]));

      const req = {
        body: {
          name: 'New Visitor',
          email: 'visitor@example.com'
        }
      } as any;

      await createVisitor(req, mockRes as Response);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([req.body]);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateVisitor', () => {
    it('should update visitor successfully', async () => {
      const updatedVisitor = { id: 'visitor-1', name: 'Updated Visitor' };
      mockSupabaseClient.select.mockResolvedValueOnce(createSupabaseSuccess([updatedVisitor]));

      const req = {
        params: { id: 'visitor-1' },
        body: { name: 'Updated Visitor' }
      } as any;

      await updateVisitor(req, mockRes as Response);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(req.body);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'visitor-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteVisitor', () => {
    it('should delete visitor successfully', async () => {
      mockSupabaseClient.delete.mockResolvedValueOnce({ data: null, error: null });

      const req = {
        params: { id: 'visitor-1' }
      } as any;

      await deleteVisitor(req, mockRes as Response);

      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'visitor-1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });
});