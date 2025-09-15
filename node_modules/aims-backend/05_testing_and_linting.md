# 05 - Testing and Linting Setup Guide

## Overview
This guide will set up comprehensive testing with Jest and linting with ESLint for your AIMS backend.

## Prerequisites
- ✅ Backend setup completed (01_backend_setup.md)
- ✅ Authentication module completed (02_auth_module.md)
- ✅ RBAC module completed (03_role_permission_module.md)
- ✅ CRUD modules implemented (04_crud_modules.md)

## Step 1: Testing Dependencies

### 1.1 Install Testing Dependencies
```bash
# Install Jest and testing utilities
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

# Install additional testing utilities
npm install --save-dev jest-environment-node @jest/globals

# Install test database utilities
npm install --save-dev @supabase/supabase-js
```

### 1.2 Update Package.json Scripts
**File: `package.json`**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e"
  }
}
```

## Step 2: Jest Configuration

### 2.1 Create Jest Configuration
**File: `jest.config.js`**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/scripts/**',
    '!src/migrations/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true
};
```

### 2.2 Create Test Setup File
**File: `src/tests/setup.ts`**
```typescript
import { config } from '../config/env';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods in tests to reduce noise
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Global test timeout
jest.setTimeout(10000);

// Mock Supabase client for tests
jest.mock('../config/supabaseClient', () => ({
  supabase: {
    auth: {
      admin: {
        createUser: jest.fn(),
        signInWithPassword: jest.fn(),
        getUserById: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      csv: jest.fn(),
      geojson: jest.fn(),
      explain: jest.fn(),
      rollback: jest.fn(),
      returns: jest.fn().mockReturnThis()
    }))
  },
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        signInWithPassword: jest.fn(),
        getUserById: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      csv: jest.fn(),
      geojson: jest.fn(),
      explain: jest.fn(),
      rollback: jest.fn(),
      returns: jest.fn().mockReturnThis()
    }))
  }
}));
```

## Step 3: Test Utilities

### 3.1 Create Test Utilities
**File: `src/tests/utils/test-helpers.ts`**
```typescript
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';

export const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides
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
  overrides: Partial<Request> = {}
): AuthenticatedRequest => ({
  ...createMockRequest(overrides),
  user
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
  ...overrides
});

export const createMockProduct = (overrides: any = {}) => ({
  id: 'test-product-id',
  name: 'Test Product',
  description: 'A test product',
  sku: 'TEST-001',
  barcode: '1234567890123',
  category_id: 'test-category-id',
  unit_of_measure_id: 'test-unit-id',
  purchase_price: 10.00,
  selling_price: 15.00,
  min_stock_level: 5,
  max_stock_level: 100,
  is_active: true,
  branch_id: 'test-branch-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockRole = (overrides: any = {}) => ({
  id: 'test-role-id',
  name: 'test_role',
  description: 'A test role',
  is_system_role: false,
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockPermission = (overrides: any = {}) => ({
  id: 'test-permission-id',
  name: 'test.permission',
  resource: 'test',
  action: 'permission',
  description: 'A test permission',
  ...overrides
});
```

