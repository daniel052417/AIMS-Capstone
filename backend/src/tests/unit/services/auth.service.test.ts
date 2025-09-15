import { AuthService } from '../../../services/auth.service';
import { supabaseAdmin } from '../../../config/supabaseClient';
import { createMockUser } from '../../utils/test-helpers';

// Mock the supabaseAdmin
jest.mock('../../../config/supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  },
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = createMockUser();
      const mockAuthData = { user: { id: mockUser.id } };

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });

      (supabaseAdmin.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
      });

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.access_token).toBeDefined();
      expect(result.data?.refresh_token).toBeDefined();
    });

    it('should return error if user already exists', async () => {
      const mockUser = createMockUser();

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User with this email already exists');
    });

    it('should return error for weak password', async () => {
      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'weak',
        first_name: 'Test',
        last_name: 'User',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password does not meet requirements');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = createMockUser();
      const mockAuthData = { user: { id: mockUser.id } };

      // Mock the supabase client for login
      const { supabase } = require('../../../config/supabaseClient');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.access_token).toBeDefined();
      expect(result.data?.refresh_token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      // Mock the supabase client for login
      const { supabase } = require('../../../config/supabaseClient');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });
  });
});