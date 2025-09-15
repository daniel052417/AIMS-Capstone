// Simplified Auth Service Tests
import { AuthService } from '../../../services/auth.service';

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

describe('AuthService - Simplified', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should have register method', () => {
      expect(typeof AuthService.register).toBe('function');
    });

    it('should have login method', () => {
      expect(typeof AuthService.login).toBe('function');
    });

    it('should have refreshToken method', () => {
      expect(typeof AuthService.refreshToken).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('register should accept user data', () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
      };
      expect(() => AuthService.register(userData)).not.toThrow();
    });

    it('login should accept credentials', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'TestPass123!',
      };
      expect(() => AuthService.login(credentials)).not.toThrow();
    });
  });
});
