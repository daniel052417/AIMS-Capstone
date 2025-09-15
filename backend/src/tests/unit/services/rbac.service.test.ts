import { RBACService } from '../../../services/rbac.service';
import { supabaseAdmin } from '../../../config/supabaseClient';
import { createMockRole, createMockPermission } from '../../utils/test-helpers';

// Mock the supabaseAdmin
jest.mock('../../../config/supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

describe('RBACService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const mockRole = createMockRole();

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRole, error: null }),
          }),
        }),
      });

      const result = await RBACService.createRole('test_role', 'A test role');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRole);
    });

    it('should handle database errors', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          }),
        }),
      });

      const result = await RBACService.createRole('test_role', 'A test role');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      const mockUser = { id: 'user-id', is_active: true };
      const mockRole = { id: 'role-id' };

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockRole, error: null }),
              }),
            }),
          };
        }
        if (table === 'user_roles') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'role_permission_audit') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await RBACService.assignRoleToUser('user-id', 'role-id', 'admin-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Role assigned successfully');
    });

    it('should return error if user not found', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      const result = await RBACService.assignRoleToUser('user-id', 'role-id', 'admin-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found or inactive');
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [{ roles: { role_permissions: [{ permissions: { resource: 'test', action: 'read' } }] } }], error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await RBACService.hasPermission('user-id', 'test', 'read');

      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await RBACService.hasPermission('user-id', 'test', 'read');

      expect(result).toBe(false);
    });
  });
});