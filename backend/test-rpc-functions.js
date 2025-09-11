const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRPCFunctions() {
  try {
    console.log('🔍 Testing RPC functions...\n');

    // Test 1: Get Low Stock Products
    console.log('1. Testing get_low_stock_products...');
    const { data: lowStockProducts, error: lowStockError } = await supabase
      .rpc('get_low_stock_products');

    if (lowStockError) {
      console.error('❌ get_low_stock_products error:', lowStockError);
    } else {
      console.log('✅ get_low_stock_products successful');
      console.log(`Found ${lowStockProducts?.length || 0} low stock products`);
      if (lowStockProducts && lowStockProducts.length > 0) {
        console.log('Sample product:', {
          name: lowStockProducts[0].name,
          sku: lowStockProducts[0].sku,
          stock_quantity: lowStockProducts[0].stock_quantity,
          minimum_stock: lowStockProducts[0].minimum_stock
        });
      }
    }

    // Test 2: Get Products with Low Stock Filter
    console.log('\n2. Testing get_products_with_low_stock_filter...');
    const { data: filteredProducts, error: filterError } = await supabase
      .rpc('get_products_with_low_stock_filter');

    if (filterError) {
      console.error('❌ get_products_with_low_stock_filter error:', filterError);
    } else {
      console.log('✅ get_products_with_low_stock_filter successful');
      console.log(`Found ${filteredProducts?.length || 0} low stock products`);
    }

    // Test 3: Get Low Stock Inventory Levels
    console.log('\n3. Testing get_low_stock_inventory_levels...');
    const { data: lowStockInventory, error: inventoryError } = await supabase
      .rpc('get_low_stock_inventory_levels');

    if (inventoryError) {
      console.error('❌ get_low_stock_inventory_levels error:', inventoryError);
    } else {
      console.log('✅ get_low_stock_inventory_levels successful');
      console.log(`Found ${lowStockInventory?.length || 0} low stock inventory items`);
    }

  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testRPCFunctions();
