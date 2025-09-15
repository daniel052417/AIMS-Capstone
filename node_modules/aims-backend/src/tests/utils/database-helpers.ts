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
      'units_of_measure',
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
      ...userData,
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
      ...roleData,
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
      ...permissionData,
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
      ...productData,
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createTestProductVariant(variantData: any = {}) {
    const testVariant = {
      id: 'test-variant-id',
      product_id: 'test-product-id',
      sku: 'TEST-001-S',
      name: 'Small Size',
      variant_type: 'Size',
      variant_value: 'Small',
      price: 15.00,
      cost: 10.00,
      is_active: true,
      ...variantData,
    };

    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .insert(testVariant)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}