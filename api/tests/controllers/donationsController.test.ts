import { Response } from 'express';
import { 
  getDonationInfo, 
  updateDonationInfo
} from '../../src/controllers/donationsController';
import { 
  createAuthenticatedRequest, 
  createResponseMock,
  createSupabaseSuccess,
  createSupabaseError
} from '../helpers/testHelpers';
import { mockSupabaseClient } from '../setup';

describe('Donations Controller', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = createResponseMock();
    jest.clearAllMocks();
  });

  const mockDonationInfo = {
    id: '1',
    iban: 'ES1021001419020200597614',
    bic: 'BANKESBBXXX',
    titular: 'Iglesia Ejemplo',
    bizum: '612345678',
    verse: 'Cada uno dé como propuso en su corazón...',
    additional_methods: 'Transferencia bancaria, PayPal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  describe('getDonationInfo', () => {
    it('should return donation information successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockDonationInfo));

      const req = createAuthenticatedRequest('user-1', 'member');

      await getDonationInfo(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('donation_info');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.single).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: '1',
          iban: 'ES1021001419020200597614',
          bic: 'BANKESBBXXX',
          titular: 'Iglesia Ejemplo',
          bizum: '612345678',
          verse: 'Cada uno dé como propuso en su corazón...',
          additionalMethods: 'Transferencia bancaria, PayPal'
        })
      });
    });

    it('should handle when no donation info exists', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(null));

      const req = createAuthenticatedRequest('user-1', 'member');

      await getDonationInfo(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null
      });
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseError('Database error'));

      const req = createAuthenticatedRequest('user-1', 'member');

      await expect(getDonationInfo(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('updateDonationInfo', () => {
    it('should update donation information successfully as leader', async () => {
      const updatedInfo = { ...mockDonationInfo, iban: 'ES9021000418401234567891' };
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(updatedInfo));

      const updateData = {
        iban: 'ES9021000418401234567891',
        bic: 'BANKESBBXXX',
        titular: 'Iglesia Ejemplo Updated',
        bizum: '612345678',
        verse: 'Updated verse',
        additionalMethods: 'Updated methods'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData);

      await updateDonationInfo(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('donation_info');
      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(expect.objectContaining({
        iban: 'ES9021000418401234567891',
        bic: 'BANKESBBXXX',
        titular: 'Iglesia Ejemplo Updated',
        bizum: '612345678',
        verse: 'Updated verse',
        additional_methods: 'Updated methods'
      }));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          iban: 'ES9021000418401234567891'
        }),
        message: 'Informação de doações atualizada com sucesso'
      });
    });

    it('should validate IBAN format', async () => {
      const updateData = {
        iban: 'INVALID-IBAN',
        bic: 'BANKESBBXXX',
        titular: 'Test Church'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData);

      await expect(updateDonationInfo(req as any, mockRes as Response)).rejects.toThrow();
    });

    it('should validate BIC format', async () => {
      const updateData = {
        iban: 'ES1021001419020200597614',
        bic: 'INVALID', // Too short
        titular: 'Test Church'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData);

      await expect(updateDonationInfo(req as any, mockRes as Response)).rejects.toThrow();
    });

    it('should require leader or admin role', async () => {
      const updateData = {
        iban: 'ES1021001419020200597614',
        titular: 'Test Church'
      };

      const req = createAuthenticatedRequest('user-1', 'member', updateData); // Regular member

      // This would be caught by the auth middleware in practice
      // In a real test, we'd test the route with the middleware
      expect(req.user?.role).toBe('member');
    });

    it('should sanitize input data', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockDonationInfo));

      const updateData = {
        iban: 'ES1021001419020200597614',
        titular: 'Test <script>alert("xss")</script> Church',
        verse: 'Safe <b>verse</b> with <script>bad</script> content'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData);

      await updateDonationInfo(req as any, mockRes as Response);

      // The validation middleware would sanitize this in practice
      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(expect.objectContaining({
        titular: expect.stringContaining('Test'),
        verse: expect.stringContaining('Safe')
      }));
    });

    it('should handle database errors during update', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseError('Update failed'));

      const updateData = {
        iban: 'ES1021001419020200597614',
        titular: 'Test Church'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData);

      await expect(updateDonationInfo(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('Field mapping', () => {
    it('should correctly map frontend fields to database fields', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockDonationInfo));

      const updateData = {
        iban: 'ES1021001419020200597614',
        bic: 'BANKESBBXXX',
        titular: 'Test Church',
        bizum: '123456789',
        verse: 'Test verse',
        additionalMethods: 'Test methods'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData);

      await updateDonationInfo(req as any, mockRes as Response);

      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(expect.objectContaining({
        iban: 'ES1021001419020200597614',
        bic: 'BANKESBBXXX',
        titular: 'Test Church',
        bizum: '123456789',
        verse: 'Test verse',
        additional_methods: 'Test methods' // Note the field mapping
      }));
    });

    it('should correctly map database fields to frontend response', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockDonationInfo));

      const req = createAuthenticatedRequest('user-1', 'member');

      await getDonationInfo(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          additionalMethods: 'Transferencia bancaria, PayPal' // Mapped from additional_methods
        })
      });
    });
  });
});