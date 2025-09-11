const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('🔧 Creating test user...');
  
  // Test user data
  const testUser = {
    email: 'danieljohn052417@gmail.com',
    password: 'Palangga@24',
    first_name: 'Daniel John',
    last_name: 'Pepito',
    role: 'admin'
  };
 
  try {
    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', testUser.email)
      .single();

    if (existingUser) {
      console.log('⚠️ User already exists:', existingUser.email);
      console.log('   User ID:', existingUser.id);
      
      // Ask if we should update the password
      console.log('🔄 Updating password for existing user...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(testUser.password, saltRounds);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Failed to update password:', updateError);
        return;
      }
      
      console.log('✅ Password updated successfully!');
      console.log('📧 Email:', testUser.email);
      console.log('🔑 Password:', testUser.password);
      return;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking user existence:', checkError);
      return;
    }

    // Create new user
    console.log('👤 Creating new user...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(testUser.password, saltRounds);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: testUser.email,
        password_hash: passwordHash,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        role: testUser.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, role, is_active')
      .single();

    if (createError) {
      console.error('❌ Failed to create user:', createError);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('📧 Email:', newUser.email);
    console.log('🔑 Password:', testUser.password);
    console.log('👤 Name:', `${newUser.first_name} ${newUser.last_name}`);
    console.log('🎭 Role:', newUser.role);
    console.log('✅ Active:', newUser.is_active);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function listUsers() {
  console.log('📋 Listing all users in database...');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, password_hash')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Failed to fetch users:', error);
      return;
    }

    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   ✅ Active: ${user.is_active}`);
      console.log(`   🔐 Has Password: ${!!user.password_hash}`);
    });

  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  if (command === 'list') {
    await listUsers();
  } else {
    await createTestUser();
  }
}

main();
