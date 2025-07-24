import { Response } from 'express';
import { 
  getMinistries, 
  getMinistryById, 
  createMinistry, 
  updateMinistry, 
  deleteMinistry,
  getMinistryStats,
  getMinistryMembers,
  addMemberToMinistry,
  removeMemberFromMinistry
} from '../../src/controllers/ministriesController';
import { 
  createAuthenticatedRequest, 
  createResponseMock, 
  createMockMinistry,
  createSupabaseSuccess,
  createSupabaseError
} from '../helpers/testHelpers';
import { mockSupabaseClient } from '../setup';

describe('Ministries Controller', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = createResponseMock();
    jest.clearAllMocks();
  });

  describe('getMinistries', () => {
    it('should return paginated ministries successfully', async () => {
      const mockMinistries = [createMockMinistry(), createMockMinistry({ id: 'ministry-2' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMinistries, 2));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { page: 1, limit: 10 });

      await getMinistries(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ministries');
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

    it('should filter by active status', async () => {
      const mockMinistries = [createMockMinistry({ active: true })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMinistries, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { active: 'true' });

      await getMinistries(req as any, mockRes as Response);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('active', true);
    });
  });

  describe('createMinistry', () => {
    it('should create ministry successfully as leader', async () => {
      const mockMinistry = createMockMinistry();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMinistry));

      const ministryData = {
        name: 'Nuevo Ministerio',
        description: 'Descripción del ministerio',
        leaderId: 'leader-1',
        meetingDay: 'martes',
        meetingTime: '19:00',
        meetingLocation: 'Salón B'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', ministryData);

      await createMinistry(req as any, mockRes as Response);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Nuevo Ministerio',
        description: 'Descripción del ministerio',
        leader_id: 'leader-1',
        meeting_day: 'martes',
        meeting_time: '19:00',
        meeting_location: 'Salón B',
        active: true
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateMinistry', () => {
    it('should update ministry successfully', async () => {
      const updatedMinistry = createMockMinistry({ name: 'Ministerio Actualizado' });
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(updatedMinistry));

      const updateData = {
        name: 'Ministerio Actualizado',
        meetingTime: '20:00'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData, { id: 'ministry-1' });

      await updateMinistry(req as any, mockRes as Response);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Ministerio Actualizado',
        meeting_time: '20:00'
      }));
    });
  });

  describe('getMinistryMembers', () => {
    it('should return ministry members', async () => {
      const mockMembers = [
        { id: 'member-1', name: 'John Doe', role: 'leader' },
        { id: 'member-2', name: 'Jane Smith', role: 'member' }
      ];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMembers));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'ministry-1' });

      await getMinistryMembers(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ministry_members');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('ministry_id', 'ministry-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMembers
      });
    });
  });

  describe('addMemberToMinistry', () => {
    it('should add member to ministry successfully', async () => {
      const mockMembership = { id: 'membership-1', ministry_id: 'ministry-1', member_id: 'member-1' };
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess(null)) // Check not already member
        .mockResolvedValueOnce(createSupabaseSuccess(mockMembership)); // Add membership

      const req = createAuthenticatedRequest('leader-1', 'leader', 
        { memberId: 'member-1', role: 'member' }, 
        { id: 'ministry-1' }
      );

      await addMemberToMinistry(req as any, mockRes as Response);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        ministry_id: 'ministry-1',
        member_id: 'member-1',
        role: 'member',
        joined_at: expect.any(String)
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should prevent duplicate membership', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ id: 'existing' }));

      const req = createAuthenticatedRequest('leader-1', 'leader', 
        { memberId: 'member-1' }, 
        { id: 'ministry-1' }
      );

      await expect(addMemberToMinistry(req as any, mockRes as Response))
        .rejects.toThrow('Membro já faz parte deste ministério');
    });
  });

  describe('getMinistryStats', () => {
    it('should return ministry statistics', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 8 }])) // total active
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 45 }])) // total members
        .mockResolvedValueOnce(createSupabaseSuccess([ // most active
          { ministry: 'Adoración', member_count: 15 },
          { ministry: 'Jóvenes', member_count: 12 }
        ]));

      const req = createAuthenticatedRequest();

      await getMinistryStats(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalActive: 8,
          totalMembers: 45,
          mostActive: expect.any(Array)
        })
      });
    });
  });
});