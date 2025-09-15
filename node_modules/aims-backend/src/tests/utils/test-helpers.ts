import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';

export const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
} as Request);

export const createMockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  res.clearCookie = jest.fn().mockReturnThis();
  return res;
};

export const createMockNext = () => jest.fn();

export const createMockAuthenticatedRequest = (
  user: { userId: string; email: string; branchId?: string } = { userId: 'test-user-id', email: 'test@example.com' },
  overrides: Partial<Request> = {},
): AuthenticatedRequest => ({
  ...createMockRequest(overrides),
  user,
} as AuthenticatedRequest);

export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: '+1234567890',
  branch_id: 'test-branch-id',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockProduct = (overrides: any = {}) => ({
  id: 'test-product-id',
  sku: 'TEST-001',
  name: 'Test Product',
  description: 'A test product',
  category_id: 'test-category-id',
  brand: 'Test Brand',
  unit_of_measure: 'pcs',
  weight: 1.5,
  dimensions: { length: 10, width: 5, height: 2 },
  is_prescription_required: false,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockProductVariant = (overrides: any = {}) => ({
  id: 'test-variant-id',
  product_id: 'test-product-id',
  sku: 'TEST-001-S',
  name: 'Small Size',
  variant_type: 'Size',
  variant_value: 'Small',
  price: 15.00,
  cost: 10.00,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockInventory = (overrides: any = {}) => ({
  id: 'test-inventory-id',
  branch_id: 'test-branch-id',
  product_variant_id: 'test-variant-id',
  quantity_on_hand: 100,
  quantity_reserved: 10,
  quantity_available: 90,
  reorder_level: 20,
  max_stock_level: 200,
  last_counted: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockRole = (overrides: any = {}) => ({
  id: 'test-role-id',
  name: 'test_role',
  description: 'A test role',
  is_system_role: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockPermission = (overrides: any = {}) => ({
  id: 'test-permission-id',
  name: 'test.permission',
  resource: 'test',
  action: 'permission',
  description: 'A test permission',
  ...overrides,
});