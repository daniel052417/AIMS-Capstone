import { RBACService } from '../services/rbac.service';

const seedRBAC = async () => {
  console.log('🌱 Seeding RBAC data...');

  // Create system roles
  const roles = [
    { name: 'super_admin', description: 'System administrator with full access', is_system_role: true },
    { name: 'hr_admin', description: 'Human resources administrator', is_system_role: false },
    { name: 'inventory_clerk', description: 'Inventory management clerk', is_system_role: false },
    { name: 'cashier', description: 'Point of sale cashier', is_system_role: false },
    { name: 'marketing_staff', description: 'Marketing team member', is_system_role: false },
    { name: 'staff', description: 'General staff member', is_system_role: false },
  ];

  for (const role of roles) {
    const result = await RBACService.createRole(role.name, role.description, role.is_system_role);
    console.log(`Role ${role.name}: ${result.success ? '✅' : '❌'}`);
  }

  // Create permissions
  const permissions = [
    // User management
    { name: 'users.create', resource: 'users', action: 'create', description: 'Create new users' },
    { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
    { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
    
    // Product management
    { name: 'products.create', resource: 'products', action: 'create', description: 'Create products' },
    { name: 'products.read', resource: 'products', action: 'read', description: 'View products' },
    { name: 'products.update', resource: 'products', action: 'update', description: 'Update products' },
    { name: 'products.delete', resource: 'products', action: 'delete', description: 'Delete products' },
    
    // Inventory management
    { name: 'inventory.create', resource: 'inventory', action: 'create', description: 'Manage inventory' },
    { name: 'inventory.read', resource: 'inventory', action: 'read', description: 'View inventory' },
    { name: 'inventory.update', resource: 'inventory', action: 'update', description: 'Update inventory' },
    
    // Order management
    { name: 'orders.create', resource: 'orders', action: 'create', description: 'Create orders' },
    { name: 'orders.read', resource: 'orders', action: 'read', description: 'View orders' },
    { name: 'orders.update', resource: 'orders', action: 'update', description: 'Update orders' },
    
    // Payment processing
    { name: 'payments.create', resource: 'payments', action: 'create', description: 'Process payments' },
    { name: 'payments.read', resource: 'payments', action: 'read', description: 'View payments' },
    
    // Role and permission management
    { name: 'roles.create', resource: 'roles', action: 'create', description: 'Create roles' },
    { name: 'roles.read', resource: 'roles', action: 'read', description: 'View roles' },
    { name: 'roles.update', resource: 'roles', action: 'update', description: 'Update roles' },
    { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
    
    { name: 'permissions.create', resource: 'permissions', action: 'create', description: 'Create permissions' },
    { name: 'permissions.read', resource: 'permissions', action: 'read', description: 'View permissions' },
    { name: 'permissions.update', resource: 'permissions', action: 'update', description: 'Update permissions' },
    { name: 'permissions.delete', resource: 'permissions', action: 'delete', description: 'Delete permissions' },
  ];

  for (const permission of permissions) {
    const result = await RBACService.createPermission(
      permission.name, 
      permission.resource, 
      permission.action, 
      permission.description,
    );
    console.log(`Permission ${permission.name}: ${result.success ? '✅' : '❌'}`);
  }

  console.log('✅ RBAC seeding completed!');
};

// Run if called directly
if (require.main === module) {
  seedRBAC().catch(console.error);
}

export default seedRBAC;