### 3.2 Create Database Test Utilities
**File: `src/tests/utils/database-helpers.ts`**
```typescript
import { supabaseAdmin } from '../../config/supabaseClient';

export class DatabaseTestHelpers {
  static async cleanupTestData() {
    // Clean up test data in reverse order of dependencies
    const tables = [
      'role_permission_audit',
      'role_permissions',
      'user_roles',
      'permissions',
      'roles',
      'users',
      'products',
      'categories',
      'units_of_measure'
    ];

    for (const table of tables) {
      try {
        await supabaseAdmin
          .from(table)
          .delete()
          .like('email', 'test%')
          .or('name.like.test%')
          .or('sku.like.TEST%');
      } catch (error) {
        console.warn(`Failed to cleanup ${table}:`, error);
      }
    }
  }

  static async createTestUser(userData: any = {}) {
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890',
      branch_id: 'test-branch-id',
      is_active: true,
      ...userData
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createTestRole(roleData: any = {}) {
    const testRole = {
      id: 'test-role-id',
      name: 'test_role',
      description: 'A test role',
      is_system_role: false,
      ...roleData
    };

    const { data, error } = await supabaseAdmin
      .from('roles')
      .insert(testRole)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createTestPermission(permissionData: any = {}) {
    const testPermission = {
      id: 'test-permission-id',
      name: 'test.permission',
      resource: 'test',
      action: 'permission',
      description: 'A test permission',
      ...permissionData
    };

    const { data, error } = await supabaseAdmin
      .from('permissions')
      .insert(testPermission)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createTestProduct(productData: any = {}) {
    const testProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      description: 'A test product',
      sku: 'TEST-001',
      barcode: '1234567890123',
      category_id: 'test-category-id',
      unit_of_measure_id: 'test-unit-id',
      purchase_price: 10.00,
      selling_price: 15.00,
      min_stock_level: 5,
      max_stock_level: 100,
      is_active: true,
      branch_id: 'test-branch-id',
      ...productData
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

## Step 4: Unit Tests

### 4.1 Create Authentication Unit Tests
**File: `src/tests/unit/services/auth.service.test.ts`**
```typescript
import { AuthService } from '../../../services/auth.service';
import { supabaseAdmin } from '../../../config/supabaseClient';
import { createMockUser } from '../../utils/test-helpers';

// Mock the supabaseAdmin
jest.mock('../../../config/supabaseClient');

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
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      (supabaseAdmin.auth.admin.createUser as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User'
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
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          })
        })
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User with this email already exists');
    });

    it('should return error for weak password', async () => {
      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'weak',
        first_name: 'Test',
        last_name: 'User'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password does not meet requirements');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = createMockUser();
      const mockAuthData = { user: { id: mockUser.id } };

      (supabaseAdmin.auth.admin.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'TestPass123!'
      });

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.access_token).toBeDefined();
      expect(result.data?.refresh_token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      (supabaseAdmin.auth.admin.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });
  });
});
```

### 4.2 Create RBAC Unit Tests
**File: `src/tests/unit/services/rbac.service.test.ts`**
```typescript
import { RBACService } from '../../../services/rbac.service';
import { supabaseAdmin } from '../../../config/supabaseClient';
import { createMockRole, createMockPermission } from '../../utils/test-helpers';

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
            single: jest.fn().mockResolvedValue({ data: mockRole, error: null })
          })
        })
      });

      const result = await RBACService.createRole('test_role', 'A test role');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRole);
    });

    it('should handle database errors', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
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
                  single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
                })
              })
            })
          };
        }
        if (table === 'roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockRole, error: null })
              })
            })
          };
        }
        if (table === 'user_roles') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null })
          };
        }
        if (table === 'role_permission_audit') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null })
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
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
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
                limit: jest.fn().mockResolvedValue({ data: [{ roles: { role_permissions: [{ permissions: { resource: 'test', action: 'read' } }] } }], error: null })
              })
            })
          })
        })
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
                limit: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          })
        })
      });

      const result = await RBACService.hasPermission('user-id', 'test', 'read');

      expect(result).toBe(false);
    });
  });
});
```

### 4.3 Create Products Unit Tests
**File: `src/tests/unit/services/products.service.test.ts`**
```typescript
import { ProductsService } from '../../../services/products.service';
import { supabaseAdmin } from '../../../config/supabaseClient';
import { createMockProduct } from '../../utils/test-helpers';

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
                single: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockProduct, error: null })
              })
            })
          };
        }
        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: 'category-id' }, error: null })
                })
              })
            })
          };
        }
        if (table === 'units_of_measure') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: 'unit-id' }, error: null })
                })
              })
            })
          };
        }
        return {};
      });

      const result = await productsService.create({
        name: 'Test Product',
        sku: 'TEST-001',
        category_id: 'category-id',
        unit_of_measure_id: 'unit-id',
        purchase_price: 10.00,
        selling_price: 15.00,
        min_stock_level: 5,
        max_stock_level: 100
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProduct);
    });

    it('should return error if SKU already exists', async () => {
      const mockProduct = createMockProduct();

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProduct, error: null })
          })
        })
      });

      const result = await productsService.create({
        name: 'Test Product',
        sku: 'TEST-001',
        category_id: 'category-id',
        unit_of_measure_id: 'unit-id',
        purchase_price: 10.00,
        selling_price: 15.00,
        min_stock_level: 5,
        max_stock_level: 100
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product with this SKU already exists');
    });

    it('should return error if selling price is not greater than purchase price', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });

      const result = await productsService.create({
        name: 'Test Product',
        sku: 'TEST-001',
        category_id: 'category-id',
        unit_of_measure_id: 'unit-id',
        purchase_price: 15.00,
        selling_price: 10.00, // Less than purchase price
        min_stock_level: 5,
        max_stock_level: 100
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Selling price must be greater than purchase price');
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
          range: jest.fn().mockResolvedValue({ data: mockProducts, error: null, count: 2 })
        })
      });

      const result = await productsService.getAll(
        { page: 1, limit: 10 },
        { search: 'test' }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(result.pagination.total).toBe(2);
    });
  });
});
```

## Step 5: Integration Tests

### 5.1 Create Integration Test Setup
**File: `src/tests/integration/setup.ts`**
```typescript
import { DatabaseTestHelpers } from '../utils/database-helpers';

