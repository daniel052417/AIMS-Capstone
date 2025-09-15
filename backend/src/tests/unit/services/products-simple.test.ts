// Simplified Products Service Tests
import { ProductsService } from '../../../services/products.service';

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
}));

describe('ProductsService - Simplified', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should have getProducts method', () => {
      expect(typeof ProductsService.getProducts).toBe('function');
    });

    it('should have getProductById method', () => {
      expect(typeof ProductsService.getProductById).toBe('function');
    });

    it('should have updateProduct method', () => {
      expect(typeof ProductsService.updateProduct).toBe('function');
    });

    it('should have createProduct method', () => {
      expect(typeof ProductsService.createProduct).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('getProducts should accept filters parameter', () => {
      const filters = { search: 'test' };
      expect(() => ProductsService.getProducts(filters)).not.toThrow();
    });

    it('getProductById should accept id parameter', () => {
      const id = 'test-id';
      expect(() => ProductsService.getProductById(id)).not.toThrow();
    });
  });
});
