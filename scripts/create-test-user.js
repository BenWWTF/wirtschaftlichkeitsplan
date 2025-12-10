const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

async function createTestUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Generate random password that meets Supabase requirements
  const testEmail = 'demo@example.com';
  const testPassword = 'DemoPassword123!@';

  try {
    console.log('👤 Creating test user account...\n');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      // Check if user already exists
      if (error.message.includes('already registered')) {
        console.log('✅ Test user already exists\n');
        console.log('📧 Email: ' + testEmail);
        console.log('🔐 Password: ' + testPassword);
        console.log('\n📝 You can now login at http://localhost:3000/login');
        process.exit(0);
      }
      throw error;
    }

    if (data.user) {
      console.log('✅ Test user created successfully!\n');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📧 Email: ' + testEmail);
      console.log('🔐 Password: ' + testPassword);
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('📝 Next steps:');
      console.log('1. Go to http://localhost:3000/login');
      console.log('2. Click "Anmelden" (Sign In)');
      console.log('3. Enter the credentials above');
      console.log('\n⚠️  Email confirmation:');
      if (data.user.user_metadata?.email_verified) {
        console.log('✅ Email is already verified - you can login immediately!');
      } else {
        console.log('⏳ Check your email for a confirmation link');
        console.log('🧪 Or use the demo mode button on the login page for instant access');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

createTestUser();
