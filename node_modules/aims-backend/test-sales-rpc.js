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

async function testSalesRPCFunctions() {
  try {
    console.log('🔍 Testing Sales RPC functions...\n');

    // Test 1: Generate Customer Code
    console.log('1. Testing generate_customer_code...');
    const { data: customerCode, error: codeError } = await supabase
      .rpc('generate_customer_code');

    if (codeError) {
      console.error('❌ generate_customer_code error:', JSON.stringify(codeError, null, 2));
    } else {
      console.log('✅ generate_customer_code successful:', customerCode);
    }

    // Test 2: Generate Order Number
    console.log('\n2. Testing generate_order_number...');
    const { data: orderNumber, error: numberError } = await supabase
      .rpc('generate_order_number');

    if (numberError) {
      console.error('❌ generate_order_number error:', JSON.stringify(numberError, null, 2));
    } else {
      console.log('✅ generate_order_number successful:', orderNumber);
    }

    // Test 3: Create Customer
    console.log('\n3. Testing customer creation...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([{
        customer_code: customerCode,
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
        phone: '+1234567890'
      }])
      .select()
      .single();

    if (customerError) {
      console.error('❌ Customer creation error:', JSON.stringify(customerError, null, 2));
    } else {
      console.log('✅ Customer created successfully:', customer.id);

      // Test 4: Create Sales Order with Transaction
      console.log('\n4. Testing create_sales_order_transaction...');
      const orderData = {
        order_number: orderNumber,
        customer_id: customer.id,
        subtotal: 100.00,
        total_amount: 112.00
      };

      const itemsData = [{
        product_id: '4a5d263b-67fe-481d-8fc2-4ba8d2248b33', // Use existing product
        quantity: 2,
        unit_price: 50.00,
        total_price: 100.00
      }];

      const statusData = {
        status: 'pending',
        notes: 'Order created',
        changed_by_user_id: '00000000-0000-0000-0000-000000000000'
      };

      const { data: salesOrder, error: orderError } = await supabase
        .rpc('create_sales_order_transaction', {
          p_order_data: orderData,
          p_items_data: itemsData,
          p_status_data: statusData
        });

      if (orderError) {
        console.error('❌ Sales order creation error:', JSON.stringify(orderError, null, 2));
      } else {
        console.log('✅ Sales order created successfully:', salesOrder.id);
        console.log('Order items count:', salesOrder.order_items?.length || 0);
      }
    }

  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testSalesRPCFunctions();
