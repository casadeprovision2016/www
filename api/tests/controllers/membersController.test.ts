import { Response } from 'express';
import { 
  getMembers, 
  getMemberById, 
  createMember, 
  updateMember, 
  deleteMember,
  getMemberStats,
  getBirthdayList,
  updateMemberStatus
} from '../../src/controllers/membersController';
import { 
  createAuthenticatedRequest, 
  createResponseMock, 
  createMockMember,
  createSupabaseSuccess,
  createSupabaseError
} from '../helpers/testHelpers';
import { mockSupabaseClient } from '../setup';

describe('Members Controller', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = createResponseMock();
    jest.clearAllMocks();
  });

  describe('getMembers', () => {
    it('should return paginated members successfully', async () => {
      const mockMembers = [createMockMember(), createMockMember({ id: 'member-2' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMembers, 2));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { page: 1, limit: 10 });

      await getMembers(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('members');
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
      const mockMembers = [createMockMember({ status: 'active' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMembers, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { status: 'active' });

      await getMembers(req as any, mockRes as Response);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should filter by ministry', async () => {
      const mockMembers = [createMockMember({ ministry: 'Adoración' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMembers, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { ministry: 'Adoración' });

      await getMembers(req as any, mockRes as Response);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('ministry', 'Adoración');
    });

    it('should search by name or email', async () => {
      const mockMembers = [createMockMember({ name: 'John Search' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMembers, 1));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { search: 'John' });

      await getMembers(req as any, mockRes as Response);

      expect(mockSupabaseClient.or).toHaveBeenCalledWith('name.ilike.%John%,email.ilike.%John%');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseError('Database error'));

      const req = createAuthenticatedRequest('user-1', 'member');

      await expect(getMembers(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('getMemberById', () => {
    it('should return member by id successfully', async () => {
      const mockMember = createMockMember();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMember));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'member-1' });

      await getMemberById(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('members');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'member-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'member-1',
          name: 'John Doe'
        })
      });
    });

    it('should return 404 when member not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(null));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'nonexistent' });

      await expect(getMemberById(req as any, mockRes as Response)).rejects.toThrow('Membro não encontrado');
    });
  });

  describe('createMember', () => {
    it('should create member successfully as leader', async () => {
      const mockMember = createMockMember();
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMember));

      const memberData = {
        name: 'New Member',
        email: 'new@example.com',
        phone: '123456789',
        address: '123 Street',
        birthDate: '1990-01-01',
        membershipDate: '2025-01-01',
        ministry: 'Adoración'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', memberData);

      await createMember(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('members');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Member',
        email: 'new@example.com',
        phone: '123456789',
        address: '123 Street',
        birth_date: '1990-01-01',
        membership_date: '2025-01-01',
        ministry: 'Adoración',
        status: 'active'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should prevent duplicate email addresses', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess([{ id: 'existing-member' }])) // Email exists
        .mockResolvedValueOnce(createSupabaseError('Email já está em uso'));

      const memberData = {
        name: 'New Member',
        email: 'existing@example.com'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', memberData);

      await expect(createMember(req as any, mockRes as Response)).rejects.toThrow('Email já está em uso');
    });

    it('should handle validation errors', async () => {
      const req = createAuthenticatedRequest('leader-1', 'leader', {
        name: '', // Invalid empty name
      });

      await expect(createMember(req as any, mockRes as Response)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const req = createAuthenticatedRequest('leader-1', 'leader', {
        name: 'Test Member',
        email: 'invalid-email'
      });

      await expect(createMember(req as any, mockRes as Response)).rejects.toThrow();
    });
  });

  describe('updateMember', () => {
    it('should update member successfully', async () => {
      const updatedMember = createMockMember({ name: 'Updated Name' });
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(updatedMember));

      const updateData = {
        name: 'Updated Name',
        phone: '987654321',
        ministry: 'Jóvenes'
      };

      const req = createAuthenticatedRequest('leader-1', 'leader', updateData, { id: 'member-1' });

      await updateMember(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('members');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Name',
        phone: '987654321',
        ministry: 'Jóvenes'
      }));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'member-1');
    });

    it('should return 404 when updating nonexistent member', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(null));

      const req = createAuthenticatedRequest('leader-1', 'leader', { name: 'Test' }, { id: 'nonexistent' });

      await expect(updateMember(req as any, mockRes as Response)).rejects.toThrow('Membro não encontrado');
    });

    it('should prevent updating email to existing one', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess([{ id: 'other-member' }])) // Email exists for another member
        .mockResolvedValueOnce(createSupabaseError('Email já está em uso'));

      const updateData = { email: 'existing@example.com' };
      const req = createAuthenticatedRequest('leader-1', 'leader', updateData, { id: 'member-1' });

      await expect(updateMember(req as any, mockRes as Response)).rejects.toThrow('Email já está em uso');
    });
  });

  describe('deleteMember', () => {
    it('should delete member successfully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 1 }));

      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'member-1' });

      await deleteMember(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('members');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'member-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Membro deletado com sucesso'
      });
    });

    it('should return 404 when deleting nonexistent member', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess({ count: 0 }));

      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'nonexistent' });

      await expect(deleteMember(req as any, mockRes as Response)).rejects.toThrow('Membro não encontrado');
    });

    it('should soft delete instead of hard delete', async () => {
      const req = createAuthenticatedRequest('admin-1', 'admin', {}, { id: 'member-1' });

      await deleteMember(req as any, mockRes as Response);

      // Should update status to 'inactive' instead of actual deletion
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ status: 'inactive' });
    });
  });

  describe('getMemberStats', () => {
    it('should return member statistics', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 150 }])) // total active
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 25 }]))  // new this month
        .mockResolvedValueOnce(createSupabaseSuccess([{ count: 10 }]))  // birthdays this month
        .mockResolvedValueOnce(createSupabaseSuccess([           // by ministry
          { ministry: 'Adoración', count: 30 },
          { ministry: 'Jóvenes', count: 40 },
          { ministry: 'Niños', count: 50 }
        ]));

      const req = createAuthenticatedRequest();

      await getMemberStats(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalActive: 150,
          newThisMonth: 25,
          birthdaysThisMonth: 10,
          byMinistry: expect.any(Array)
        })
      });
    });
  });

  describe('getBirthdayList', () => {
    it('should return upcoming birthdays', async () => {
      const mockBirthdays = [
        createMockMember({ name: 'Birthday Person 1', birth_date: '1990-07-25' }),
        createMockMember({ name: 'Birthday Person 2', birth_date: '1985-07-30' })
      ];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockBirthdays));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { days: 7 });

      await getBirthdayList(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('members');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Birthday Person 1',
            birthDate: '1990-07-25'
          }),
          expect.objectContaining({
            name: 'Birthday Person 2',
            birthDate: '1985-07-30'
          })
        ])
      });
    });

    it('should filter birthdays by date range', async () => {
      const mockBirthdays = [createMockMember({ birth_date: '1990-07-25' })];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockBirthdays));

      const req = createAuthenticatedRequest('user-1', 'member', {}, {}, { 
        startDate: '2025-07-20',
        endDate: '2025-07-31'
      });

      await getBirthdayList(req as any, mockRes as Response);

      // Should use date functions to filter birthdays within range
      expect(mockSupabaseClient.gte).toHaveBeenCalled();
      expect(mockSupabaseClient.lte).toHaveBeenCalled();
    });

    it('should default to 30 days if no range specified', async () => {
      const mockBirthdays = [createMockMember()];
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockBirthdays));

      const req = createAuthenticatedRequest('user-1', 'member');

      await getBirthdayList(req as any, mockRes as Response);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('members');
    });
  });

  describe('updateMemberStatus', () => {
    it('should update member status successfully', async () => {
      const updatedMember = createMockMember({ status: 'inactive' });
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(updatedMember));

      const req = createAuthenticatedRequest('leader-1', 'leader', 
        { status: 'inactive' }, 
        { id: 'member-1' }
      );

      await updateMemberStatus(req as any, mockRes as Response);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ status: 'inactive' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'member-1');
    });

    it('should validate status values', async () => {
      const req = createAuthenticatedRequest('leader-1', 'leader', 
        { status: 'invalid-status' }, 
        { id: 'member-1' }
      );

      await expect(updateMemberStatus(req as any, mockRes as Response)).rejects.toThrow();
    });

    it('should only allow valid status transitions', async () => {
      // Mock existing member with 'active' status
      mockSupabaseClient.single
        .mockResolvedValueOnce(createSupabaseSuccess(createMockMember({ status: 'active' })))
        .mockResolvedValueOnce(createSupabaseSuccess(createMockMember({ status: 'inactive' })));

      const req = createAuthenticatedRequest('leader-1', 'leader', 
        { status: 'inactive' }, 
        { id: 'member-1' }
      );

      await updateMemberStatus(req as any, mockRes as Response);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ status: 'inactive' });
    });
  });

  describe('Member age calculations', () => {
    it('should calculate member age correctly', async () => {
      const birthDate = new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000); // 30 years ago
      const mockMember = createMockMember({ 
        birth_date: birthDate.toISOString().split('T')[0] 
      });
      mockSupabaseClient.single.mockResolvedValueOnce(createSupabaseSuccess(mockMember));

      const req = createAuthenticatedRequest('user-1', 'member', {}, { id: 'member-1' });

      await getMemberById(req as any, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          age: expect.any(Number)
        })
      });
    });
  });
});