beforeAll(async () => {
  // Clean up any existing test data
  await DatabaseTestHelpers.cleanupTestData();
});

afterAll(async () => {
  // Clean up test data after all tests
  await DatabaseTestHelpers.cleanupTestData();
});

afterEach(async () => {
  // Clean up after each test
  await DatabaseTestHelpers.cleanupTestData();
});
```

### 5.2 Create Authentication Integration Tests
**File: `src/tests/integration/auth.integration.test.ts`**
```typescript
import request from 'supertest';
import app from '../../index';
import { DatabaseTestHelpers } from '../utils/database-helpers';

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await DatabaseTestHelpers.cleanupTestData();
  });

  describe('POST /v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Please provide a valid email address');
    });

    it('should return error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user first
      await DatabaseTestHelpers.createTestUser();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});
```

## Step 6: ESLint Configuration

### 6.1 Update ESLint Configuration
**File: `eslint.config.js`**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    
    // Import rules
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
    }],
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  env: {
    node: true,
    es6: true,
    jest: true
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '*.d.ts'
  ]
};
```

### 6.2 Create ESLint Scripts
**File: `scripts/lint.sh`**
```bash
#!/bin/bash

echo "🔍 Running ESLint..."

# Lint TypeScript files
npx eslint src/**/*.ts --ext .ts

# Check if linting passed
if [ $? -eq 0 ]; then
  echo "✅ ESLint passed successfully!"
else
  echo "❌ ESLint found issues. Please fix them before committing."
  exit 1
fi
```

## Step 7: Pre-commit Hooks

### 7.1 Install Husky
```bash
npm install --save-dev husky lint-staged
```

### 7.2 Setup Pre-commit Hooks
```bash
# Initialize husky
npx husky init

# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

### 7.3 Configure Lint-staged
**File: `package.json`**
```json
{
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{ts,js}": [
      "jest --bail --findRelatedTests"
    ]
  }
}
```

## Step 8: Running Tests

### 8.1 Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in CI mode
npm run test:ci
```

### 8.2 Linting Commands
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Type check
npm run type-check
```

## Next Steps
✅ **You've completed the testing and linting setup!**

**What's next?**
- Move to `06_deployment_guide.md` to set up production deployment
- Or start writing more comprehensive tests for your specific business logic

**Current Status:**
- ✅ Jest testing framework configured
- ✅ Unit tests for services
- ✅ Integration tests for API endpoints
- ✅ ESLint configuration with TypeScript rules
- ✅ Pre-commit hooks setup
- ✅ Test coverage reporting
- ✅ Database test utilities

**Testing Checklist:**
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] ESLint passes without errors
- [ ] Test coverage meets threshold
- [ ] Pre-commit hooks work correctly
- [ ] CI/CD pipeline ready for testing
