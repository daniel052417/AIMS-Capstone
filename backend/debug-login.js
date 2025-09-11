const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugLogin() {
  console.log('🔍 Debugging login process...');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Service Key present:', !!SUPABASE_SERVICE_KEY);
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Test 2: Check users table structure
    console.log('\n2. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users query failed:', usersError);
      return;
    }
    
    console.log('✅ Users table accessible');
    console.log('Users found:', users.length);
    if (users.length > 0) {
      console.log('Sample user structure:', Object.keys(users[0]));
      console.log('Sample user data:', users[0]);
    }

    // Test 3: Check for specific user
    console.log('\n3. Testing specific user lookup...');
    const testEmail = 'test@example.com';
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (userError) {
      console.log('❌ User lookup failed:', userError.message);
    } else if (user) {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        hasPasswordHash: !!user.password_hash,
        isActive: user.is_active,
        role: user.role
      });
    } else {
      console.log('ℹ️ No user found with email:', testEmail);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLogin();
