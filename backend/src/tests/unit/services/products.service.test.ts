import { ProductsService } from '../../../services/products.service';
import { supabaseAdmin } from '../../../config/supabaseClient';
import { createMockProduct, createMockProductVariant, createMockInventory } from '../../utils/test-helpers';

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

describe('ProductsService', () => {
  let productsService: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    productsService = new ProductsService();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const mockProduct = createMockProduct();

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
              }),
            }),
          };
        }
        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: 'category-id' }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'units_of_measure') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: 'unit-id' }, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ProductsService.createProduct({
        name: 'Test Product',
        sku: 'TEST-001',
        category_id: 'category-id',
        unit_of_measure: 'pcs',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProduct);
    });

    it('should return error if SKU already exists', async () => {
      const mockProduct = createMockProduct();

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
          }),
        }),
      });

      const result = await ProductsService.createProduct({
        name: 'Test Product',
        sku: 'TEST-001',
        category_id: 'category-id',
        unit_of_measure: 'pcs',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product with this SKU already exists');
    });
  });

  describe('getAll', () => {
    it('should retrieve products with pagination', async () => {
      const mockProducts = [createMockProduct(), createMockProduct()];

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ data: mockProducts, error: null, count: 2 }),
        }),
      });

      const result = await ProductsService.getProducts({ search: 'test' });

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('updateProduct', () => {
    it('should update product basic info successfully', async () => {
      const mockProduct = createMockProduct();
      const mockProductWithVariants = {
        ...mockProduct,
        variants: [],
        category: { id: 'category-id', name: 'Test Category' },
        unit_of_measure: { id: 'unit-id', name: 'Piece', abbreviation: 'pcs' },
      };

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'product-id' }, error: null }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'product_variants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'category-id', name: 'Test Category' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'units_of_measure') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'unit-id', name: 'Piece', abbreviation: 'pcs' }, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock the getProductById method
      jest.spyOn(ProductsService, 'getProductById').mockResolvedValue({
        success: true,
        message: 'Product retrieved successfully',
        data: mockProductWithVariants,
      });

      const result = await ProductsService.updateProduct('product-id', {
        name: 'Updated Product Name',
        description: 'Updated description',
        brand: 'Updated Brand',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProductWithVariants);
    });

    it('should update product with variants successfully', async () => {
      const mockProduct = createMockProduct();
      const mockVariant = createMockProductVariant();
      const mockInventory = createMockInventory();
      const mockProductWithVariants = {
        ...mockProduct,
        variants: [{ ...mockVariant, inventory: [mockInventory] }],
        category: { id: 'category-id', name: 'Test Category' },
        unit_of_measure: { id: 'unit-id', name: 'Piece', abbreviation: 'pcs' },
      };

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'product-id' }, error: null }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'product_variants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockVariant, error: null }),
                  }),
                }),
              }),
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockVariant, error: null }),
              }),
            }),
          };
        }
        if (table === 'inventory') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [mockInventory], error: null }),
            }),
          };
        }
        return {};
      });

      // Mock the getProductById method
      jest.spyOn(ProductsService, 'getProductById').mockResolvedValue({
        success: true,
        message: 'Product retrieved successfully',
        data: mockProductWithVariants,
      });

      const result = await ProductsService.updateProduct('product-id', {
        name: 'Updated Product Name',
        variants: [
          {
            id: 'variant-id',
            price: 25.99,
            cost: 15.00,
            variant_type: 'Size',
            variant_value: 'Large',
          },
          {
            sku: 'TEST-001-XL',
            name: 'Extra Large',
            variant_type: 'Size',
            variant_value: 'XL',
            price: 29.99,
            cost: 18.00,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProductWithVariants);
    });

    it('should return error if product not found', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await ProductsService.updateProduct('non-existent-id', {
        name: 'Updated Product Name',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product not found');
    });

    it('should handle variant update errors gracefully', async () => {
      const mockProduct = createMockProduct();

      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'product-id' }, error: null }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'product_variants') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Variant update failed' } }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ProductsService.updateProduct('product-id', {
        name: 'Updated Product Name',
        variants: [
          {
            id: 'variant-id',
            price: 25.99,
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to update variants');
    });
  });
});