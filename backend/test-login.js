const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLogin() {
  console.log('🧪 Testing login functionality...');
  
  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  try {
    // Step 1: Check if user exists
    console.log('\n1️⃣ Checking if user exists...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (userError) {
      console.error('❌ User query failed:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ User not found. Please run: node create-test-user.js');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      hasPasswordHash: !!user.password_hash,
      isActive: user.is_active,
      role: user.role
    });

    // Step 2: Check password hash
    if (!user.password_hash) {
      console.log('❌ User has no password hash. Please run: node create-test-user.js');
      return;
    }

    // Step 3: Test password verification
    console.log('\n2️⃣ Testing password verification...');
    const isPasswordValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log('🔐 Password verification result:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('🎉 Login should work with these credentials:');
      console.log('   📧 Email:', testEmail);
      console.log('   🔑 Password:', testPassword);
    } else {
      console.log('❌ Password verification failed!');
      console.log('   This means the password hash in the database is incorrect.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLogin();
